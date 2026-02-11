# 애드쿠킹클래스 프로젝트 인수인계 문서

작성일: 2026-02-11
작성자: 준수님 → 강제형님

---

## 📋 프로젝트 개요

**프로젝트명**: 애드쿠킹클래스 (AdHoc Cooking Class)
**목적**: 냉장고 재료 기반 AI 레시피 추천 및 요리 코칭 서비스
**기술 스택**: 
- Frontend: React (Vite), Lucide Icons
- Backend: Node.js, Express, MongoDB Atlas
- AI: OpenAI API (예송님 담당)
- 인증: JWT, Resend (이메일)
- 배포: Vercel

---

## ✅ 완료된 작업 (준수님)

- [x] Vite + React 프로젝트 생성
- [x] Git 저장소 초기화 및 GitHub 연동
- [x] 브랜치 전략 수립 (main ← dev ← feature/N)
- [x] CONTRIBUTING.md 및 PR 템플릿 작성
- [x] 기본 UI 컴포넌트 구현 (홈, 레시피 추천, 건강 식단, 식사 기록, 요리 코칭)
- [x] 로그인/회원가입 UI
- [x] 반응형 디자인 및 애니메이션
- [x] 재료 입력 및 필터링 기능
- [x] 레시피 카드 및 상세 정보 표시
- [x] Express 서버 기본 구조
- [x] MongoDB Atlas 연결
- [x] Mongoose 데이터 모델 생성 (User, Recipe, Ingredient, Meal)
- [x] JWT 기반 인증 구현
- [x] bcryptjs 비밀번호 암호화
- [x] 회원가입, 로그인, 비밀번호 변경 API
- [x] 인증 미들웨어 구현
- [x] 프론트엔드 인증 플로우 연동
- [x] Resend API 연동 (이메일 인증)
- [x] 6자리 인증 코드 생성 및 발송
- [x] 이메일 인증 백엔드 API 구현
- [x] Multer 이미지 업로드 설정 (5MB 제한)
- [x] 레시피 CRUD 및 검색/필터링 API
- [x] 재료 CRUD API
- [x] 식사 기록 CRUD API
- [x] 사용자 프로필 관리 API
- [x] OpenAI 패키지 설치 및 목업 데이터 제공
- [x] AI 레시피 생성 및 재료 인식 함수 구현
- [x] vercel.json 배포 설정
- [x] .env 파일 Git 제외 및 .env.example 작성
- [x] 입력 필드 포커스 문제 해결
- [x] 레시피 카드 undefined 에러 수정
- [x] AI 레시피 구조 안전성 개선

---

## 🚧 미완료 작업 (강제형님이 해야 할 일)

### 이메일 인증 UI 구현 ⭐
- [ ] 인증 코드 입력 핸들러 함수 추가 (`handleVerifyCode`)
- [ ] 회원가입 성공 시 인증 코드 화면 표시 로직 수정
- [ ] 인증 코드 입력 모달 UI 추가
- [ ] 인증 코드 재발송 기능
- [ ] 로그인 시 이메일 인증 체크 활성화 (`server/routes/auth.js` 115-120번째 줄 주석 해제)

### Vercel 배포
- [ ] Vercel CLI 설치
- [ ] 배포 실행
- [ ] 환경 변수 설정 (MONGODB_URI, JWT_SECRET, RESEND_API_KEY, FRONTEND_URL, PORT)
- [ ] 프로덕션 배포

### 비밀번호 찾기 기능
- [ ] 비밀번호 재설정 토큰 생성 API
- [ ] 비밀번호 재설정 이메일 발송
- [ ] 비밀번호 재설정 페이지 UI
- [ ] 비밀번호 재설정 API

### 재료 구매 링크 연동
- [ ] 쇼핑몰 API 조사 (쿠팡, 마켓컬리 등)
- [ ] 재료별 구매 링크 생성 로직
- [ ] 레시피 카드에 실제 구매 링크 연동

### 사용자 프로필 페이지
- [ ] 프로필 조회/수정 페이지 UI
- [ ] 건강 프로필 저장 기능
- [ ] 알레르기 정보 저장 기능

### 식사 기록 백엔드 연동
- [ ] 식사 기록 저장 API 호출
- [ ] 식사 기록 조회 API 호출
- [ ] 식사 기록 수정/삭제 API 호출

### 레시피 검색 및 필터링 고도화
- [ ] 카테고리별 필터링 (한식, 양식, 중식 등)
- [ ] 난이도별 필터링
- [ ] 조리시간별 필터링
- [ ] 칼로리별 필터링
- [ ] 태그 기반 검색

### 에러 처리 개선
- [ ] React Error Boundary 컴포넌트 추가
- [ ] 전역 에러 핸들링
- [ ] 사용자 친화적인 에러 메시지

### 로딩 상태 개선
- [ ] 스켈레톤 UI 추가
- [ ] 로딩 스피너 통일
- [ ] 낙관적 업데이트 적용

### 테스트 코드 작성
- [ ] 단위 테스트 (Jest)
- [ ] 통합 테스트
- [ ] E2E 테스트 (Playwright)

---

## 💡 이메일 인증 UI 구현 가이드

**참고 파일**:
- `cooking-app/server/routes/auth.js` (백엔드 API)
- `cooking-app/server/utils/email.js` (이메일 발송)
- `cooking-app/src/App.jsx` (프론트엔드)

