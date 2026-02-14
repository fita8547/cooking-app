# Polar.sh 실제 결제 사용 가이드

## 현재 상태

✅ **Product ID 설정 완료**: `065fce9e-95e6-44cb-8559-f98b350eb948`

이제 실제 결제를 받을 수 있습니다!

## 실제 결제를 사용하는 방법

### 1단계: 서버 재시작

`.env` 파일에 Product ID가 추가되었으므로 서버를 재시작해야 합니다.

```bash
# 터미널에서 실행
npm run server
```

### 2단계: 테스트

1. 브라우저에서 `http://localhost:5173` 접속
2. "Pro 구독하기" 버튼 클릭
3. "구독하기 ($3/월)" 버튼 클릭
4. **Polar 결제 페이지로 자동 이동**됩니다

### 3단계: 결제 테스트

Polar 결제 페이지에서 테스트 카드로 결제할 수 있습니다:

**테스트 카드 정보:**
- 카드 번호: `4242 4242 4242 4242`
- 만료일: 미래 날짜 (예: `12/25`)
- CVC: 아무 3자리 (예: `123`)
- 이름: 아무 이름

## Webhook 설정 (선택사항, 권장)

Webhook을 설정하면 결제 성공 시 자동으로 사용자의 Pro 상태가 업데이트됩니다.

### Webhook이 필요한 이유

- ✅ 결제 성공 시 자동으로 사용자 Pro 상태 업데이트
- ✅ 구독 취소 시 자동으로 Pro 상태 해제
- ✅ 결제 실패 시 알림

### Webhook 설정 방법

#### 1. Polar 대시보드 접속

1. [Polar.sh](https://polar.sh) 로그인
2. Settings → Webhooks 메뉴

#### 2. Webhook 생성

**로컬 테스트용 (ngrok 필요):**

```bash
# ngrok 설치 (Mac)
brew install ngrok

# ngrok 실행
ngrok http 3000
```

ngrok이 제공하는 URL (예: `https://abc123.ngrok.io`)을 사용하여:
- Webhook URL: `https://abc123.ngrok.io/api/polar/webhook`

**프로덕션용:**
- Webhook URL: `https://your-domain.com/api/polar/webhook`

#### 3. 이벤트 선택

다음 이벤트를 선택하세요:
- ✅ `subscription.created`
- ✅ `subscription.updated`
- ✅ `subscription.canceled`
- ✅ `subscription.revoked`

#### 4. Webhook Secret 복사

1. Webhook 생성 후 "Signing Secret" 복사
2. `.env` 파일 열기
3. 다음 줄 수정:
   ```
   POLAR_WEBHOOK_SECRET=whsec_복사한_시크릿
   ```
4. 서버 재시작

## 결제 플로우

### 사용자 관점

1. "Pro 구독하기" 클릭
2. 결제 페이지로 이동
3. "구독하기 ($3/월)" 클릭
4. Polar 결제 페이지에서 카드 정보 입력
5. 결제 완료
6. 성공 페이지로 돌아옴
7. Pro 기능 사용 가능!

### 기술적 플로우

```
사용자 클릭
    ↓
프론트엔드: /api/polar/create-checkout 호출
    ↓
백엔드: Polar Checkout URL 생성
    ↓
프론트엔드: Polar 페이지로 리다이렉트
    ↓
사용자: 카드 정보 입력 및 결제
    ↓
Polar: 결제 처리
    ↓
Polar: Webhook 호출 (subscription.created)
    ↓
백엔드: 사용자 Pro 상태 업데이트
    ↓
Polar: 성공 URL로 리다이렉트
    ↓
프론트엔드: 성공 페이지 표시
```

## 문제 해결

### "데모 모드" 메시지가 나올 때

서버가 재시작되지 않았을 수 있습니다:
```bash
npm run server
```

### Polar 페이지로 이동하지 않을 때

1. 브라우저 콘솔(F12) 확인
2. 서버 로그 확인
3. Product ID가 정확한지 확인

### 결제 후 Pro 상태가 업데이트되지 않을 때

Webhook이 설정되지 않았을 수 있습니다. 위의 "Webhook 설정" 섹션을 참고하세요.

## 프로덕션 배포 시

### 환경 변수 설정

배포 플랫폼(Vercel, Heroku 등)에서 다음 환경 변수를 설정하세요:

```
POLAR_PRODUCT_ID=065fce9e-95e6-44cb-8559-f98b350eb948
POLAR_WEBHOOK_SECRET=whsec_your_secret
FRONTEND_URL=https://your-domain.com
```

### Webhook URL 업데이트

Polar 대시보드에서 Webhook URL을 프로덕션 도메인으로 변경:
```
https://your-domain.com/api/polar/webhook
```

## 요금 정보

- **구독료**: $3/월
- **Polar 수수료**: 약 5% + $0.30 (Stripe 수수료 포함)
- **실제 수령액**: 약 $2.55/월

## 지원

문제가 발생하면:
- Polar 문서: https://docs.polar.sh
- Polar Discord: https://discord.gg/polar
- 서버 로그 및 브라우저 콘솔 확인
