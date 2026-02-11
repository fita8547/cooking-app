# 디자인 문서 (Design Document)

## 개요 (Overview)

애드혹 쿡킹 AI 서비스는 사용자의 냉장고 재료를 기반으로 AI가 맞춤형 레시피를 추천하고, 건강 정보를 고려한 식단 관리를 제공하며, 단계별 요리 가이드를 통해 누구나 쉽게 요리할 수 있도록 돕는 웹/모바일 애플리케이션입니다.

**핵심 가치:**
- 재료 낭비 최소화: 보유한 재료로 만들 수 있는 요리 우선 추천
- 개인화된 건강 관리: 사용자의 건강 정보와 목표에 맞는 식단 제공
- 쉬운 요리 경험: 초보자도 따라할 수 있는 단계별 가이드
- 지속적인 학습: 사용자 취향을 학습하여 만족도 높은 추천

**기술 스택:**
- Frontend: React Native (Expo) 또는 Next.js
- Backend: Node.js/Express 또는 Next.js API Routes
- AI: OpenAI API (GPT-4 for recipe generation, GPT-4 Vision for ingredient recognition)
- Database: PostgreSQL 또는 MongoDB
- Deployment: Vercel (웹), Expo (모바일)

## 아키텍처 (Architecture)

### 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   Web Client     │         │  Mobile Client   │         │
│  │   (Next.js)      │         │  (React Native)  │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│                    (Next.js API Routes)                      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Recipe     │   │   Meal       │   │    User      │
│   Service    │   │   Service    │   │   Service    │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      AI Service Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   OpenAI     │  │  Ingredient  │  │  Preference  │     │
│  │   Recipe     │  │  Recognition │  │   Learning   │     │
│  │   Engine     │  │   (Vision)   │  │   Engine     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   User DB    │  │   Recipe DB  │  │   Meal DB    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 흐름

1. **재료 입력 및 인식 흐름:**
   - 사용자가 재료 이미지 업로드 → API Gateway → Ingredient Recognition Service
   - OpenAI Vision API로 이미지 분석 → 재료 후보 반환
   - 사용자 확인/수정 → User Service에 저장

2. **레시피 추천 흐름:**
   - 사용자 재료 목록 + 건강 정보 + 취향 데이터 → Recipe Service
   - OpenAI API로 레시피 생성 (프롬프트 엔지니어링)
   - Preference Learning Engine이 과거 데이터 기반 우선순위 조정
   - 레시피 목록 반환 (보유 재료만 사용 레시피 우선)

3. **식사 기록 흐름:**
   - 사용자가 식사 완료 → Meal Service에 기록 저장
   - 영양 정보 계산 및 저장
   - Preference Learning Engine에 데이터 전달 (학습용)

## 컴포넌트 및 인터페이스 (Components and Interfaces)

### 1. API Gateway Layer

#### API Endpoints

```typescript
// 레시피 관련
POST   /api/recipes/generate
  Request: { ingredients: string[], userProfile: UserProfile, mode: 'exact' | 'flexible' }
  Response: { recipes: Recipe[], missingIngredients: Map<recipeId, string[]> }

GET    /api/recipes/:id
  Response: { recipe: Recipe }

// 재료 인식
POST   /api/ingredients/recognize
  Request: { image: File }
  Response: { recognizedIngredients: string[], confidence: number[] }

POST   /api/ingredients/save
  Request: { userId: string, ingredients: string[] }
  Response: { success: boolean }

GET    /api/ingredients/:userId
  Response: { ingredients: string[] }

// 식사 기록
POST   /api/meals
  Request: { userId: string, recipeId: string, date: Date, rating?: number }
  Response: { mealId: string, nutritionSummary: NutritionInfo }

GET    /api/meals/history
  Query: { userId: string, startDate?: Date, endDate?: Date }
  Response: { meals: MealRecord[], dailySummaries: DailyNutrition[] }

PUT    /api/meals/:mealId
  Request: { rating?: number, notes?: string }
  Response: { success: boolean }

DELETE /api/meals/:mealId
  Response: { success: boolean }

// 사용자 프로필
POST   /api/users/profile
  Request: { userProfile: UserProfile }
  Response: { userId: string, bmr: number, targetCalories: number }

GET    /api/users/profile/:userId
  Response: { userProfile: UserProfile, healthMetrics: HealthMetrics }

PUT    /api/users/profile/:userId
  Request: { userProfile: Partial<UserProfile> }
  Response: { success: boolean }

// 식단 계획
POST   /api/diet/plan
  Request: { userId: string, days: number, preferences?: string[] }
  Response: { mealPlan: DailyMealPlan[] }
```

