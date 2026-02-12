# 레시피 추천 페이지 이미지 인식 재료 표시 수정

## 문제점

레시피 추천 페이지에서 사진을 업로드하여 재료를 인식하면, 재료가 인식되지만 화면의 재료 목록에 바로 표시되지 않는 문제가 있었습니다.

## 원인 분석

1. `RecipeRecommendationPage`에서 `setIngredients`로 재료를 추가
2. 하지만 `IngredientInputForm` 컴포넌트는 자체적으로 `useState`로 재료 상태를 관리
3. 부모 컴포넌트의 상태 변경이 자식 컴포넌트에 반영되지 않음
4. `initialIngredients`는 컴포넌트 마운트 시에만 사용되고, 이후 변경사항은 무시됨

## 해결 방법

### 1. IngredientInputForm 컴포넌트 수정

**변경 사항**:
- `onIngredientsChange` prop 추가 - 부모에게 재료 변경 알림
- `useEffect`로 `initialIngredients` 변경 감지 및 동기화
- `updateIngredients` 헬퍼 함수로 로컬 상태와 부모 상태 동시 업데이트

```javascript
export default function IngredientInputForm({ 
  onSubmit, 
  onImageUpload, 
  initialIngredients = [], 
  onIngredientsChange  // 새로 추가
}) {
  const [ingredients, setIngredients] = useState(initialIngredients);

  // initialIngredients가 변경되면 업데이트
  React.useEffect(() => {
    setIngredients(initialIngredients);
  }, [initialIngredients]);

  // 재료 업데이트 시 부모에게도 알림
  const updateIngredients = (newIngredients) => {
    setIngredients(newIngredients);
    if (onIngredientsChange) {
      onIngredientsChange(newIngredients);
    }
  };

  const handleAdd = () => {
    const trimmed = currentInput.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      const newIngredients = [...ingredients, trimmed];
      updateIngredients(newIngredients);  // 변경됨
      setCurrentInput('');
      inputRef.current?.focus();
    }
  };

  const handleRemove = (ingredient) => {
    const newIngredients = ingredients.filter(i => i !== ingredient);
    updateIngredients(newIngredients);  // 변경됨
  };

  const handleClearAll = () => {
    updateIngredients([]);  // 변경됨
  };
}
```

### 2. RecipeRecommendationPage 수정

**변경 사항**:
- `handleImageUpload`에 사용자 피드백 추가
- 재료 인식 실패 시 명확한 메시지
- 성공 시 인식된 재료 개수와 이름 표시
- `IngredientInputForm`에 `onIngredientsChange` prop 전달

```javascript
const handleImageUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드할 수 있습니다.');
    return;
  }

  setRecognizing(true);
  setError(null);

  try {
    const detected = await recognizeIngredients(file);
    const ingredientNames = detected
      .filter(item => item.confidence > 0.5)
      .map(item => item.name);
    
    if (ingredientNames.length === 0) {
      alert('재료를 인식하지 못했습니다. 다른 이미지를 시도해보세요.');
      setRecognizing(false);
      return;
    }

    // 기존 재료와 중복 제거하여 추가
    const newIngredients = [...new Set([...ingredients, ...ingredientNames])];
    setIngredients(newIngredients);
    setShowImageUpload(false);
    
    alert(`${ingredientNames.length}개의 재료가 추가되었습니다: ${ingredientNames.join(', ')}`);
  } catch (err) {
    console.error('재료 인식 실패:', err);
    setError(err.message);
    alert(err.message || '재료 인식에 실패했습니다');
  } finally {
    setRecognizing(false);
  }
};

// IngredientInputForm에 onIngredientsChange 전달
<IngredientInputForm
  initialIngredients={ingredients}
  onSubmit={handleSubmit}
  onImageUpload={() => setShowImageUpload(true)}
  onIngredientsChange={setIngredients}  // 추가됨
/>
```

## 동작 흐름

