# 냉장고 → 레시피 추천 통합 완료

## 구현 내용

사용자가 냉장고 페이지에서 "이 재료로 요리하기" 버튼을 누르면, 입력한 재료가 자동으로 레시피 추천 페이지로 전달되어 즉시 추천이 시작됩니다.

## 변경된 파일

### 1. `src/components/AppRouter.jsx`
**추가된 기능**:
- `ingredientsToRecommend` 상태 추가 - 페이지 간 재료 데이터 전달
- `handleNavigateToRecommendWithIngredients` 함수 - 재료와 함께 추천 페이지로 이동
- FridgePage와 MealHistoryPage 라우팅 추가
- RecipeRecommendationPage에 `initialIngredients` prop 전달

```javascript
const handleNavigateToRecommendWithIngredients = (ingredients) => {
  setIngredientsToRecommend(ingredients);
  setCurrentPage('recommend');
};
```

### 2. `src/components/FridgePage.jsx`
**수정된 기능**:
- `handleCookWithIngredients` 함수 수정
- 재료 이름 배열을 추출하여 `onNavigateToRecommend`에 전달

```javascript
const handleCookWithIngredients = () => {
  if (ingredients.length === 0) {
    alert('재료를 먼저 추가해주세요');
    return;
  }
  // 재료 목록을 전달하면서 추천 페이지로 이동
  onNavigateToRecommend(ingredients.map(ing => ing.name));
};
```

### 3. `src/components/RecipeRecommendationPage.jsx`
**추가된 기능**:
- `initialIngredients` prop 추가 (기본값: 빈 배열)
- 초기 재료로 상태 초기화
- `useEffect`로 초기 재료가 있으면 자동으로 추천 시작

```javascript
export default function RecipeRecommendationPage({ user, onBack, initialIngredients = [] }) {
  const [ingredients, setIngredients] = useState(initialIngredients);
  
  // initialIngredients가 있으면 자동으로 추천 시작
  useEffect(() => {
    if (initialIngredients.length > 0) {
      setIngredients(initialIngredients);
      setTimeout(() => {
        handleSubmit(initialIngredients);
      }, 500);
    }
  }, [initialIngredients]);
}
```

### 4. `src/components/IngredientInputForm.jsx`
**기존 기능 확인**:
- 이미 `initialIngredients` prop을 받아서 처리하도록 구현되어 있음
- 추가 수정 불필요

## 사용자 플로우

1. **냉장고 페이지에서 재료 추가**
   - 사진으로 추가 (드래그 앤 드롭 또는 파일 선택)
   - 직접 입력으로 추가
   - 재료가 냉장실/냉동실에 표시됨

2. **"✨ 이 재료로 요리하기" 버튼 클릭**
   - 재료가 없으면: "재료를 먼저 추가해주세요" 알림
   - 재료가 있으면: 레시피 추천 페이지로 이동

3. **레시피 추천 페이지 자동 실행**
   - 전달받은 재료가 자동으로 입력됨
   - 0.5초 후 자동으로 추천 시작
   - 로딩 화면 표시: "레시피를 찾고 있습니다..."

4. **추천 결과 표시**
   - 보유 재료로만 만들 수 있는 레시피 (exact matches)
   - 추가 재료가 필요한 레시피 (extended matches)
   - 각 레시피의 영양 정보 및 조리 단계

## 기술적 세부사항

### 데이터 흐름
```
FridgePage (ingredients)
  ↓ onNavigateToRecommend(ingredientNames)
AppRouter (ingredientsToRecommend)
  ↓ initialIngredients prop
RecipeRecommendationPage
  ↓ useEffect 자동 실행
  ↓ handleSubmit(initialIngredients)
API 호출 → 레시피 추천 결과
```

### 상태 관리
- AppRouter: 페이지 간 데이터 전달을 위한 중앙 상태 관리
- FridgePage: 냉장고 재료 목록 관리 (MongoDB에서 로드)
- RecipeRecommendationPage: 추천 프로세스 및 결과 관리

### API 엔드포인트
- `GET /api/ingredients` - 사용자의 재료 목록 조회
- `POST /api/recommendations` - 재료 기반 레시피 추천
- `GET /api/health-info/profile` - 건강 프로필 조회 (맞춤 추천용)

## 테스트 시나리오

### 시나리오 1: 정상 플로우
1. 로그인
2. 홈 → "우리집 냉장고" 클릭
3. 재료 추가 (예: 김치, 두부, 대파)
4. "이 재료로 요리하기" 버튼 클릭
5. **예상 결과**: 레시피 추천 페이지로 이동, 재료가 자동 입력되고 추천 시작

### 시나리오 2: 재료 없이 버튼 클릭
1. 냉장고 페이지에서 재료 추가 없이
2. "이 재료로 요리하기" 버튼 클릭
3. **예상 결과**: "재료를 먼저 추가해주세요" 알림

### 시나리오 3: 추천 페이지에서 재료 추가
1. 냉장고에서 재료 전달받아 추천 페이지 진입
2. 추천 결과 확인 후 "새로 검색" 클릭
3. 재료 추가/삭제 가능
4. "레시피 추천받기" 버튼으로 재추천

## 개선 사항

### 완료된 기능
- ✅ 냉장고 → 추천 페이지 재료 전달
- ✅ 자동 추천 시작 (0.5초 딜레이)
- ✅ 재료 입력 폼에 초기값 표시
- ✅ 드래그 앤 드롭 이미지 업로드
- ✅ AI 재료 인식 (OpenAI Vision API)

### 향후 개선 가능 사항
1. **재료 동기화**: 추천 페이지에서 재료 수정 시 냉장고에도 반영
2. **최근 사용 재료**: 자주 사용하는 재료 빠른 추가
3. **재료 유통기한**: 유통기한 관리 및 알림
4. **쇼핑 리스트**: 부족한 재료 자동 쇼핑 리스트 생성
5. **레시피 북마크**: 마음에 드는 레시피 저장

## 관련 문서

- 드래그 앤 드롭 구현: `DRAG_DROP_COMPLETION.md`
- 테스트 가이드: `TEST_DRAG_DROP.md`
- Quick 건강기록: `QUICK_HEALTH_README.md`
- 전체 테스트: `TESTING_GUIDE.md`