### 2. Recipe Service

**책임:**
- 재료 기반 레시피 생성 및 추천
- OpenAI API와 통신하여 레시피 생성
- 레시피 필터링 (알레르기, 영양 목표)
- 부족한 재료 계산

**주요 함수:**

```typescript
interface RecipeService {
  generateRecipes(
    ingredients: string[],
    userProfile: UserProfile,
    mode: 'exact' | 'flexible'
  ): Promise<Recipe[]>
  
  filterByAllergies(recipes: Recipe[], allergies: string[]): Recipe[]
  
  calculateMissingIngredients(
    recipe: Recipe,
    availableIngredients: string[]
  ): string[]
  
  rankByPreference(
    recipes: Recipe[],
    userPreferences: UserPreference
  ): Recipe[]
  
  getRecipeById(recipeId: string): Promise<Recipe>
}
```

**OpenAI 프롬프트 전략:**

```typescript
function buildRecipePrompt(
  ingredients: string[],
  userProfile: UserProfile,
  mode: 'exact' | 'flexible'
): string {
  const basePrompt = `당신은 전문 셰프입니다. 다음 재료를 사용하여 레시피를 추천해주세요.

사용 가능한 재료: ${ingredients.join(', ')}

사용자 정보:
- 나이: ${userProfile.age}, 성별: ${userProfile.gender}
- 목표 칼로리: ${userProfile.targetCalories}kcal
- 알레르기: ${userProfile.allergies.join(', ') || '없음'}
- 식단 목표: ${userProfile.dietaryGoal}

${mode === 'exact' ? '제공된 재료만 사용하는 레시피를 추천해주세요.' : '필요시 추가 재료를 포함할 수 있습니다.'}

다음 JSON 형식으로 3개의 레시피를 반환해주세요:
{
  "recipes": [
    {
      "name": "레시피 이름",
      "description": "간단한 설명",
      "ingredients": [
        {"name": "재료명", "amount": "양", "isAvailable": true/false}
      ],
      "steps": [
        {"stepNumber": 1, "instruction": "조리 단계", "duration": "예상 시간(분)"}
      ],
      "nutrition": {
        "calories": 숫자,
        "protein": 숫자,
        "carbs": 숫자,
        "fat": 숫자
      },
      "difficulty": "쉬움|보통|어려움",
      "cookingTime": 총 조리 시간(분)
    }
  ]
}`;
  
  return basePrompt;
}
```

### 3. Ingredient Recognition Service

**책임:**
- 이미지에서 재료 인식
- OpenAI Vision API 활용
- 인식 결과 신뢰도 계산

**주요 함수:**

```typescript
interface IngredientRecognitionService {
  recognizeIngredients(imageFile: File): Promise<RecognitionResult>
  
  validateIngredients(ingredients: string[]): boolean
}

interface RecognitionResult {
  ingredients: string[]
  confidence: number[]  // 각 재료에 대한 신뢰도 (0-1)
  rawResponse: string   // OpenAI 원본 응답
}
```

**OpenAI Vision 프롬프트:**

```typescript
function buildVisionPrompt(): string {
  return `이 이미지에 있는 식재료를 식별해주세요. 
  
다음 형식으로 JSON을 반환해주세요:
{
  "ingredients": [
    {"name": "재료명 (한글)", "confidence": 0.0-1.0}
  ]
}

일반적인 식재료만 식별하고, 명확하지 않은 경우 confidence를 낮게 설정해주세요.`;
}
```

### 4. Meal Tracking Service

