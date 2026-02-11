# 구현 계획: 애드혹 쿡킹 AI 서비스

## 개요

이 구현 계획은 React 기반 웹 애플리케이션으로 애드혹 쿡킹 AI 서비스를 구축하는 단계별 가이드입니다. 각 태스크는 이전 태스크를 기반으로 하며, 점진적으로 기능을 추가합니다.

**기술 스택:**
- Frontend: React (기존 JSX 파일 기반)
- Backend: Next.js API Routes 또는 Express
- AI: OpenAI API (GPT-4, GPT-4 Vision)
- Database: MongoDB 또는 PostgreSQL
- Testing: Jest, fast-check

## 태스크 목록

- [ ] 1. 프로젝트 구조 및 기본 설정
  - React 프로젝트 초기화 (기존 JSX 파일 활용)
  - 필요한 의존성 설치 (axios, react-router-dom 등)
  - 환경 변수 설정 (.env 파일)
  - OpenAI API 키 설정
  - _Requirements: 11.1, 11.2_

- [ ] 2. 데이터 모델 및 타입 정의
  - [ ] 2.1 TypeScript 인터페이스 정의
    - UserProfile, Recipe, MealRecord, Ingredient 등 모든 데이터 모델 정의
    - API 요청/응답 타입 정의
    - _Requirements: 11.2_
  
  - [ ]* 2.2 데이터 모델 유효성 검증 함수 작성
    - validateUserProfile, validateRecipe 등
    - _Requirements: 3.1_

- [ ] 3. API 클라이언트 레이어 구축
  - [ ] 3.1 API 클라이언트 기본 구조 생성
    - axios 인스턴스 설정
    - 에러 처리 인터셉터
    - _Requirements: 11.2, 11.5_
  
  - [ ] 3.2 API 엔드포인트 함수 구현
    - 재료 관련: recognizeIngredients, saveIngredients, getIngredients
    - 레시피 관련: generateRecipes, getRecipeById
    - 식사 관련: saveMeal, getMealHistory, updateMeal, deleteMeal
    - 사용자 관련: saveProfile, getProfile, updateProfile
    - _Requirements: 1.1, 1.2, 2.1, 5.1, 5.2, 3.1_
  
  - [ ]* 3.3 API 클라이언트 단위 테스트
    - 각 API 함수의 성공/실패 케이스 테스트
    - _Requirements: 11.2_

- [ ] 4. 백엔드 API 구현 (Next.js API Routes 또는 Express)
  - [ ] 4.1 재료 인식 API 구현
    - POST /api/ingredients/recognize
    - OpenAI Vision API 통합
    - 이미지 업로드 처리
    - _Requirements: 1.2_
  
  - [ ] 4.2 재료 저장/조회 API 구현
    - POST /api/ingredients/save
    - GET /api/ingredients/:userId
    - _Requirements: 1.1, 1.4_
  
  - [ ]* 4.3 재료 API 속성 테스트
    - **Property 1: 재료 추가 및 유효성 검증**
    - **Property 3: 재료 목록 CRUD 작업**
    - **Validates: Requirements 1.1, 1.4, 1.5**
  
  - [ ] 4.4 레시피 생성 API 구현
    - POST /api/recipes/generate
    - OpenAI GPT-4 통합
    - 프롬프트 엔지니어링 (재료 기반 레시피 생성)
    - 알레르기 필터링
    - _Requirements: 2.1, 2.2, 2.3, 3.3_
  
  - [ ]* 4.5 레시피 API 속성 테스트
    - **Property 4: 보유 재료 기반 레시피 우선순위**
    - **Property 5: 부족한 재료 계산 정확성**
    - **Property 7: 알레르기 필터링**
    - **Validates: Requirements 2.2, 2.3, 2.5, 3.3**
  
  - [ ] 4.6 사용자 프로필 API 구현
    - POST /api/users/profile
    - GET /api/users/profile/:userId
    - PUT /api/users/profile/:userId
    - BMR 및 목표 칼로리 계산
    - _Requirements: 3.1, 3.2_
  
  - [ ]* 4.7 건강 계산 속성 테스트
    - **Property 8: BMR 계산 정확성**
    - **Validates: Requirements 3.2**
  
  - [ ] 4.8 식사 기록 API 구현
    - POST /api/meals
    - GET /api/meals/history
    - PUT /api/meals/:mealId
    - DELETE /api/meals/:mealId
    - _Requirements: 5.1, 5.2, 5.4, 5.5_
  
  - [ ]* 4.9 식사 기록 속성 테스트
    - **Property 10: 식사 기록 Round-trip**
    - **Property 11: 식사 기록 날짜 정렬**
    - **Property 13: 식사 기록 삭제 완전성**
    - **Validates: Requirements 5.1, 5.2, 5.4, 5.5**

