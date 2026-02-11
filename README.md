# 애드쿠킹클래스 (Ad-hoc Cooking Class)

> AI가 당신의 요리를 돕습니다. 냉장고 재료로 맛있는 요리를 만들어보세요.

## 🍳 프로젝트 소개

애드혹 쿡킹 AI 서비스는 사용자의 냉장고 재료를 기반으로 AI가 맞춤형 레시피를 추천하고, 건강 정보를 고려한 식단 관리를 제공하며, 단계별 요리 가이드를 통해 누구나 쉽게 요리할 수 있도록 돕는 웹 애플리케이션입니다.

### 해커톤 정보
- **해커톤**: 조코딩 x OpenAI x Primer AI 해커톤
- **마감일**: 2026-02-20
- **팀**: 장준수 (리더), 강제형, 모예송

## ✨ 주요 기능

### 1. 냉장고 재료 기반 레시피 추천
- 사용자가 보유한 재료 입력/촬영
- AI 기반 레시피 자동 추천
- 부족한 재료 표시 및 구매 링크 제공

### 2. 단계별 요리 코칭
- 단계별 조리 가이드
- 진행 상황 표시
- 이전/다음 단계 네비게이션

### 3. 맞춤형 식단 관리
- 건강 데이터 입력 (체중, 알레르기, 질환 등)
- BMR (기초대사량) 자동 계산
- 목표 기반 식단 자동 설계

### 4. 식사 기록 및 학습
- 과거 식사 기록 저장
- 사용자 취향 학습
- 개인화된 메뉴 추천

## 🚀 시작하기

### 필수 요구사항
- Node.js 18.0 이상
- npm 또는 yarn
- OpenAI API 키 (AI 기능 사용 시)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정
# .env 파일을 생성하고 OpenAI API 키를 설정하세요
cp .env.example .env
# .env 파일을 열어 VITE_OPENAI_API_KEY에 실제 API 키를 입력하세요

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

개발 서버는 기본적으로 http://localhost:5173 에서 실행됩니다.

### OpenAI API 키 발급 방법

1. [OpenAI Platform](https://platform.openai.com/api-keys)에 접속
2. 로그인 또는 회원가입
3. "Create new secret key" 버튼 클릭
4. 생성된 API 키를 복사
5. `.env` 파일의 `VITE_OPENAI_API_KEY`에 붙여넣기

**주의:** API 키는 절대 공개 저장소에 커밋하지 마세요!

## 🛠 기술 스택

- **Frontend**: React 18 + Vite
- **AI**: OpenAI API (GPT-4o-mini, Vision)
- **UI 라이브러리**: Lucide React (아이콘)
- **스타일링**: CSS-in-JS (인라인 스타일)
- **폰트**: Pretendard

## 📁 프로젝트 구조

```
cooking-app/
├── public/
│   └── chef-hat.svg          # 파비콘
├── src/
│   ├── services/
│   │   └── openai.js         # OpenAI API 통합 모듈
│   ├── assets/
│   │   └── react.svg
│   ├── App.jsx               # 메인 애플리케이션 컴포넌트
│   ├── main.jsx              # 엔트리 포인트
│   └── index.css             # 글로벌 스타일
├── docs/
│   ├── AI_INTEGRATION.md     # AI 통합 가이드
│   ├── DEMO_GUIDE.md         # 데모 및 테스트 가이드
│   ├── design.md             # 설계 문서
│   ├── requirements.md       # 요구사항 문서
│   └── tasks.md              # 작업 목록
├── .env                      # 환경 변수 (Git 제외)
├── .env.example              # 환경 변수 예제
├── index.html                # HTML 템플릿
├── package.json              # 프로젝트 설정
├── vite.config.js            # Vite 설정
└── AI_INTEGRATION_SUMMARY.md # AI 통합 요약
```

## 🎨 주요 페이지

1. **로그인 페이지**: 사용자 인증
2. **홈 페이지**: 주요 기능 소개
3. **레시피 추천**: 재료 입력 및 AI 레시피 추천
4. **요리 가이드**: 단계별 조리 안내
5. **건강 프로필**: 건강 정보 입력 및 BMR 계산
6. **식사 기록**: 과거 식사 내역 및 통계

## 💡 AI 기능 사용 예시

### 1. AI 레시피 생성
```javascript
// 재료 입력
재료: 김치, 돼지고기, 두부, 양파

// AI 레시피 생성 버튼 클릭
→ AI가 3개의 맞춤형 레시피 생성
  - 김치찌개 (450kcal, 조리시간 30분)
  - 두부김치 (320kcal, 조리시간 15분)
  - 김치볶음밥 (520kcal, 조리시간 20분)
```

### 2. 재료 인식
```javascript
// 냉장고 사진 업로드
→ AI가 자동으로 재료 인식
  ✓ 김치 (신뢰도: 95%)
  ✓ 계란 (신뢰도: 92%)
  ✓ 양파 (신뢰도: 88%)
  ✕ 물병 (신뢰도: 45%) - 제외
```

### 3. 건강 프로필 기반 추천
```javascript
// 건강 정보 입력
나이: 30세, 성별: 남성
키: 175cm, 체중: 70kg
목표: 체중 감량
알레르기: 우유, 땅콩

// AI 레시피 생성
→ 목표 칼로리: 1800kcal
→ 알레르기 재료 자동 제외
→ 저칼로리 레시피 우선 추천
```

## 🔀 Git 워크플로우

이 프로젝트는 Git Flow 기반의 브랜치 전략을 사용합니다.

### 브랜치 구조
- `main` - 프로덕션 배포 브랜치 (직접 커밋 금지)
- `dev` - 개발 통합 브랜치 (PR을 통해서만 병합)
- `feature/N` - 기능 개발 브랜치 (자유롭게 커밋 가능)

### 개발 워크플로우

1. **새 기능 개발 시작**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/35
   ```

2. **작업 및 커밋**
   ```bash
   git add .
   git commit -m "feat: 새로운 기능 추가"
   git push origin feature/35
   ```

3. **Pull Request 생성**
   - GitHub에서 `feature/35` → `dev` PR 생성
   - 코드 리뷰 후 병합

4. **dev에서 main으로 배포**
   - 충분한 테스트 후 `dev` → `main` PR 생성
   - 리뷰 및 승인 후 병합

자세한 내용은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고하세요.

## 🔮 향후 계획

- [x] OpenAI API 통합 (레시피 생성) ✅
- [x] OpenAI Vision API 통합 (재료 인식) ✅
- [ ] 백엔드 API 구축
- [ ] 데이터베이스 연동
- [ ] 사용자 인증 시스템
- [ ] 모바일 앱 (React Native)

## 📝 라이선스

이 프로젝트는 해커톤 출품작입니다.

## 👥 팀원

- **장준수** - 팀 리더
- **강제형** - 팀원
- **모예송** - 팀원

---

**요리의 모든 것, AI로 더하다.** 🍳✨
