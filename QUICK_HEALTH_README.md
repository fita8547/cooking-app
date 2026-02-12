# Quick 건강기록 기능

로그인 직후 사용자에게 최소한의 건강 정보를 입력받아 개인화된 레시피 추천을 제공하는 온보딩 화면입니다.

## 📋 기능 개요

### UX 목표
- 사용자에게 최소 입력만 요구 (Quick 건강기록)
- 더 개인화를 원하면 "구체적으로 더 작성하기"로 상세 입력 섹션 펼치기
- "나중에 입력하는 것도 가능합니다"로 부담 낮추기
- Skip / SAVE 두 버튼 항상 제공

### 화면 구성

1. **상단 헤드라인**: "Quick 건강기록"
2. **설명 문구**: "더 개인화된 레시피 추천을 원한다면 진행해주세요. 나중에 입력하는 것도 가능합니다."
3. **Quick 입력 필드** (최소, 모두 선택사항):
   - 알러지 (텍스트 태그 입력)
   - 식단 목표 (드롭다운: 체중감량/유지/증량/건강관리)
   - 선호 (버튼 선택: 한식/간편식/고단백/저탄수화물/채식)
4. **상세 입력 토글**: "구체적으로 더 작성하기" (클릭 시 expand/collapse)
5. **상세 입력 섹션** (펼치면 보임):
   - 키 (cm): 50-250 범위
   - 체중 (kg): 10-300 범위
   - 나이: 1-120 범위
   - 실시간 유효성 검사 및 에러 표시
6. **하단 고정 CTA** (sticky):
   - 좌측: Skip 버튼
   - 우측: SAVE 버튼 (primary)

## 🚀 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일에 다음 설정:
```env
MONGODB_URI=mongodb://localhost:27017/cooking-app
JWT_SECRET=your-secret-key
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3. 서버 실행
```bash
# 터미널 1: 백엔드
npm run server:dev

# 터미널 2: 프론트엔드
npm run dev
```

### 4. 테스트 실행
```bash
# 유효성 검사 테스트 (property-based)
npx vitest run server/tests/quick-health.test.js
```

## 📁 파일 구조

```
프론트엔드:
├── src/components/QuickHealthInfo.jsx    # 메인 컴포넌트
└── src/services/api.js                   # API 클라이언트 (기존)

백엔드:
├── server/routes/profile.js              # Quick 건강기록 API
├── server/index.js                       # 라우트 등록
└── server/tests/quick-health.test.js     # 유효성 검사 테스트
```

## 🔌 API 명세

### POST /api/profile/health

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "allergies": ["우유", "땅콩"],           // optional, string[]
  "goal": "lose",                          // optional, "lose"|"maintain"|"gain"|"health"
  "preferences": ["korean", "high-protein"], // optional, string[]
  "heightCm": 170,                         // optional, number (50-250)
  "weightKg": 70,                          // optional, number (10-300)
  "age": 30                                // optional, number (1-120)
}
```

**Response 200:**
```json
{
  "ok": true
}
```

**Response 400:**
```json
{
  "message": "키는 50-250 범위로 입력해주세요"
}
```

## ✅ 테스트

### 유효성 검사 함수 (Property-Based Testing)

모든 유효성 검사 함수는 fast-check를 사용한 property-based 테스트로 검증됩니다:

1. **Height Validation**
   - 범위 내 값 (50-250): 항상 valid
   - 범위 외 값: 항상 invalid
   - 100회 랜덤 테스트

2. **Weight Validation**
   - 범위 내 값 (10-300): 항상 valid
   - 범위 외 값: 항상 invalid
   - 100회 랜덤 테스트

3. **Age Validation**
   - 범위 내 값 (1-120): 항상 valid
   - 범위 외 값: 항상 invalid
   - 100회 랜덤 테스트

4. **Combined Validation**
   - 모든 필드가 유효한 조합: 항상 통과
   - 100회 랜덤 조합 테스트

### 테스트 실행 결과
```bash
✓ server/tests/quick-health.test.js (15 tests) 106ms
  ✓ Quick Health Validation (15)
    ✓ Height Validation (4)
    ✓ Weight Validation (4)
    ✓ Age Validation (4)
    ✓ Combined Validation (3)

Test Files  1 passed (1)
Tests  15 passed (15)
```

## 🎨 UI 특징

### 반응형 디자인
- 모바일: 하단 sticky 버튼이 가려지지 않도록 padding-bottom 확보
- 태블릿/데스크톱: 최대 너비 560px, 중앙 정렬

### 인터랙션
- 알러지 입력: Enter 키로 태그 추가
- 선호 버튼: 토글 선택 (다중 선택 가능)
- 상세 폼: 펼치기/접기 애니메이션
- 실시간 유효성 검사: 입력 중 에러 표시

### 아이콘
- lucide-react 사용
  - HeartPulse: 헤더 아이콘
  - ChevronDown/ChevronUp: 토글 버튼
  - AlertCircle: 에러 배너
  - Loader2: 로딩 스피너

## 🔄 동작 흐름

### Skip 버튼
```
사용자 클릭 → onSkip() 호출 → 다음 단계로 이동 (저장 없음)
```

### SAVE 버튼
```
1. 유효성 검사
   ├─ 상세 폼 값이 있으면 범위 검사
   └─ 유효하지 않으면 에러 표시 및 중단

2. API 요청
   ├─ 입력된 값만 payload에 포함
   ├─ 알러지 문자열 배열 → 객체 배열 변환 (백엔드)
   └─ 식단 목표 매핑 (lose → weight_loss)

3. 응답 처리
   ├─ 성공: onComplete() 호출 → 다음 단계
   └─ 실패: 에러 배너 표시
```

## 📝 TODO / 확장 포인트

### 프론트엔드
- [ ] TypeScript 마이그레이션 (현재 JSX)
- [ ] react-router-dom 통합
- [ ] 입력 값 로컬 스토리지 임시 저장
- [ ] 알러지 자동완성 기능
- [ ] 선호 옵션 서버에서 동적 로드

### 백엔드
- [ ] MongoDB 스키마 정의 및 연결
- [ ] 건강 정보 업데이트 API (PUT)
- [ ] 건강 정보 조회 API (GET)
- [ ] 입력 값 기반 영양 목표 자동 계산
- [ ] 알러지 데이터베이스 정규화

### 테스트
- [ ] 프론트엔드 컴포넌트 테스트 (Vitest + Testing Library)
- [ ] API 통합 테스트 (MSW)
- [ ] E2E 테스트 (Playwright)

## 🐛 알려진 이슈

없음 (현재 모든 테스트 통과)

## 📚 참고 자료

- [fast-check 문서](https://github.com/dubzzz/fast-check)
- [lucide-react 아이콘](https://lucide.dev/)
- [Vitest 문서](https://vitest.dev/)

## 🤝 기여

이 기능은 기존 온보딩 플로우를 개선한 버전입니다. 추가 개선 사항이나 버그 리포트는 이슈로 등록해주세요.