- [ ] 5. Checkpoint - 백엔드 API 테스트
  - 모든 API 엔드포인트가 정상 작동하는지 확인
  - Postman 또는 curl로 수동 테스트
  - 사용자에게 질문이 있으면 확인

- [ ] 6. React 컴포넌트 구조 설계
  - [ ] 6.1 라우팅 설정
    - React Router 설정
    - 주요 페이지 라우트 정의 (/, /recipes, /cooking-guide, /meal-history, /profile)
    - _Requirements: 10.2_
  
  - [ ] 6.2 공통 컴포넌트 생성
    - Button, Input, Card, Modal 등 재사용 가능한 UI 컴포넌트
    - Loading Spinner, Error Message 컴포넌트
    - _Requirements: 10.3, 10.4_
  
  - [ ] 6.3 레이아웃 컴포넌트
    - Header, Footer, Navigation
    - 모바일 반응형 레이아웃
    - _Requirements: 8.1, 10.2_

- [ ] 7. 재료 입력 및 인식 기능 구현
  - [ ] 7.1 재료 입력 페이지 컴포넌트
    - 수동 재료 입력 폼
    - 재료 목록 표시 및 편집 기능
    - _Requirements: 1.1, 1.4_
  
  - [ ] 7.2 이미지 업로드 및 재료 인식 기능
    - 카메라/갤러리에서 이미지 선택
    - 이미지 미리보기
    - 재료 인식 API 호출
    - 인식 결과 표시 및 확인/수정 UI
    - _Requirements: 1.2, 1.3, 1.4_
  
  - [ ]* 7.3 재료 입력 UI 단위 테스트
    - 재료 추가/삭제 동작 테스트
    - _Requirements: 1.1, 1.4_

- [ ] 8. 레시피 추천 기능 구현
  - [ ] 8.1 레시피 추천 페이지 컴포넌트
    - 추천 모드 선택 (보유 재료만 / 추가 재료 허용)
    - 레시피 목록 표시 (카드 형식)
    - 부족한 재료 표시
    - 구매 링크 제공
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [ ] 8.2 레시피 상세 페이지
    - 레시피 정보 표시 (재료, 조리 단계, 영양 정보)
    - 요리 시작 버튼
    - _Requirements: 2.1, 3.4_
  
  - [ ]* 8.3 레시피 추천 통합 테스트
    - 재료 입력 → 레시피 추천 플로우 테스트
    - _Requirements: 2.1, 2.2_

- [ ] 9. 사용자 프로필 및 건강 정보 관리
  - [ ] 9.1 프로필 입력 페이지
    - 나이, 성별, 키, 체중 입력 폼
    - 알레르기 선택 (다중 선택)
    - 식단 목표 선택
    - 활동 수준 선택
    - _Requirements: 3.1_
  
  - [ ] 9.2 건강 지표 표시
    - 계산된 BMR 표시
    - 목표 칼로리 표시
    - 권장 영양소 비율 표시
    - _Requirements: 3.2_
  
  - [ ]* 9.3 프로필 관리 단위 테스트
    - 프로필 저장/수정 동작 테스트
    - _Requirements: 3.1_

- [ ] 10. 단계별 요리 가이드 구현
  - [ ] 10.1 요리 가이드 페이지
    - 현재 단계 표시
    - 단계별 지침 및 이미지
    - 이전/다음 단계 네비게이션
    - _Requirements: 4.1, 4.5, 4.6_
  
  - [ ] 10.2 타이머 기능
    - 단계별 타이머 설정
    - 타이머 알림
    - _Requirements: 4.4_
  
  - [ ]* 10.3 요리 가이드 UI 테스트
    - 단계 네비게이션 동작 테스트
    - _Requirements: 4.5, 4.6_

- [ ] 11. 식사 기록 및 히스토리 관리
  - [ ] 11.1 식사 기록 저장 기능
    - 요리 완료 후 식사 기록 저장
    - 식사 유형 선택 (아침/점심/저녁/간식)
    - 평가 기능 (별점 또는 좋아요)
    - _Requirements: 5.1, 6.1_
  
  - [ ] 11.2 식사 히스토리 페이지
    - 날짜별 식사 기록 표시
    - 일일 영양 요약 표시
    - 기록 수정/삭제 기능
    - _Requirements: 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 11.3 식사 기록 통합 테스트
    - 식사 저장 → 조회 → 수정 → 삭제 플로우 테스트
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ] 12. Checkpoint - 프론트엔드 기능 테스트
  - 모든 페이지가 정상 작동하는지 확인
  - 사용자 플로우 테스트 (재료 입력 → 레시피 추천 → 요리 가이드 → 식사 기록)
  - 사용자에게 질문이 있으면 확인

