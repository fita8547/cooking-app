import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();

/**
 * Polar Checkout 생성 엔드포인트
 * POST /api/polar/create-checkout
 */
router.post('/create-checkout', async (req, res) => {
  try {
    const { successUrl } = req.body;
    const checkoutLink = process.env.POLAR_CHECKOUT_LINK;
    const productId = process.env.POLAR_PRODUCT_ID;

    // Checkout Link가 설정되어 있으면 사용
    if (checkoutLink && checkoutLink !== 'https://polar.sh/your-org/products/065fce9e-95e6-44cb-8559-f98b350eb948') {
      console.log('✅ Polar Checkout Link 사용:', checkoutLink);
      
      // Success URL을 쿼리 파라미터로 추가
      const finalUrl = `${checkoutLink}?success_url=${encodeURIComponent(successUrl || `${process.env.FRONTEND_URL}/?payment=success`)}`;
      
      return res.json({ 
        url: finalUrl,
        productId 
      });
    }

    // 데모 모드: Product ID가 없으면 결제 성공 페이지로 바로 이동
    if (!productId || productId === 'your_polar_product_id_here') {
      console.log('⚠️  POLAR_PRODUCT_ID가 설정되지 않음 - 데모 모드로 작동');
      console.log('💡 실제 결제를 사용하려면 .env 파일에 POLAR_CHECKOUT_LINK를 설정하세요');
      
      // 데모 모드: 바로 성공 페이지로 리다이렉트
      const demoSuccessUrl = successUrl || `${process.env.FRONTEND_URL}/?payment=success`;
      
      return res.json({ 
        url: demoSuccessUrl,
        demo: true,
        message: '데모 모드: 실제 결제 없이 성공 페이지로 이동합니다'
      });
    }

    // Fallback: Organization 이름을 알 수 없으므로 에러 메시지 반환
    console.error('❌ POLAR_CHECKOUT_LINK가 설정되지 않았습니다');
    return res.status(500).json({ 
      error: 'Polar Checkout Link가 설정되지 않았습니다. Polar 대시보드에서 Product 페이지 URL을 복사하여 .env 파일의 POLAR_CHECKOUT_LINK에 설정해주세요.',
      instructions: 'Polar Dashboard → Products → 해당 Product 클릭 → URL 복사'
    });
  } catch (error) {
    console.error('❌ Checkout 생성 오류:', error);
    res.status(500).json({ 
      error: '체크아웃 생성 중 오류가 발생했습니다',
      message: error.message 
    });
  }
});

/**
 * Polar.sh Webhook 서명 검증
 */
function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

/**
 * Polar.sh Webhook 엔드포인트
 * POST /api/polar/webhook
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-polar-signature'];
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('❌ POLAR_WEBHOOK_SECRET이 설정되지 않았습니다');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // 서명 검증
    const payload = req.body.toString('utf8');
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error('❌ Webhook 서명 검증 실패');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(payload);
    console.log('📨 Polar Webhook 수신:', event.type);

    switch (event.type) {
      case 'subscription.created':
        await handleSubscriptionCreated(event.data);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data);
        break;

      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.data);
        break;

      case 'subscription.revoked':
        await handleSubscriptionRevoked(event.data);
        break;

      default:
        console.log('⚠️  처리되지 않은 이벤트 타입:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook 처리 오류:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * 구독 생성 처리
 */
