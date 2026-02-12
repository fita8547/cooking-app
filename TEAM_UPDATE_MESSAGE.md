# 팀원들에게 - 주요 변경사항 안내 📢

안녕하세요! 오늘 많은 부분을 개선했습니다. 각 파트별로 변경사항을 정리했으니 확인 부탁드립니다.

---

## 🎨 프론트엔드 변경사항

### 1. 디자인 시스템 전면 개편
**변경 이유**: 음식 앱에 맞는 따뜻한 느낌 필요

**주요 변경**:
- **컬러 테마**: 보라색 → 은은한 오렌지 톤 (#ff8c42)
- **새 파일**: `src/theme.css` - 전역 CSS 변수 시스템
  ```css
  --primary: #ff8c42 (은은한 오렌지)
  --primary-dark: #ff7420
  --bg-secondary: #fffaf5 (크림색)
  ```

**영향받는 컴포넌트**:
- `HomeHub.jsx` - 홈 화면
- `Login.jsx` - 로그인 화면
- `QuickHealthInfo.jsx` - 건강기록 화면

**작업 필요**: 
- 나머지 컴포넌트들도 CSS 변수 사용 권장
- 하드코딩된 색상 값 → `var(--primary)` 로 변경

---

### 2. 페이지 플로우 개선
**변경 이유**: 사용자가 페이지 이동 없이 자연스럽게 사용할 수 있도록

**주요 변경**:

#### 2-1. 냉장고 → 레시피 추천 연결
**파일**: `AppRouter.jsx`, `FridgePage.jsx`, `RecipeRecommendationPage.jsx`

```javascript
// 냉장고에서 "이 재료로 요리하기" 클릭
→ 재료 목록이 자동으로 레시피 추천 페이지로 전달
→ 자동으로 추천 시작 (0.5초 딜레이)
```

**구현**:
- `AppRouter`에 `ingredientsToRecommend` 상태 추가
- `FridgePage`에서 재료 이름 배열 전달
- `RecipeRecommendationPage`에서 `initialIngredients` prop 받아서 자동 추천

#### 2-2. 레시피 추천 페이지 개선
**파일**: `RecipeRecommendationPage.jsx`

**Before**: 재료 입력 → 로딩 페이지 → 결과 페이지 (3단계)
**After**: 재료 입력 + 결과를 같은 페이지에 표시 (1페이지)

```javascript
// step 상태 제거
// hasSearched 상태로 결과 표시 여부 관리
{!loading && hasSearched && recipes.length > 0 && (
  <div className="results-section">
    {/* 결과 표시 */}
  </div>
)}
```

---

### 3. 이미지 인식 기능 개선
**변경 이유**: 사용자 경험 향상 + 버그 수정

**주요 변경**:

#### 3-1. 드래그 앤 드롭 추가
**파일**: `FridgePage.jsx`, `RecipeRecommendationPage.jsx`

```javascript
// 이미지를 드래그하면 업로드 영역 하이라이트
const [isDragging, setIsDragging] = useState(false);

<div 
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  className={isDragging ? 'dragging' : ''}
>
```

**CSS 추가**:
```css
.upload-area.dragging {
  border-color: var(--primary);
  background: var(--primary-lightest);
  transform: scale(1.02);
}
```

#### 3-2. 재료 인식 후 즉시 표시
**파일**: `IngredientInputForm.jsx`, `RecipeRecommendationPage.jsx`

**Before**: 이미지 인식 → 재료 목록에 안 보임 (버그)
**After**: 이미지 인식 → 즉시 재료 목록에 추가

**해결 방법**:
```javascript
// IngredientInputForm에 useEffect 추가
useEffect(() => {
  setIngredients(initialIngredients);
}, [initialIngredients]);

// onIngredientsChange prop으로 부모에게 알림
const updateIngredients = (newIngredients) => {
  setIngredients(newIngredients);
  if (onIngredientsChange) {
    onIngredientsChange(newIngredients);
  }
};
```

#### 3-3. 알림 제거
**파일**: `FridgePage.jsx`, `RecipeRecommendationPage.jsx`

**Before**: 재료 인식 완료 시 alert 표시
**After**: 알림 없이 바로 목록에 추가 (더 자연스러움)

---

### 4. 한글 입력 버그 수정
**파일**: `QuickHealthInfo.jsx` (이전에 수정 완료)

**문제**: 알레르기에 "우유" 입력 시 "우유, 유" 두 개 생성
**해결**: IME composition 이벤트 처리

```javascript
const [isComposing, setIsComposing] = useState(false);

onCompositionStart={() => setIsComposing(true)}
onCompositionEnd={() => setIsComposing(false)}
onKeyDown={(e) => {
  if (e.key === 'Enter' && !isComposing) {
    // Enter 처리
  }
}}
```

---

## 🔧 백엔드 변경사항

### 1. OpenAI 레시피 생성 통합
**변경 이유**: DB에 저장된 레시피만으로는 한계 → AI로 무한한 레시피 생성

**주요 변경**:
**파일**: `server/services/RecipeRecommendationService.js`

#### 추가된 메서드:

```javascript
// 1. OpenAI 클라이언트 초기화
_getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

// 2. AI 레시피 생성
async _generateRecipesWithAI(ingredients, healthProfile, nutritionTargets) {
  const openai = this._getOpenAIClient();
  if (!openai) return null; // API 키 없으면 null 반환
  
  const prompt = this._buildRecipePrompt(...);
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [...],
    temperature: 0.7,
    max_tokens: 3000,
    response_format: { type: "json_object" }
  });
  
  return result.recipes;
}

// 3. 프롬프트 구성
_buildRecipePrompt(ingredients, healthProfile, nutritionTargets) {
  // 재료 목록
  // 건강 정보 (나이, 성별, 알레르기, 식단 목표, 선호)
  // 영양 목표 (칼로리, 단백질, 탄수화물, 지방)
  // JSON 형식 요청
}
```

#### 메인 추천 로직 변경:

```javascript
async recommendRecipes(ingredients, healthProfile, nutritionTargets, userId) {
  // 1. OpenAI로 레시피 생성 시도
  const aiRecipes = await this._generateRecipesWithAI(...);
  
  if (aiRecipes && aiRecipes.length > 0) {
    // AI 레시피를 exact/extended로 분류
    return { exactMatches, extendedMatches };
  }
  
  // 2. OpenAI 실패 시 DB 레시피로 폴백
  // ... 기존 로직 유지
}
```

**폴백 메커니즘**:
- OpenAI API 키 없음 → DB 레시피 사용
- OpenAI 오류 발생 → DB 레시피 사용
- 서비스 중단 없이 안정적 운영

---

### 2. 기존 API 유지
**파일**: `server/routes/recipes.js`

**변경 없음** - 기존 API 엔드포인트 그대로 유지:
- `POST /api/recipes/recommend` - 레시피 추천
- `GET /api/recipes/search` - 레시피 검색
- `GET /api/recipes/:id` - 레시피 상세

**내부 동작만 변경**:
- RecipeRecommendationService가 OpenAI 사용
- 클라이언트는 변경 없이 동일하게 호출

---

## 🤖 AI 부분 변경사항

### 1. OpenAI 통합 구조

```
사용자 입력 (재료 + 건강 정보)
    ↓
RecipeRecommendationService
    ↓
OpenAI GPT-4o-mini
    ↓
JSON 형식 레시피 5개 생성
    ↓
exact/extended 분류
    ↓
클라이언트에 반환
```

### 2. 프롬프트 구성

**입력 데이터**:
```javascript
{
  ingredients: ['김치', '두부', '계란'],
  healthProfile: {
    age: 30,
    gender: 'male',
    allergies: ['우유', '땅콩'],
    dietaryGoal: 'weight_loss',
    preferences: ['한식', '고단백']
  },
  nutritionTargets: {
    calories: 450,
    protein: 35,
    carbs: 40,
    fat: 15
  }
}
```

**프롬프트 예시**:
```
다음 재료를 사용하여 레시피를 추천해주세요.

사용 가능한 재료: 김치, 두부, 계란

사용자 건강 정보:
- 나이: 30세
- 성별: 남성
- 알레르기: 우유, 땅콩 (이 재료들은 절대 사용하지 마세요)
- 식단 목표: 체중 감량
- 선호 식단: 한식, 고단백

목표 영양 정보 (1끼 기준):
- 칼로리: 450kcal
- 단백질: 35g
- 탄수화물: 40g
- 지방: 15g

다음 JSON 형식으로 5개의 레시피를 반환해주세요:
{
  "recipes": [
    {
      "name": "레시피 이름",
      "description": "간단한 설명",
      "ingredients": [...],
      "steps": [...],
      "nutrition": {...},
      "rationale": "추천 이유"
    }
  ]
}
```

### 3. 응답 형식

```json
{
  "recipes": [
    {
      "name": "김치 두부 볶음",
      "description": "단백질이 풍부한 간단한 한식 요리",
      "cuisine": "한식",
      "ingredients": [
        {
          "name": "김치",
          "amount": "200",
          "unit": "g",
          "isAvailable": true
        },
        {
          "name": "두부",
          "amount": "1",
          "unit": "모",
          "isAvailable": true
        }
      ],
      "steps": [
        {
          "stepNumber": 1,
          "instruction": "김치를 송송 썰어주세요",
          "duration": 3
        }
      ],
      "nutrition": {
        "calories": 280,
        "protein": 18,
        "carbs": 25,
        "fat": 12
      },
      "difficulty": "쉬움",
      "cookingTime": 20,
      "servings": 2,
      "image": "🍲",
      "rationale": "고단백 + 저칼로리 - 체중 감량 목표에 적합"
    }
  ]
}
```

### 4. 이미지 인식 (기존 유지)

**파일**: `server/routes/ai.js`, `src/services/openai.js`

**변경 없음** - 기존 OpenAI Vision API 그대로 사용:
```javascript
POST /api/ai/recognize-ingredients
→ OpenAI Vision API
→ 재료 목록 반환
```

---

## 📁 새로 생성된 파일

### 문서
1. `OPENAI_RECIPE_RECOMMENDATION.md` - OpenAI 통합 상세 문서
2. `DRAG_DROP_COMPLETION.md` - 드래그 앤 드롭 구현 문서
3. `IMAGE_RECOGNITION_FIX.md` - 이미지 인식 버그 수정 문서
4. `FRIDGE_TO_RECOMMEND_INTEGRATION.md` - 페이지 통합 문서
5. `COLOR_THEME_UPDATE.md` - 컬러 테마 변경 문서
6. `PR_DESCRIPTION.md` - PR 설명
7. `GIT_COMMANDS.md` - Git 커밋 가이드

### 코드
1. `src/theme.css` - 전역 CSS 변수 시스템

---

## 🔧 환경 설정

### 필수: OpenAI API 키 설정

`.env` 파일에 이미 설정되어 있음:
```bash
OPENAI_API_KEY=sk-proj-...
```

**중요**: 
- API 키가 없으면 자동으로 DB 레시피 사용 (폴백)
- 프로덕션 배포 시 환경변수 확인 필요

---

## 🧪 테스트 필요 사항

### 프론트엔드
- [ ] 모든 페이지에서 새 컬러 테마 확인
- [ ] 드래그 앤 드롭 이미지 업로드 테스트
- [ ] 냉장고 → 레시피 추천 플로우 테스트
- [ ] 한글 입력 테스트 (알레르기, 재료)
- [ ] 반응형 디자인 확인

### 백엔드
- [ ] OpenAI 레시피 생성 테스트
- [ ] 폴백 메커니즘 테스트 (API 키 없을 때)
- [ ] 알레르기 필터링 확인
- [ ] 영양 목표 반영 확인

### AI
- [ ] 다양한 재료 조합 테스트
- [ ] 건강 정보 반영 확인
- [ ] 알레르기 재료 제외 확인
- [ ] 응답 시간 측정

---

## 🚨 주의사항

### 1. CSS 변수 사용
**기존 코드 수정 시**:
```css
/* ❌ 하지 마세요 */
color: #667eea;
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* ✅ 이렇게 하세요 */
color: var(--primary);
background: var(--gradient-primary);
```

### 2. OpenAI API 비용
- 레시피 생성: 약 $0.01-0.02/요청
- 이미지 인식: 약 $0.01/요청
- 개발 중에는 테스트 최소화 권장

### 3. 폴백 동작 확인
```javascript
// 서버 로그 확인
✅ OpenAI로 레시피 생성 중...
✅ OpenAI로 5개 레시피 생성 완료

// 또는
⚠️  OpenAI API 키 없음 - DB 레시피 사용
```

---

## 📞 질문이나 이슈 있으면

1. **디자인 관련**: `COLOR_THEME_UPDATE.md` 참고
2. **OpenAI 관련**: `OPENAI_RECIPE_RECOMMENDATION.md` 참고
3. **페이지 플로우**: `FRIDGE_TO_RECOMMEND_INTEGRATION.md` 참고
4. **이미지 인식**: `IMAGE_RECOGNITION_FIX.md` 참고

또는 직접 연락 주세요!

---

## 🎯 다음 작업 제안

### 우선순위 높음
1. 나머지 컴포넌트에 CSS 변수 적용
2. OpenAI 레시피 캐싱 (비용 절감)
3. 에러 처리 강화

### 우선순위 중간
1. 레시피 북마크 기능
2. 사용자 피드백 (좋아요/싫어요)
3. 레시피 이미지 생성 (DALL-E)

### 우선순위 낮음
1. 다크 모드
2. 다국어 지원
3. 접근성 개선

---

**변경사항이 많아서 복잡해 보일 수 있지만, 실제로는 사용자 경험을 크게 개선하는 변경들입니다!**

**궁금한 점 있으면 언제든 물어보세요! 🙌**