- [ ] 13. 사용자 취향 학습 및 개인화 추천
  - [ ] 13.1 선호도 분석 로직 구현
    - 식사 기록 및 평가 데이터 분석
    - 선호 재료 추출
    - 선호 요리 종류 추출
    - _Requirements: 6.2, 6.3_
  
  - [ ] 13.2 개인화 추천 점수 계산
    - 레시피 추천 시 선호도 점수 반영
    - 선호 재료 포함 레시피 우선순위 조정
    - _Requirements: 6.4, 6.5_
  
  - [ ]* 13.3 선호도 학습 속성 테스트
    - **Property 14: 선호도 데이터 저장**
    - **Property 15: 선호 재료 기반 추천 우선순위**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [ ] 14. 성능 최적화
  - [ ] 14.1 API 응답 시간 최적화
    - OpenAI API 호출 캐싱
    - 레시피 결과 캐싱
    - _Requirements: 7.1, 7.2_
  
  - [ ] 14.2 프론트엔드 성능 최적화
    - 이미지 lazy loading
    - 컴포넌트 메모이제이션 (React.memo)
    - 코드 스플리팅
    - _Requirements: 7.3_
  
  - [ ]* 14.3 성능 테스트
    - **Property 2: 재료 인식 성능 및 정확성**
    - **Property 6: 레시피 생성 성능**
    - **Property 16: 화면 로딩 성능**
    - **Validates: Requirements 1.2, 2.7, 7.1, 7.2, 7.3**

- [ ] 15. 보안 및 데이터 보호
  - [ ] 15.1 데이터 암호화
    - 민감한 데이터 암호화 (건강 정보, 식사 기록)
    - HTTPS 통신 설정
    - _Requirements: 9.1, 9.2_
  
  - [ ] 15.2 사용자 인증 및 권한 관리
    - 간단한 인증 시스템 (이메일/비밀번호 또는 OAuth)
    - 사용자별 데이터 격리
    - _Requirements: 9.5_
  
  - [ ]* 15.3 보안 속성 테스트
    - **Property 17: 데이터 보안 (암호화 및 전송)**
    - **Property 18: 사용자 데이터 격리**
    - **Validates: Requirements 9.1, 9.2, 9.5**

- [ ] 16. UI/UX 개선 및 접근성
  - [ ] 16.1 에러 처리 및 사용자 피드백
    - 모든 에러에 대한 한글 메시지
    - 로딩 상태 표시
    - 성공/실패 토스트 메시지
    - _Requirements: 10.3, 10.4_
  
  - [ ] 16.2 접근성 개선
    - 키보드 네비게이션 지원
    - ARIA 레이블 추가
    - 색상 대비 개선
    - _Requirements: 10.6_
  
  - [ ]* 16.3 UX 속성 테스트
    - **Property 20: 주요 기능 접근성 (3탭 규칙)**
    - **Property 21: 에러 메시지 한글 제공**
    - **Validates: Requirements 10.2, 10.4**

- [ ] 17. 최종 통합 테스트 및 버그 수정
  - [ ] 17.1 전체 사용자 플로우 테스트
    - 신규 사용자 온보딩
    - 재료 입력 → 레시피 추천 → 요리 → 식사 기록 → 개인화 추천
    - _Requirements: 모든 요구사항_
  
  - [ ] 17.2 크로스 브라우저 테스트
    - Chrome, Firefox, Safari, Edge에서 테스트
    - _Requirements: 8.1_
  
  - [ ] 17.3 모바일 반응형 테스트
    - 다양한 화면 크기에서 테스트
    - _Requirements: 8.1, 8.2_
  
  - [ ]* 17.4 전체 속성 테스트 실행
    - 모든 Correctness Properties 테스트 실행
    - 실패한 테스트 수정
    - _Requirements: 모든 요구사항_

- [ ] 18. 배포 준비
  - [ ] 18.1 프로덕션 빌드
    - 환경 변수 설정 (프로덕션)
    - 빌드 최적화
    - _Requirements: 11.1_
  
  - [ ] 18.2 Vercel 배포
    - Vercel 프로젝트 설정
    - 환경 변수 설정
    - 배포 및 테스트
    - _Requirements: 11.1_

- [ ] 19. 최종 Checkpoint
  - 모든 기능이 정상 작동하는지 최종 확인
  - 성능 지표 확인 (API 응답 시간, 화면 로딩 시간)
  - 사용자에게 최종 확인 및 피드백 요청

## 참고 사항

- `*` 표시가 있는 태스크는 선택 사항입니다 (빠른 MVP를 위해 건너뛸 수 있음)
- 각 태스크는 관련 요구사항을 참조합니다
- Checkpoint 태스크에서 문제가 발견되면 이전 태스크로 돌아가 수정합니다
- 속성 테스트는 fast-check 라이브러리를 사용하며, 최소 100회 반복 실행됩니다