async function handleSubscriptionCreated(subscription) {
  try {
    const { customer_id, id: subscription_id, customer_email } = subscription;

    console.log('✅ 구독 생성:', {
      customerId: customer_id,
      subscriptionId: subscription_id,
      email: customer_email
    });

    // 이메일로 사용자 찾기 또는 생성
    let user = await User.findOne({ email: customer_email });

    if (!user) {
      console.log('📝 새 Pro 사용자 생성:', customer_email);
      
      // 임시 비밀번호 생성 (사용자는 이메일로만 로그인)
      const tempPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      user = new User({
        email: customer_email,
        name: customer_email.split('@')[0], // 이메일 앞부분을 이름으로
        password: hashedPassword,
        isEmailVerified: true, // 결제 완료했으므로 인증된 것으로 간주
        isPro: true,
        isPremium: true,
        polarCustomerId: customer_id,
        polarSubscriptionId: subscription_id,
        proExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });
      
      await user.save();
      console.log('✅ 새 Pro 사용자 생성 완료:', user.email);
    } else {
      // 기존 사용자 Pro 권한 활성화
      user.isPro = true;
      user.isPremium = true;
      user.polarCustomerId = customer_id;
      user.polarSubscriptionId = subscription_id;
      user.proExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      await user.save();
      console.log('✅ 기존 사용자 Pro 권한 활성화 완료:', user.email);
    }
  } catch (error) {
    console.error('❌ 구독 생성 처리 오류:', error);
    throw error;
  }
}

/**
 * 구독 업데이트 처리
 */
async function handleSubscriptionUpdated(subscription) {
  try {
    const { customer_id, id: subscription_id, status } = subscription;

    console.log('🔄 구독 업데이트:', {
      customerId: customer_id,
      subscriptionId: subscription_id,
      status
    });

    const user = await User.findOne({ polarCustomerId: customer_id });

    if (!user) {
      console.error('❌ 사용자를 찾을 수 없습니다:', customer_id);
      return;
    }

    // 구독 상태에 따라 처리
    if (status === 'active') {
      user.isPro = true;
      user.isPremium = true;
      user.proExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    } else if (status === 'canceled' || status === 'past_due') {
      user.isPro = false;
      user.isPremium = false;
      user.proExpiresAt = new Date(); // 즉시 만료
    }

    await user.save();

    console.log('✅ 구독 업데이트 완료:', user.email);
  } catch (error) {
    console.error('❌ 구독 업데이트 처리 오류:', error);
    throw error;
  }
}

/**
 * 구독 취소 처리
 */
async function handleSubscriptionCanceled(subscription) {
  try {
    const { customer_id } = subscription;

    console.log('❌ 구독 취소:', { customerId: customer_id });

    const user = await User.findOne({ polarCustomerId: customer_id });

    if (!user) {
      console.error('❌ 사용자를 찾을 수 없습니다:', customer_id);
      return;
    }

    // Pro 권한 제거
    user.isPro = false;
    user.isPremium = false;
    user.proExpiresAt = new Date(); // 즉시 만료

    await user.save();

    console.log('✅ Pro 권한 제거 완료:', user.email);
  } catch (error) {
    console.error('❌ 구독 취소 처리 오류:', error);
    throw error;
  }
}

/**
 * 구독 철회 처리 (환불 등)
 */
async function handleSubscriptionRevoked(subscription) {
  try {
    const { customer_id } = subscription;

    console.log('🔙 구독 철회:', { customerId: customer_id });

    const user = await User.findOne({ polarCustomerId: customer_id });

    if (!user) {
      console.error('❌ 사용자를 찾을 수 없습니다:', customer_id);
      return;
    }

    // Pro 권한 즉시 제거
    user.isPro = false;
    user.isPremium = false;
    user.proExpiresAt = new Date();
    user.polarSubscriptionId = null;

    await user.save();

    console.log('✅ 구독 철회 처리 완료:', user.email);
  } catch (error) {
    console.error('❌ 구독 철회 처리 오류:', error);
    throw error;
  }
}

/**
 * 사용자의 구독 상태 확인
 * GET /api/polar/subscription-status
 */
router.get('/subscription-status', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '인증이 필요합니다' });
    }

    // 토큰에서 사용자 ID 추출 (간단한 구현)
    const user = await User.findOne({ /* 토큰 검증 로직 */ });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    res.json({
      isPro: user.isPro,
      proExpiresAt: user.proExpiresAt,
      hasActiveSubscription: user.isPro && user.proExpiresAt > new Date()
    });
  } catch (error) {
    console.error('구독 상태 확인 오류:', error);
    res.status(500).json({ error: '구독 상태 확인 실패' });
  }
});

export default router;