**책임:**
- 식사 기록 저장 및 조회
- 일일/주간/월간 영양 통계 계산
- 식사 기록 수정/삭제

**주요 함수:**

```typescript
interface MealTrackingService {
  saveMeal(meal: MealRecord): Promise<string>
  
  getMealHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<MealRecord[]>
  
  updateMeal(mealId: string, updates: Partial<MealRecord>): Promise<boolean>
  
  deleteMeal(mealId: string): Promise<boolean>
  
  calculateDailyNutrition(
    userId: string,
    date: Date
  ): Promise<NutritionInfo>
}
```

### 5. Preference Learning Service

**책임:**
- 사용자 취향 데이터 수집 및 분석
- 선호 레시피 패턴 학습
- 개인화 추천 점수 계산

**주요 함수:**

```typescript
interface PreferenceLearningService {
  recordPreference(
    userId: string,
    recipeId: string,
    rating: number
  ): Promise<void>
  
  analyzePreferences(userId: string): Promise<UserPreference>
  
  calculatePreferenceScore(
    recipe: Recipe,
    userPreference: UserPreference
  ): number
}

interface UserPreference {
  favoriteIngredients: Map<string, number>  // 재료별 선호도 점수
  favoriteCuisines: string[]                // 선호 요리 종류
  averageCookingTime: number                // 선호 조리 시간
  difficultyPreference: 'easy' | 'medium' | 'hard'
}
```

**선호도 학습 알고리즘:**

```typescript
function analyzeUserPreferences(mealHistory: MealRecord[]): UserPreference {
  // 1. 좋아요 표시한 레시피에서 재료 추출
  const likedRecipes = mealHistory.filter(m => m.rating >= 4)
  const ingredientFrequency = new Map<string, number>()
  
  likedRecipes.forEach(meal => {
    meal.recipe.ingredients.forEach(ing => {
      ingredientFrequency.set(
        ing.name,
        (ingredientFrequency.get(ing.name) || 0) + 1
      )
    })
  })
  
  // 2. 빈도 기반 선호도 점수 계산 (0-1 정규화)
  const maxFreq = Math.max(...ingredientFrequency.values())
  const favoriteIngredients = new Map<string, number>()
  
  ingredientFrequency.forEach((freq, ingredient) => {
    favoriteIngredients.set(ingredient, freq / maxFreq)
  })
  
  // 3. 선호 요리 종류 추출
  const cuisineFrequency = new Map<string, number>()
  likedRecipes.forEach(meal => {
    const cuisine = meal.recipe.cuisine || 'general'
    cuisineFrequency.set(cuisine, (cuisineFrequency.get(cuisine) || 0) + 1)
  })
  
  const favoriteCuisines = Array.from(cuisineFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cuisine]) => cuisine)
  
  // 4. 평균 조리 시간 계산
  const avgTime = likedRecipes.reduce((sum, m) => sum + m.recipe.cookingTime, 0) / likedRecipes.length
  
  // 5. 난이도 선호도 (가장 많이 선택한 난이도)
  const difficultyCount = { easy: 0, medium: 0, hard: 0 }
  likedRecipes.forEach(m => {
    difficultyCount[m.recipe.difficulty]++
  })
  const difficultyPreference = Object.entries(difficultyCount)
    .sort((a, b) => b[1] - a[1])[0][0] as 'easy' | 'medium' | 'hard'
  
  return {
    favoriteIngredients,
    favoriteCuisines,
    averageCookingTime: avgTime,
    difficultyPreference
  }
}
```

### 6. Health Calculator Service

**책임:**
- BMR (기초대사량) 계산
- 목표 칼로리 계산
- 영양소 권장량 계산

**주요 함수:**

```typescript
interface HealthCalculatorService {
  calculateBMR(profile: UserProfile): number
  
  calculateTargetCalories(
    bmr: number,
    activityLevel: string,
    goal: 'lose' | 'maintain' | 'gain'
  ): number
  
  calculateMacroTargets(targetCalories: number): MacroTargets
}

interface MacroTargets {
  protein: number    // 그램
  carbs: number      // 그램
  fat: number        // 그램
}
```

**BMR 계산 공식 (Mifflin-St Jeor):**

