# Resend 도메인 설정 가이드 (Pro 플랜)

## 문제 상황

Pro 플랜이지만 `onboarding@resend.dev`를 사용하면 여전히 제한이 있습니다.
- `onboarding@resend.dev`는 **테스트 전용 도메인**
- 모든 플랜에서 인증된 이메일로만 전송 가능
- Pro 플랜의 이점을 활용하려면 **커스텀 도메인 필요**

## 해결 방법

### 옵션 1: 커스텀 도메인 추가 (권장)

1. [Resend 도메인 페이지](https://resend.com/domains) 접속
2. "Add Domain" 클릭
3. 도메인 입력 (예: `yourdomain.com`)
4. DNS 레코드 추가:
   - SPF 레코드
   - DKIM 레코드
   - DMARC 레코드 (선택사항)
5. 도메인 인증 완료 대기 (보통 몇 분 ~ 24시간)

도메인 인증 후 코드 수정:

```javascript
// server/utils/email.js
from: 'AdCookingClass <noreply@yourdomain.com>'
```

### 옵션 2: 특정 이메일 주소 인증 (빠른 테스트용)

도메인이 없다면 특정 이메일 주소를 인증할 수 있습니다:

1. [Resend 이메일 페이지](https://resend.com/emails) 접속
2. "Add Email" 클릭
3. `jjhhkkang@gmail.com` 입력
4. Gmail에서 인증 링크 클릭
5. 인증 완료

이 방법은 해당 이메일로만 테스트 가능합니다.

### 옵션 3: 현재 인증된 이메일 사용

`junsumon090608@dgsw.hs.kr`는 이미 인증되어 있으므로 이 이메일로 회원가입하면 즉시 이메일을 받을 수 있습니다.

## 추천 방법

**개발/테스트 단계**: 옵션 2 (이메일 인증) - 5분 소요
**프로덕션 단계**: 옵션 1 (도메인 인증) - 전문적이고 신뢰도 높음

## 참고

- Pro 플랜의 장점 (월 50,000 이메일, 일일 제한 없음)은 **커스텀 도메인 사용 시**에만 완전히 활용 가능
- `onboarding@resend.dev`는 플랜과 관계없이 항상 제한적
