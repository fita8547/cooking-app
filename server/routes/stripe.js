import express from 'express';
import Stripe from 'stripe';
import User from '../models/User.js';

const router = express.Router();

// Stripe 초기화
function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey || secretKey === 'your_stripe_secret_key_here') {
    return null;
  }
  
  return new Stripe(secretKey);
}

/**
 * Stripe Checkout Session 생성
 * POST /api/stripe/create-checkout-session
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { email } = req.body;
    const stripe = getStripeClient();

    // 데모 모드
    if (!stripe) {
      console.log('⚠️  Stripe API 키 없음 - 데모 모드');
      return res.json({
        demo: true,
        url: `${process.env.FRONTEND_URL}/?payment=success&demo=true`
      });
    }

    // Stripe Checkout Session 생성
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '애드쿠킹클래스 Pro',
              description: 'AI 기반 맞춤 레시피 추천 및 식단 관리',
            },
            unit_amount: 300, // $3.00 (cents)
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout?canceled=true`,
      customer_email: email,
      metadata: {
        email: email,
      },
    });

    console.log('✅ Stripe Checkout Session 생성:', session.id);

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('❌ Stripe Checkout 생성 오류:', error);
    res.status(500).json({
      error: '결제 세션 생성 중 오류가 발생했습니다',
      message: error.message,
    });
  }
});

/**
 * Stripe Webhook 처리
 * POST /api/stripe/webhook
 * 주의: raw body는 server/index.js에서 이미 처리됨
 */
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripeClient();

  if (!stripe || !webhookSecret || webhookSecret === 'your_stripe_webhook_secret_here') {
    console.log('⚠️  Stripe Webhook Secret 없음');
    return res.status(400).send('Webhook secret not configured');
  }

  let event;

  try {
    // 서명 검증
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log('✅ Webhook 서명 검증 성공:', event.type);
  } catch (err) {
    console.error('❌ Webhook 서명 검증 실패:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 이벤트 타입 확인 및 처리
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`⚠️  처리되지 않은 이벤트 타입: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook 처리 오류:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Checkout 완료 처리
 */
async function handleCheckoutCompleted(session) {
  console.log('💳 Checkout 완료:', session.id);
  
  const customerEmail = session.customer_email || session.metadata?.email;
  const subscriptionId = session.subscription;

  if (!customerEmail) {
    console.error('❌ 이메일 정보 없음');
    return;
  }

  // 유저 찾기 (이메일로)
  let user = await User.findOne({ email: customerEmail });

  if (!user) {
    console.log('⚠️  유저 없음, 새로 생성:', customerEmail);
    // 유저가 없으면 생성 (선택사항)
    user = new User({
      email: customerEmail,
      name: customerEmail.split('@')[0],
      username: customerEmail.split('@')[0],
      password: 'stripe-user-' + Date.now(), // 임시 비밀번호
    });
  }

  // Pro 상태 업데이트
  user.isPro = true;
  user.proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30일 후
  user.stripeCustomerId = session.customer;
  user.stripeSubscriptionId = subscriptionId;

  await user.save();

  console.log('✅ 유저 Pro 상태 활성화:', user.email);
}

/**
 * 구독 생성 처리
 */
async function handleSubscriptionCreated(subscription) {
  console.log('📝 구독 생성:', subscription.id);

  const customerId = subscription.customer;
  const stripe = getStripeClient();

  // Customer 정보 가져오기
  const customer = await stripe.customers.retrieve(customerId);
  const email = customer.email;

  if (!email) {
    console.error('❌ Customer 이메일 없음');
    return;
  }

  // 유저 찾기 및 업데이트
  const user = await User.findOne({ email });

  if (user) {
    user.isPro = true;
    user.proExpiresAt = new Date(subscription.current_period_end * 1000);
    user.stripeCustomerId = customerId;
    user.stripeSubscriptionId = subscription.id;
    await user.save();

    console.log('✅ 구독 활성화:', user.email);
  }
}

/**
 * 구독 업데이트 처리
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 구독 업데이트:', subscription.id);

  const user = await User.findOne({ stripeSubscriptionId: subscription.id });

  if (user) {
    // 구독 상태에 따라 Pro 상태 업데이트
    if (subscription.status === 'active') {
      user.isPro = true;
      user.proExpiresAt = new Date(subscription.current_period_end * 1000);
    } else if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
      user.isPro = false;
    }

    await user.save();
    console.log('✅ 구독 상태 업데이트:', user.email, subscription.status);
  }
}

/**
 * 구독 취소 처리
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('❌ 구독 취소:', subscription.id);

  const user = await User.findOne({ stripeSubscriptionId: subscription.id });

  if (user) {
    user.isPro = false;
    user.proExpiresAt = null;
    await user.save();

    console.log('✅ Pro 상태 비활성화:', user.email);
  }
}

/**
 * 결제 성공 처리
 */
async function handlePaymentSucceeded(invoice) {
  console.log('💰 결제 성공:', invoice.id);

  const subscriptionId = invoice.subscription;
  const user = await User.findOne({ stripeSubscriptionId: subscriptionId });

  if (user) {
    // 다음 결제일 업데이트
    user.proExpiresAt = new Date(invoice.period_end * 1000);
    await user.save();

    console.log('✅ 결제 갱신:', user.email);
  }
}

/**
 * 결제 실패 처리
 */
async function handlePaymentFailed(invoice) {
  console.log('⚠️  결제 실패:', invoice.id);

  const subscriptionId = invoice.subscription;
  const user = await User.findOne({ stripeSubscriptionId: subscriptionId });

  if (user) {
    // 결제 실패 알림 (이메일 등)
    console.log('⚠️  결제 실패 알림 필요:', user.email);
  }
}

export default router;