```typescript
function calculateBMR(profile: UserProfile): number {
  const { weight, height, age, gender } = profile
  
  // Mifflin-St Jeor 공식
  let bmr: number
  
  if (gender === 'male') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
  }
  
  return Math.round(bmr)
}

function calculateTargetCalories(
  bmr: number,
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active',
  goal: 'lose' | 'maintain' | 'gain'
): number {
  // 활동 수준에 따른 계수
  const activityMultipliers = {
    sedentary: 1.2,   // 거의 운동 안함
    light: 1.375,     // 가벼운 운동 (주 1-3일)
    moderate: 1.55,   // 중간 운동 (주 3-5일)
    active: 1.725     // 격렬한 운동 (주 6-7일)
  }
  
  const tdee = bmr * activityMultipliers[activityLevel]
  
  // 목표에 따른 칼로리 조정
  const goalAdjustments = {
    lose: -500,      // 주당 0.5kg 감량
    maintain: 0,
    gain: 300        // 주당 0.3kg 증량
  }
  
  return Math.round(tdee + goalAdjustments[goal])
}
```

## 데이터 모델 (Data Models)

### User Profile

```typescript
interface UserProfile {
  userId: string
  email: string
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  height: number          // cm
  weight: number          // kg
  allergies: string[]
  dietaryGoal: 'lose_weight' | 'maintain' | 'gain_muscle' | 'health'
  medicalConditions?: string[]
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active'
  createdAt: Date
  updatedAt: Date
}

interface HealthMetrics {
  bmr: number
  targetCalories: number
  macroTargets: MacroTargets
}
```

### Recipe

```typescript
interface Recipe {
  recipeId: string
  name: string
  description: string
  cuisine?: string        // 한식, 양식, 중식 등
  ingredients: Ingredient[]
  steps: CookingStep[]
  nutrition: NutritionInfo
  difficulty: 'easy' | 'medium' | 'hard'
  cookingTime: number     // 분
  servings: number
  imageUrl?: string
  createdAt: Date
}

interface Ingredient {
  name: string
  amount: string
  unit: string
  isAvailable: boolean    // 사용자가 보유한 재료인지
}

interface CookingStep {
  stepNumber: number
  instruction: string
  duration?: number       // 이 단계의 예상 시간 (분)
  imageUrl?: string
  timerRequired: boolean
}

interface NutritionInfo {
  calories: number
  protein: number         // 그램
  carbs: number          // 그램
  fat: number            // 그램
  fiber?: number
  sodium?: number        // mg
}
```

### Meal Record

```typescript
interface MealRecord {
  mealId: string
  userId: string
  recipeId: string
  recipe: Recipe          // 참조용 레시피 정보
  date: Date
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  rating?: number         // 1-5
  notes?: string
  nutrition: NutritionInfo
  createdAt: Date
  updatedAt: Date
}

interface DailyNutrition {
  date: Date
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  mealCount: number
  targetCalories: number
  caloriesDifference: number  // 목표 대비 차이
}
```

### User Ingredients

```typescript
interface UserIngredients {
  userId: string
  ingredients: string[]
  lastUpdated: Date
}
```

## 정확성 속성 (Correctness Properties)

*속성(Property)은 시스템의 모든 유효한 실행에서 참이어야 하는 특성 또는 동작입니다. 속성은 사람이 읽을 수 있는 명세와 기계가 검증할 수 있는 정확성 보장 사이의 다리 역할을 합니다.*


### Property Reflection (중복 제거 분석)

중복 속성 분석:
- 1.1과 1.5는 결합 가능: 재료 추가 시 유효성 검증 포함
- 2.2와 2.3은 유사: 보유 재료 우선순위와 필터링을 하나의 속성으로 통합
- 5.4와 5.5는 결합 가능: 삭제 작업과 삭제 후 상태를 하나의 속성으로
- 7.1과 2.7은 중복: 레시피 생성 성능 요구사항
- 7.2와 1.2는 중복: 이미지 인식 성능 요구사항
- 9.1과 9.2는 결합 가능: 데이터 보안 (저장 및 전송)

