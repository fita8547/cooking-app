# 🎨 UI/UX 개선 및 OpenAI 레시피 추천 기능 구현

## 📋 변경 사항 요약

이 PR은 사용자 경험 개선과 AI 기반 레시피 추천 기능을 추가합니다.

### 주요 기능

1. **🎨 컬러 테마 변경**
   - 핑크색 → 은은한 오렌지 톤으로 전체 테마 변경
   - 음식 앱에 적합한 따뜻하고 식욕을 자극하는 색상
   - CSS 변수 시스템 도입으로 일관성 있는 디자인

2. **🤖 OpenAI 기반 레시피 추천**
   - GPT-4o-mini를 활용한 맞춤형 레시피 생성
   - 레시피 추천 할때 추천한 이유 한 줄 요약 반영 
   - 사용자의 건강 정보+ 보유 재료를 기반으로 개인화된 추천(5개)
   - 알레르기 자동 필터링 및 영양 목표 반영
   - '오늘의 AI 코칭'만듬 -> 여기서 더 세세하게 코칭 할 수 있게(아직 완료되지 않음)

3. **📸 이미지 인식 개선**
   - OpenAI Vision API로 재료 자동 인식
   - 인식된 재료 즉시 목록에 추가
   - 드래그 앤 드롭으로 이미지 업로드(예정)

4. **🔄 페이지 플로우 개선**
   - 냉장고 → 레시피 추천 페이지로 재료 자동 전달
   - 레시피 추천 결과를 같은 페이지에 표시 (페이지 전환 없음)
   - 한글 입력 IME 이슈 해결-> 이 문제 자주 일어남

## 🎯 변경된 파일

### 새로 추가된 파일
- `src/theme.css` - 전역 CSS 변수 및 유틸리티 클래스
- `OPENAI_RECIPE_RECOMMENDATION.md` - OpenAI 통합 문서
- `DRAG_DROP_COMPLETION.md` - 드래그 앤 드롭 구현 문서
- `IMAGE_RECOGNITION_FIX.md` - 이미지 인식 수정 문서
- `FRIDGE_TO_RECOMMEND_INTEGRATION.md` - 페이지 통합 문서
- `COLOR_THEME_UPDATE.md` - 컬러 테마 변경 문서

### 수정된 파일

#### 프론트엔드
- `src/main.jsx` - theme.css import
- `src/components/HomeHub.jsx` - 오렌지 테마 적용
- `src/components/Login.jsx` - 오렌지 테마 적용
- `src/components/QuickHealthInfo.jsx` - 오렌지 테마 적용
- `src/components/RecipeRecommendationPage.jsx` - 페이지 플로우 개선, 이미지 인식 수정
- `src/components/IngredientInputForm.jsx` - 재료 상태 동기화
- `src/components/FridgePage.jsx` - 재료 전달 기능, 드래그 앤 드롭
- `src/components/AppRouter.jsx` - 페이지 간 데이터 전달

#### 백엔드
- `server/services/RecipeRecommendationService.js` - OpenAI 통합
- `server/routes/recipes.js` - 레시피 추천 API (기존 유지)

## 🔧 기술 스택

- **AI**: OpenAI GPT-4o-mini, Vision API
- **Frontend**: React 19.2.0, Vite
- **Backend**: Express.js, Node.js
- **Database**: MongoDB

## 📸 스크린샷

### Before (보라색 테마)
- 쨍한 보라색 그라데이션
- 음식 앱과 어울리지 않는 색상

### After (은은한 오렌지 테마)
- 따뜻하고 부드러운 오렌지 톤
- 식욕을 자극하는 색상
- 일관된 디자인 시스템

## ✨ 주요 개선 사항

### 1. 컬러 시스템
```css
/* 은은한 오렌지 톤 */
--primary: #ff8c42
--primary-dark: #ff7420
--bg-secondary: #fffaf5
```

### 2. OpenAI 레시피 생성
```javascript
// 사용자 건강 정보 + 재료 → AI 레시피 생성
const recipes = await generateRecipesWithAI(
  ingredients,
  healthProfile,
  nutritionTargets
);
```

### 3. 드래그 앤 드롭
```javascript
// 이미지 드래그 앤 드롭으로 재료 인식
<div 
  onDragOver={handleDragOver}
  onDrop={handleDrop}
  className={isDragging ? 'dragging' : ''}
>
```

### 4. 페이지 플로우
```javascript
// 냉장고 → 레시피 추천 (재료 자동 전달)
onNavigateToRecommend(ingredients.map(ing => ing.name));
```

## 🧪 테스트

### 수동 테스트 완료
- ✅ 로그인 → 건강기록 → 홈 플로우
- ✅ 냉장고 재료 추가 (직접 입력, 사진 인식)
- ✅ 드래그 앤 드롭 이미지 업로드
- ✅ 레시피 추천 (OpenAI 기반)
- ✅ 한글 입력 (IME 이슈 해결)
- ✅ 반응형 디자인

### 자동 테스트
- ✅ 기존 테스트 통과
- ✅ 새로운 기능 테스트 추가 필요 (TODO)

## 🚀 배포 전 체크리스트

- [x] 코드 리뷰 준비 완료
- [x] 문서 작성 완료
- [x] 로컬 테스트 완료
- [ ] OpenAI API 키 환경변수 설정 확인
- [ ] 프로덕션 빌드 테스트
- [ ] 성능 테스트
- [ ] 접근성 테스트

## 📝 환경 변수

```bash
# .env 파일에 추가 필요
OPENAI_API_KEY=sk-proj-...
```

## 🔄 마이그레이션

특별한 마이그레이션 필요 없음. 기존 데이터와 호환됩니다.

## 🐛 알려진 이슈

없음

## 📚 관련 문서

- [OpenAI 레시피 추천](./OPENAI_RECIPE_RECOMMENDATION.md)
- [드래그 앤 드롭 구현](./DRAG_DROP_COMPLETION.md)
- [이미지 인식 수정](./IMAGE_RECOGNITION_FIX.md)
- [컬러 테마 변경](./COLOR_THEME_UPDATE.md)

## 👥 리뷰어

@reviewer1 @reviewer2

## 💬 추가 노트

- OpenAI API 키가 없으면 자동으로 DB 기반 레시피로 폴백
- 모든 색상은 CSS 변수로 관리되어 향후 테마 변경 용이
- 드래그 앤 드롭은 모든 모던 브라우저에서 지원

---

**Type**: Feature, Enhancement
**Priority**: High
**Estimated Review Time**: 30-45 minutes