**구현 코드 예시**:
```javascript
// App.jsx에 추가 필요

// 1. 인증 코드 입력 핸들러
const handleVerifyCode = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: pendingEmail,
        code: verificationCode
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      setAuthToken(data.token);
      setUser(data.user);
      setIsLoggedIn(true);
      localStorage.setItem('authToken', data.token);
      setShowVerificationCode(false);
      setCurrentPage('home');
    } else {
      setAuthError(data.error || '인증 코드가 올바르지 않습니다');
    }
  } catch (error) {
    setAuthError('서버 연결에 실패했습니다');
  }
};

// 2. 회원가입 성공 시 인증 코드 화면 표시
// handleRegister 함수 수정:
if (response.ok) {
  setPendingEmail(authForm.email);
  setShowVerificationCode(true);
  // 바로 로그인하지 않고 인증 코드 입력 대기
} else {
  setAuthError(data.error || '회원가입에 실패했습니다');
}

// 3. 인증 코드 입력 UI (모달 또는 별도 화면)
{showVerificationCode && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>이메일 인증</h3>
      <p>{pendingEmail}로 발송된 6자리 인증 코드를 입력해주세요</p>
      <input
        type="text"
        maxLength="6"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        placeholder="000000"
      />
      <button onClick={handleVerifyCode}>인증하기</button>
      <button onClick={() => setShowVerificationCode(false)}>취소</button>
    </div>
  </div>
)}
```

---

## 📁 주요 파일 구조

```
cooking-app/
├── src/
│   ├── App.jsx                 # 메인 컴포넌트 (모든 페이지 포함)
│   ├── main.jsx                # 엔트리 포인트
│   ├── index.css               # 글로벌 스타일
│   └── services/
│       └── openai.js           # OpenAI API 연동 (예송님 작업)
├── server/
│   ├── index.js                # Express 서버 엔트리
│   ├── config/
│   │   └── database.js         # MongoDB 연결
│   ├── models/
│   │   ├── User.js             # 사용자 모델
│   │   ├── Recipe.js           # 레시피 모델
│   │   ├── Ingredient.js       # 재료 모델
│   │   └── Meal.js             # 식사 기록 모델
│   ├── routes/
│   │   ├── auth.js             # 인증 API
│   │   ├── recipes.js          # 레시피 API
│   │   ├── ingredients.js      # 재료 API
│   │   ├── meals.js            # 식사 기록 API
│   │   ├── users.js            # 사용자 API
│   │   └── upload.js           # 이미지 업로드 API
│   ├── middleware/
│   │   ├── auth.js             # JWT 인증 미들웨어
│   │   └── upload.js           # Multer 설정
│   └── utils/
│       └── email.js            # Resend 이메일 발송
├── .env                        # 환경 변수 (Git 제외)
├── .env.example                # 환경 변수 템플릿
├── vercel.json                 # Vercel 배포 설정
├── package.json                # 의존성 관리
└── README.md                   # 프로젝트 설명
```

---

## 🔑 환경 변수 (.env)

```env
# MongoDB
MONGODB_URI=mongodb+srv://dddjje868_db_user:sungo8547@cluster0.slzdxfl.mongodb.net/cooking-app

# JWT
JWT_SECRET=cooking-app-super-secret-jwt-key-2026

# Resend (이메일)
RESEND_API_KEY=re_dfTe4myC_3CFwRS5qFchefjYbq76Uvicp

# Frontend
FRONTEND_URL=http://localhost:5175

# OpenAI (예송님 담당)
VITE_OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# API Base URL
VITE_API_BASE_URL=http://localhost:3000/api

# Environment
VITE_ENV=development

# Server
PORT=3000
```

---

## 🧪 테스트 계정

1. **조코딩 계정**
   - 이메일: `jocoding.ai@gmail.com`
   - 비밀번호: `JoCoding2026!@#SecurePass`

2. **데모 계정**
   - 이메일: `demo@cooking.app`
   - 비밀번호: `CookingMaster2026!`

3. **테스트 계정**
   - 이메일: `test.email@example.com`
   - 비밀번호: `TestPass123!`

---

## 🚀 실행 방법

```bash
# 프론트엔드 (http://localhost:5175)
npm run dev

# 백엔드 (http://localhost:3000)
npm run server

# 프로덕션 빌드
npm run build
npm run preview
```

---

## 🔧 Git 브랜치 전략

```
main (프로덕션)
  ↑
dev (개발)
  ↑
feature/N (기능 개발)
```

**현재 브랜치**: `feature/35`

---

## 🐛 알려진 이슈

1. **이메일 인증 UI 없음** (최우선 해결 필요)
   - 백엔드는 완성, 프론트엔드 UI만 추가하면 됨

2. **로그인 시 이메일 인증 체크 비활성화**
   - `server/routes/auth.js` 115-120번째 줄 주석 처리됨
   - 이메일 인증 UI 완성 후 주석 해제 필요

3. **AI 레시피 생성 시 OpenAI API 키 필요**
   - 키가 없으면 목업 데이터 사용
   - 예송님이 키 설정 예정

4. **재료 구매 링크가 목업**
   - 실제 쇼핑몰 API 연동 필요

---

## 📞 연락처

- **준수님**: 프로젝트 초기 설정 및 백엔드 개발
- **예송님**: AI 기능 개발 (OpenAI 연동)
- **강제형님**: 이메일 인증 UI 및 추가 기능 개발

---

**작성 완료일**: 2026-02-11