### Correctness Properties

**Property 1: 재료 추가 및 유효성 검증**
*For any* 사용자가 입력한 재료 목록에 대해, 시스템에 추가된 재료는 모두 유효한 재료여야 하며, 사용자의 재료 목록에 포함되어야 한다.
**Validates: Requirements 1.1, 1.5**

**Property 2: 재료 인식 성능 및 정확성**
*For any* 업로드된 이미지에 대해, 재료 인식 결과는 10초 이내에 반환되어야 하며, 각 인식된 재료는 신뢰도 점수를 포함해야 한다.
**Validates: Requirements 1.2**

**Property 3: 재료 목록 CRUD 작업**
*For any* 사용자의 재료 목록에 대해, 재료 추가, 수정, 삭제 작업 후 목록을 조회하면 변경사항이 정확히 반영되어야 한다.
**Validates: Requirements 1.4**

**Property 4: 보유 재료 기반 레시피 우선순위**
*For any* 레시피 추천 결과에 대해, 사용자가 보유한 재료만으로 만들 수 있는 레시피는 추가 재료가 필요한 레시피보다 항상 상위에 위치해야 한다.
**Validates: Requirements 2.2, 2.3**

**Property 5: 부족한 재료 계산 정확성**
*For any* 레시피와 사용자 재료 목록에 대해, 시스템이 계산한 부족한 재료 목록은 레시피 재료에서 사용자 보유 재료를 뺀 정확한 차집합이어야 한다.
**Validates: Requirements 2.5**

**Property 6: 레시피 생성 성능**
*For any* 레시피 추천 요청에 대해, 시스템은 5초 이내에 결과를 반환해야 한다.
**Validates: Requirements 2.7, 7.1**

**Property 7: 알레르기 필터링**
*For any* 사용자 프로필과 레시피 추천 결과에 대해, 반환된 모든 레시피는 사용자의 알레르기 목록에 있는 재료를 포함하지 않아야 한다.
**Validates: Requirements 3.3**

**Property 8: BMR 계산 정확성**
*For any* 유효한 사용자 프로필(나이, 성별, 키, 체중)에 대해, 계산된 BMR은 Mifflin-St Jeor 공식의 결과와 일치해야 한다.
**Validates: Requirements 3.2**

**Property 9: 영양 정보 완전성**
*For any* 레시피에 대해, 표시되는 영양 정보는 칼로리, 단백질, 탄수화물, 지방을 모두 포함해야 한다.
**Validates: Requirements 3.4**

**Property 10: 식사 기록 Round-trip**
*For any* 유효한 식사 기록에 대해, 저장 후 조회하면 원본과 동일한 데이터(날짜, 시간, 레시피, 영양 정보)를 반환해야 한다.
**Validates: Requirements 5.1**

**Property 11: 식사 기록 날짜 정렬**
*For any* 사용자의 식사 기록 목록에 대해, 조회 결과는 날짜 기준 내림차순(최신순)으로 정렬되어야 한다.
**Validates: Requirements 5.2**

**Property 12: 일일 영양 요약 계산**
*For any* 특정 날짜의 식사 기록들에 대해, 일일 영양 요약의 총 칼로리는 해당 날짜의 모든 식사 칼로리 합과 일치해야 한다.
**Validates: Requirements 5.3**

**Property 13: 식사 기록 삭제 완전성**
*For any* 삭제된 식사 기록에 대해, 삭제 후 해당 기록 ID로 조회하면 결과가 없어야 하며, 사용자의 식사 기록 목록에도 포함되지 않아야 한다.
**Validates: Requirements 5.4, 5.5**

**Property 14: 선호도 데이터 저장**
*For any* 사용자가 표시한 선호도(평가)에 대해, 저장 후 조회하면 동일한 평가 값이 반환되어야 한다.
**Validates: Requirements 6.1, 6.2**

**Property 15: 선호 재료 기반 추천 우선순위**
*For any* 충분한 선호도 데이터를 가진 사용자에 대해, 추천 레시피 목록에서 사용자가 선호한 재료를 포함한 레시피는 그렇지 않은 레시피보다 높은 우선순위를 가져야 한다.
**Validates: Requirements 6.3, 6.4, 6.5**

