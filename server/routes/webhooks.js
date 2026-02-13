import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// Resend webhook 시크릿 (환경 변수에서 가져오기)
const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

// Webhook 서명 검증 함수
function verifyWebhookSignature(payload, signature) {
  if (!WEBHOOK_SECRET) {
    console.warn('⚠️  RESEND_WEBHOOK_SECRET이 설정되지 않았습니다. 서명 검증을 건너뜁니다.');
    return true;
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// Resend webhook 엔드포인트
router.post('/resend', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // 서명 검증
    const signature = req.headers['resend-signature'];
    const payload = req.body.toString();

    if (signature && !verifyWebhookSignature(payload, signature)) {
      console.error('❌ Webhook 서명 검증 실패');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 이벤트 파싱
    const event = JSON.parse(payload);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📨 Resend Webhook 이벤트 수신');
    console.log('   - 타입:', event.type);
    console.log('   - 시간:', event.created_at);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 이벤트 타입별 처리
    switch (event.type) {
      case 'email.sent':
        console.log('✅ 이메일 전송 성공:', event.data.email_id);
        console.log('   - 수신자:', event.data.to);
        console.log('   - 제목:', event.data.subject);
        break;

      case 'email.delivered':
        console.log('✅ 이메일 전달 완료:', event.data.email_id);
        console.log('   - 수신자:', event.data.to);
        break;

      case 'email.delivery_delayed':
        console.log('⏳ 이메일 전달 지연:', event.data.email_id);
        console.log('   - 수신자:', event.data.to);
        break;

      case 'email.complained':
        console.log('⚠️  스팸 신고:', event.data.email_id);
        console.log('   - 수신자:', event.data.to);
        // TODO: 스팸 신고 처리 로직 추가
        break;

      case 'email.bounced':
        console.log('❌ 이메일 반송:', event.data.email_id);
        console.log('   - 수신자:', event.data.to);
        console.log('   - 이유:', event.data.bounce_type);
        // TODO: 반송 처리 로직 추가 (예: 사용자에게 알림)
        break;

      case 'email.opened':
        console.log('👁️  이메일 열람:', event.data.email_id);
        console.log('   - 수신자:', event.data.to);
        break;

      case 'email.clicked':
        console.log('🖱️  링크 클릭:', event.data.email_id);
        console.log('   - 수신자:', event.data.to);
        console.log('   - URL:', event.data.link);
        break;

      case 'email.received':
        console.log('📬 이메일 수신:', event.data.email_id);
        console.log('   - 발신자:', event.data.from);
        console.log('   - 수신자:', event.data.to);
        console.log('   - 제목:', event.data.subject);
        
        if (event.data.attachments && event.data.attachments.length > 0) {
          console.log('   - 첨부파일:', event.data.attachments.length, '개');
          event.data.attachments.forEach(att => {
            console.log(`     • ${att.filename} (${att.content_type})`);
          });
        }
        break;

      default:
        console.log('ℹ️  알 수 없는 이벤트 타입:', event.type);
    }

    // 200 응답 반환 (Resend에게 성공적으로 받았다고 알림)
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Webhook 처리 중 오류:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// 헬스 체크
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Webhook endpoint is ready',
    webhookSecretConfigured: !!WEBHOOK_SECRET
  });
});

export default router;
