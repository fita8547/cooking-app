# Merge 전략: dev 디자인 유지 + 기능 추가

## 상황
- 팀원이 UI 변경이 많아서 부담스럽다고 피드백
- dev 브랜치의 기존 디자인을 유지하면서 새 기능만 추가 필요

## 제거한 UI 변경사항
- ❌ src/theme.css 색상 팔레트 변경 (원래대로 복구)
- ❌ src/components/WelcomePage.jsx 새 디자인 (삭제)
- ❌ src/components/RecipeCookingGuide.jsx (삭제)

## 유지하는 기능
- ✅ 전역 프리미엄 상태 관리 (AppOnboarding.jsx)
- ✅ 모든 페이지에 isPremium prop 전달
- ✅ 프리미엄 상태 배지 (모든 페이지 헤더)
- ✅ AI 기능 블러 처리 (HomeHub, MealHistoryPage)
- ✅ 개발자 도구 (togglePremium, setPremium, resetApp)

## 수정된 파일 (기능만)
1. src/AppOnboarding.jsx - isPremium 상태 추가
2. src/components/HomeHub.jsx - 프리미엄 배지 + AI 블러
3. src/components/MealHistoryPage.jsx - 프리미엄 배지 + AI 블러
4. src/components/RecipeRecommendationPage.jsx - 프리미엄 배지
5. src/components/FridgePage.jsx - 프리미엄 배지
6. src/components/HealthProfilePage.jsx - 프리미엄 배지

## 백엔드 변경사항 (유지)
- server/routes/ai.js - AI 코칭 엔드포인트
- server/services/IngredientRepository.js - 재료 관리 개선

## 다음 단계
1. 변경사항 커밋
2. feature/36 브랜치에 푸시
3. dev 브랜치로 PR 생성
4. 팀원 리뷰 요청

## 커밋 메시지 제안
```
feat: 프리미엄 기능 추가 (UI 변경 최소화)

- 전역 프리미엄 상태 관리 추가
- 모든 페이지에 프리미엄 배지 표시
- AI 코칭 및 주간 분석 블러 처리 (무료 사용자)
- 개발자 도구 추가 (togglePremium, setPremium)
- 기존 dev 브랜치 UI 디자인 유지
```