**Property 16: 화면 로딩 성능**
*For any* 화면 전환 요청에 대해, 새 화면은 2초 이내에 로드되어야 한다.
**Validates: Requirements 7.3**

**Property 17: 데이터 보안 (암호화 및 전송)**
*For any* 사용자의 민감한 데이터(건강 정보, 식사 기록)에 대해, 저장 시 암호화되어야 하며, 전송 시 HTTPS 프로토콜을 사용해야 한다.
**Validates: Requirements 9.1, 9.2**

**Property 18: 사용자 데이터 격리**
*For any* 두 명의 서로 다른 사용자에 대해, 한 사용자는 다른 사용자의 데이터(재료 목록, 식사 기록, 프로필)에 접근할 수 없어야 한다.
**Validates: Requirements 9.5**

**Property 19: 사용자 데이터 완전 삭제**
*For any* 데이터 삭제를 요청한 사용자에 대해, 삭제 후 해당 사용자의 모든 데이터(프로필, 재료, 식사 기록, 선호도)는 시스템에서 조회되지 않아야 한다.
**Validates: Requirements 9.4**

**Property 20: 주요 기능 접근성 (3탭 규칙)**
*For any* 주요 기능(재료 입력, 레시피 추천, 식사 기록, 프로필)에 대해, 홈 화면에서 해당 기능까지 최대 3번의 탭으로 접근할 수 있어야 한다.
**Validates: Requirements 10.2**

**Property 21: 에러 메시지 한글 제공**
*For any* 시스템 에러에 대해, 사용자에게 표시되는 에러 메시지는 한글이어야 하며, 해결 방법 안내를 포함해야 한다.
**Validates: Requirements 10.4**

**Property 22: RESTful API 규약 준수**
*For any* API 엔드포인트에 대해, HTTP 메서드(GET, POST, PUT, DELETE)는 RESTful 규약에 따라 사용되어야 하며, 응답은 일관된 JSON 형식이어야 한다.
**Validates: Requirements 11.2**

**Property 23: 일관된 에러 응답 형식**
*For any* API 에러 응답에 대해, 모든 엔드포인트는 동일한 에러 응답 구조(errorCode, message, details)를 반환해야 한다.
**Validates: Requirements 11.5**

## 에러 처리 (Error Handling)

### 에러 분류

**1. 클라이언트 에러 (4xx)**
- 400 Bad Request: 잘못된 요청 형식, 유효하지 않은 데이터
- 401 Unauthorized: 인증 실패
- 403 Forbidden: 권한 없음
- 404 Not Found: 리소스를 찾을 수 없음
- 422 Unprocessable Entity: 유효성 검증 실패

**2. 서버 에러 (5xx)**
- 500 Internal Server Error: 예상치 못한 서버 에러
- 503 Service Unavailable: OpenAI API 또는 외부 서비스 장애
- 504 Gateway Timeout: 외부 API 응답 시간 초과

### 에러 응답 형식

```typescript
interface ErrorResponse {
  errorCode: string        // 에러 코드 (예: "INVALID_INGREDIENT")
  message: string          // 사용자 친화적 한글 메시지
  details?: string         // 추가 상세 정보
  timestamp: Date
  path: string            // 에러가 발생한 API 경로
}
```

### 에러 처리 전략

**1. OpenAI API 에러 처리**
```typescript
async function callOpenAIWithRetry(
  prompt: string,
  maxRetries: number = 3
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        timeout: 30000  // 30초 타임아웃
      })
      return response.choices[0].message.content
    } catch (error) {
      if (attempt === maxRetries) {
        throw new ServiceUnavailableError(
          "AI 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요."
        )
      }
      // 지수 백오프
      await sleep(Math.pow(2, attempt) * 1000)
    }
  }
}
```

