import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';

const router = express.Router();

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

    // 이메일로 사용자 찾기
    const user = await User.findOne({ email: customer_email });

    if (!user) {
      console.error('❌ 사용자를 찾을 수 없습니다:', customer_email);
      return;
    }

    // Pro 권한 활성화
    user.isPro = true;
    user.isPremium = true; // 기존 시스템과 호환
    user.polarCustomerId = customer_id;
    user.polarSubscriptionId = subscription_id;
    user.proExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1년 후

    await user.save();

    console.log('✅ Pro 권한 활성화 완료:', user.email);
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
