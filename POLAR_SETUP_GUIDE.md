# Polar.sh 구독 기능 설정 가이드

## 📋 개요
애드쿠킹클래스에 Polar.sh를 이용한 월 $3 Pro 구독 기능이 추가되었습니다.

## 🎯 구현된 기능

### 1. User 모델 확장
- `isPro`: Pro 구독 여부
- `proExpiresAt`: Pro 구독 만료일
- `polarCustomerId`: Polar 고객 ID
- `polarSubscriptionId`: Polar 구독 ID

### 2. Webhook 엔드포인트
- `POST /api/polar/webhook`: Polar.sh 이벤트 수신
- 서명 검증 포함
- 구독 생성/업데이트/취소/철회 처리

### 3. 프론트엔드
- 메인 랜딩 페이지 추가
- Pro 구독 버튼
- 회원가입 페이지 연결

## 🚀 설정 단계

### 1단계: Polar.sh 계정 설정

1. [Polar.sh](https://polar.sh) 가입
2. 새 Product 생성
   - 이름: "AdCookingClass Pro"
   - 가격: $3/월
   - 타입: Subscription

3. Product ID 복사

### 2단계: Webhook 설정

1. Polar.sh 대시보드 → Settings → Webhooks
2. 새 Webhook 추가:
   ```
   URL: https://your-domain.com/api/polar/webhook
   Events: 
   - subscription.created
   - subscription.updated
   - subscription.canceled
   - subscription.revoked
   ```

3. Webhook Secret 복사

### 3단계: 환경 변수 설정

`.env` 파일에 추가:

```env
# Polar.sh 설정
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
POLAR_PRODUCT_ID=prod_xxxxxxxxxxxxx
```

### 4단계: 서버 재시작

```bash
npm run server
```

## 🧪 테스트

### 로컬 테스트 (ngrok 사용)

1. ngrok 설치 및 실행:
```bash
ngrok http 3000
```

2. ngrok URL을 Polar Webhook에 등록:
```
https://xxxx-xx-xx-xx-xx.ngrok.io/api/polar/webhook
```

3. Polar.sh에서 테스트 구독 생성

4. 서버 로그 확인:
```
✅ 구독 생성: { customerId: 'cus_xxx', subscriptionId: 'sub_xxx', email: 'test@example.com' }
✅ Pro 권한 활성화 완료: test@example.com
```

## 📊 Webhook 이벤트 처리

### subscription.created
- Pro 권한 활성화
- `isPro = true`
- `isPremium = true`
- `proExpiresAt` 설정 (1년)

### subscription.updated
- 구독 상태에 따라 권한 업데이트
- `active`: Pro 유지
- `canceled`, `past_due`: Pro 제거

### subscription.canceled
- Pro 권한 즉시 제거
- `isPro = false`
- `isPremium = false`

### subscription.revoked
- 환불 등으로 구독 철회
- Pro 권한 즉시 제거
- 구독 ID 초기화

## 🔒 보안

### Webhook 서명 검증
```javascript
function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

### API 권한 체크 예시
```javascript
// 보호된 API 예시
router.get('/premium-feature', authenticate, async (req, res) => {
  // Pro 권한 체크
  if (!req.user.isPro || req.user.proExpiresAt < new Date()) {
    return res.status(403).json({ 
      error: 'Pro 구독이 필요합니다',
      upgradeUrl: 'https://polar.sh/adcookingclass/subscriptions'
    });
  }

  // Pro 기능 제공
  res.json({ data: 'premium content' });
});
```

## 🎨 프론트엔드 통합

### Pro 구독 버튼
```jsx
<button 
  className="btn-pro-subscribe"
  onClick={() => window.open('https://polar.sh/adcookingclass/subscriptions', '_blank')}
>
  <span className="pro-badge-icon">⭐</span>
  Pro 구독하기 - $3/월
</button>
```

### Pro 상태 확인
```javascript
const checkProStatus = async () => {
  const response = await fetch('/api/polar/subscription-status', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.isPro;
};
```

## 📱 사용자 플로우

1. **메인 페이지 방문**
   - "Pro 구독하기" 버튼 표시
   - 무료 기능 체험 가능

2. **Pro 구독 클릭**
   - Polar.sh 결제 페이지로 이동
   - 이메일 입력 및 결제

3. **결제 완료**
   - Webhook으로 서버에 알림
   - 자동으로 Pro 권한 활성화

4. **Pro 기능 사용**
   - 식사 기록 저장
   - AI 맞춤 레시피
   - 영양 분석

5. **구독 취소**
   - Polar.sh에서 구독 취소
   - Webhook으로 권한 제거

## 🐛 트러블슈팅

### Webhook이 작동하지 않을 때
1. Webhook URL 확인
2. HTTPS 사용 확인 (프로덕션)
3. 서명 검증 로그 확인
4. Polar.sh 대시보드에서 Webhook 로그 확인

### Pro 권한이 활성화되지 않을 때
1. 서버 로그 확인
2. 이메일 주소 일치 확인
3. MongoDB에서 사용자 확인:
```bash
mongosh cooking-app
db.users.findOne({ email: 'user@example.com' })
```

### 로컬 테스트 시
- ngrok 사용 필수 (Polar는 HTTPS 필요)
- Webhook Secret 정확히 입력
- 서버 재시작 후 테스트

## 📚 참고 자료

- [Polar.sh 문서](https://docs.polar.sh)
- [Webhook 가이드](https://docs.polar.sh/webhooks)
- [구독 관리](https://docs.polar.sh/subscriptions)

## ✅ 체크리스트

- [ ] Polar.sh 계정 생성
- [ ] Product 생성 ($3/월)
- [ ] Webhook 설정
- [ ] 환경 변수 설정
- [ ] 서버 재시작
- [ ] ngrok으로 로컬 테스트
- [ ] 테스트 구독 생성
- [ ] Pro 권한 확인
- [ ] 구독 취소 테스트
- [ ] 프로덕션 배포

## 🎉 완료!

이제 사용자들이 Pro 구독을 통해 프리미엄 기능을 이용할 수 있습니다!