**2. 유효성 검증 에러**
```typescript
function validateUserProfile(profile: UserProfile): ValidationResult {
  const errors: string[] = []
  
  if (profile.age < 1 || profile.age > 120) {
    errors.push("나이는 1세에서 120세 사이여야 합니다.")
  }
  
  if (profile.height < 50 || profile.height > 300) {
    errors.push("키는 50cm에서 300cm 사이여야 합니다.")
  }
  
  if (profile.weight < 20 || profile.weight > 500) {
    errors.push("체중은 20kg에서 500kg 사이여야 합니다.")
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

**3. 데이터베이스 에러**
```typescript
async function safeDbOperation<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new ServiceUnavailableError(
        "데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해주세요."
      )
    }
    throw new InternalServerError(
      "데이터 처리 중 오류가 발생했습니다."
    )
  }
}
```

## 테스팅 전략 (Testing Strategy)

### 테스팅 접근 방식

이 프로젝트는 **단위 테스트**와 **속성 기반 테스트**를 모두 활용하여 포괄적인 테스트 커버리지를 달성합니다.

- **단위 테스트**: 특정 예제, 엣지 케이스, 에러 조건 검증
- **속성 기반 테스트**: 모든 입력에 대한 보편적 속성 검증

### 테스트 라이브러리

- **JavaScript/TypeScript**: fast-check (속성 기반 테스트), Jest (단위 테스트)
- **React Native**: React Native Testing Library, Jest

### 속성 기반 테스트 설정

각 속성 테스트는 최소 100회 반복 실행되어야 하며, 다음 형식의 태그를 포함해야 합니다:

```typescript
// Feature: adhoc-cooking-ai-service, Property 1: 재료 추가 및 유효성 검증
test('Property 1: 재료 추가 및 유효성 검증', () => {
  fc.assert(
    fc.property(
      fc.array(fc.string()),  // 임의의 재료 목록 생성
      async (ingredients) => {
        const validIngredients = ingredients.filter(isValidIngredient)
        const result = await addIngredientsToUser(userId, ingredients)
        
        // 추가된 재료는 모두 유효해야 함
        expect(result.addedIngredients).toEqual(validIngredients)
      }
    ),
    { numRuns: 100 }
  )
})
```

### 테스트 커버리지 목표

- **단위 테스트**: 각 서비스 함수의 주요 경로 및 엣지 케이스
- **속성 테스트**: 설계 문서의 모든 Correctness Properties
- **통합 테스트**: API 엔드포인트 간 상호작용
- **E2E 테스트**: 주요 사용자 플로우 (재료 입력 → 레시피 추천 → 요리 가이드 → 식사 기록)

### 테스트 우선순위

1. **높음**: 데이터 무결성 (Properties 1, 3, 7, 10, 13, 18, 19)
2. **높음**: 보안 (Properties 17, 18, 19)
3. **중간**: 성능 (Properties 2, 6, 16)
4. **중간**: 비즈니스 로직 (Properties 4, 5, 8, 11, 12, 15)
5. **낮음**: UI/UX (Properties 20, 21)

### 모의 객체 (Mocking) 전략

**OpenAI API 모킹:**
```typescript
// 테스트 환경에서 OpenAI API 응답 모킹
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                recipes: [mockRecipe1, mockRecipe2]
              })
            }
          }]
        })
      }
    }
  }))
}))
```

### 테스트 데이터 생성

**fast-check Arbitraries:**
```typescript
// 사용자 프로필 생성기
const userProfileArbitrary = fc.record({
  userId: fc.uuid(),
  age: fc.integer({ min: 18, max: 100 }),
  gender: fc.constantFrom('male', 'female', 'other'),
  height: fc.integer({ min: 140, max: 220 }),
  weight: fc.integer({ min: 40, max: 150 }),
  allergies: fc.array(fc.constantFrom('땅콩', '우유', '계란', '갑각류')),
  dietaryGoal: fc.constantFrom('lose_weight', 'maintain', 'gain_muscle'),
  activityLevel: fc.constantFrom('sedentary', 'light', 'moderate', 'active')
})

// 재료 목록 생성기
const ingredientsArbitrary = fc.array(
  fc.constantFrom('양파', '마늘', '당근', '감자', '토마토', '계란', '우유', '치즈'),
  { minLength: 1, maxLength: 10 }
)
```