### 이전 (문제 있음)
```
1. 사진 업로드
2. AI 재료 인식
3. RecipeRecommendationPage: setIngredients(newIngredients)
4. IngredientInputForm: initialIngredients는 변경되지만 무시됨
5. 화면에 재료 표시 안됨 ❌
```

### 수정 후 (정상 동작)
```
1. 사진 업로드
2. AI 재료 인식
3. RecipeRecommendationPage: setIngredients(newIngredients)
4. IngredientInputForm: useEffect가 initialIngredients 변경 감지
5. IngredientInputForm: setIngredients(initialIngredients)
6. 화면에 재료 표시됨 ✅
7. Alert: "3개의 재료가 추가되었습니다: 김치, 두부, 대파"
```

## 테스트 시나리오

### 시나리오 1: 사진으로 재료 추가
1. 레시피 추천 페이지 진입
2. "촬영" 버튼 클릭
3. 냉장고 사진 업로드
4. **예상 결과**:
   - 로딩 표시: "AI가 재료를 인식하는 중..."
   - 인식 완료 후 Alert: "3개의 재료가 추가되었습니다: 김치, 두부, 대파"
   - 재료 목록에 즉시 표시
   - 모달 자동 닫힘

### 시나리오 2: 재료 인식 실패
1. 재료가 없는 사진 업로드
2. **예상 결과**:
   - Alert: "재료를 인식하지 못했습니다. 다른 이미지를 시도해보세요."
   - 모달은 열린 상태 유지

### 시나리오 3: 직접 입력 + 사진 인식 혼합
1. 직접 입력으로 "양파" 추가
2. 사진 업로드로 "김치, 두부" 인식
3. **예상 결과**:
   - 재료 목록: "양파, 김치, 두부" (3개)
   - 중복 제거 처리

### 시나리오 4: 냉장고에서 전달받은 재료 + 사진 인식
1. 냉장고 페이지에서 "대파, 마늘" 추가 후 "이 재료로 요리하기"
2. 레시피 추천 페이지에서 사진 업로드로 "김치" 추가
3. **예상 결과**:
   - 재료 목록: "대파, 마늘, 김치" (3개)
   - 모든 재료가 정상 표시

## 개선된 사용자 경험

1. **즉각적인 피드백**: 재료 인식 후 바로 목록에 표시
2. **명확한 알림**: 몇 개의 재료가 추가되었는지, 어떤 재료인지 표시
3. **에러 처리**: 인식 실패 시 명확한 안내 메시지
4. **중복 방지**: 이미 있는 재료는 중복 추가되지 않음
5. **양방향 동기화**: 부모-자식 컴포넌트 간 재료 상태 완벽 동기화

## 관련 파일

- `src/components/RecipeRecommendationPage.jsx` - 부모 컴포넌트, 재료 상태 관리
- `src/components/IngredientInputForm.jsx` - 자식 컴포넌트, 재료 입력 폼
- `src/services/openai.js` - AI 재료 인식 API 호출
- `server/routes/ai.js` - 백엔드 재료 인식 엔드포인트

## 기술적 세부사항

### React 상태 동기화 패턴
- 부모 컴포넌트: 단일 진실 공급원 (Single Source of Truth)
- 자식 컴포넌트: 부모 상태를 로컬 상태로 복사 + useEffect로 동기화
- 양방향 통신: `initialIngredients` (부모→자식), `onIngredientsChange` (자식→부모)

### 중복 제거
```javascript
const newIngredients = [...new Set([...ingredients, ...ingredientNames])];
```
- Set을 사용하여 자동으로 중복 제거
- 기존 재료 + 새 재료를 합친 후 중복 제거

### 사용자 피드백
- 로딩 중: Loader2 아이콘 + "AI가 재료를 인식하는 중..."
- 성공: Alert + 재료 목록 업데이트
- 실패: Alert + 모달 유지 (재시도 가능)
