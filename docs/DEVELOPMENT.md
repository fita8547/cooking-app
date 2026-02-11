# 개발 가이드

## 개발 환경 설정

### 1. 프로젝트 클론 및 설치

```bash
# 프로젝트 디렉토리로 이동
cd cooking-app

# 의존성 설치
npm install
```

### 2. 환경 변수 설정

```bash
# .env.example을 복사하여 .env 파일 생성
cp .env.example .env

# .env 파일을 열어 필요한 값 입력
# (현재는 OpenAI API 키가 필요하지 않음 - 향후 백엔드 구축 시 필요)
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속

## 프로젝트 구조

```
cooking-app/
├── docs/                      # 문서
│   ├── requirements.md        # 요구사항 명세
│   ├── design.md              # 디자인 문서
│   ├── tasks.md               # 구현 태스크
│   └── DEVELOPMENT.md         # 개발 가이드 (이 파일)
├── public/                    # 정적 파일
│   └── chef-hat.svg           # 파비콘
├── src/                       # 소스 코드
│   ├── App.jsx                # 메인 컴포넌트
│   ├── main.jsx               # 엔트리 포인트
│   └── index.css              # 글로벌 스타일
├── .env.example               # 환경 변수 예제
├── .gitignore                 # Git 무시 파일
├── index.html                 # HTML 템플릿
├── package.json               # 프로젝트 설정
├── README.md                  # 프로젝트 소개
├── vercel.json                # Vercel 배포 설정
└── vite.config.js             # Vite 설정
```

## 주요 컴포넌트

### App.jsx

메인 애플리케이션 컴포넌트로, 다음 페이지들을 포함합니다:

- **LoginPage**: 로그인 페이지
- **HomePage**: 홈 페이지 (기능 소개)
- **RecommendPage**: 재료 입력 및 레시피 추천
- **CoachingPage**: 단계별 요리 가이드
- **HealthPage**: 건강 프로필 설정
- **HistoryPage**: 식사 기록 및 통계
- **Navigation**: 네비게이션 바

### 상태 관리

현재는 React의 useState를 사용한 로컬 상태 관리를 사용합니다.

주요 상태:
- `currentPage`: 현재 페이지
- `isLoggedIn`: 로그인 상태
- `ingredients`: 사용자 재료 목록
- `selectedRecipe`: 선택된 레시피
- `healthProfile`: 건강 프로필
- `mealHistory`: 식사 기록

## 스타일링

- CSS-in-JS 방식 (인라인 `<style>` 태그)
- 모든 스타일은 App.jsx 내부에 정의
- 반응형 디자인 (모바일 우선)
- Pretendard 폰트 사용

## 다음 단계

### Phase 1: 백엔드 API 구축
- [ ] Express 또는 Next.js API Routes 설정
- [ ] 데이터베이스 연결 (MongoDB 또는 PostgreSQL)
- [ ] API 엔드포인트 구현

### Phase 2: OpenAI 통합
- [ ] OpenAI API 키 설정
- [ ] 레시피 생성 API 구현
- [ ] 재료 인식 API 구현 (Vision API)

### Phase 3: 사용자 인증
- [ ] 회원가입/로그인 기능
- [ ] JWT 토큰 기반 인증
- [ ] 사용자별 데이터 격리

### Phase 4: 고급 기능
- [ ] 실시간 재료 인식
- [ ] 음성 안내 기능
- [ ] 타이머 기능
- [ ] 푸시 알림

## 배포

### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

또는 GitHub 연동을 통한 자동 배포:
1. GitHub에 프로젝트 푸시
2. Vercel 대시보드에서 프로젝트 연결
3. 자동 배포 설정

## 문제 해결

### 포트 충돌
다른 포트로 실행하려면:
```bash
npm run dev -- --port 3000
```

### 빌드 오류
캐시 삭제 후 재시도:
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

## 기여 가이드

1. 기능 브랜치 생성
2. 변경사항 커밋
3. Pull Request 생성
4. 코드 리뷰 후 머지

## 라이선스

해커톤 출품작

## 문의

- 팀 리더: 장준수
- 팀원: 강제형, 모예송
