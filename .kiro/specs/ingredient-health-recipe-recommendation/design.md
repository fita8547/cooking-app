# Design Document: Ingredient-Health Recipe Recommendation

## Overview

This feature adds two major capabilities to the Ad-hoc Cooking AI service:

1. **Ingredient-Based Recipe Search**: Users can input available ingredients and receive recipe recommendations categorized as exact matches (using only available ingredients) or extended matches (requiring additional ingredients). Missing ingredients are clearly identified.

2. **Health-Based Meal Planning**: Users can input health information (age, gender, height, weight, allergies, dietary goals, medical conditions) to receive personalized meal recommendations. The system calculates BMI, BMR, TDEE, and macronutrient targets, then recommends recipes that align with these nutritional goals while respecting allergy constraints.

The integration of these features enables users to find recipes that match both their ingredient availability and their personalized nutritional needs.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  React Frontend │
│                 │
│  - Ingredient   │
│    Input Form   │
│  - Image Upload │
│    Component    │
│  - Health       │
│    Profile Form │
│  - Recipe       │
│    Display      │
│    with         │
│    Rationale    │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────────────────────────────────┐
│         Express Backend                     │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  Recipe Recommendation Controller    │  │
│  └──────────┬───────────────────────────┘  │
│             │                               │
│  ┌──────────▼───────────┐  ┌─────────────┐ │
│  │ Image Upload Service │  │  Ingredient │ │
│  │                      │  │  Recognition│ │
│  └──────────┬───────────┘  │  Service    │ │
│             │               └──────┬──────┘ │
│  ┌──────────▼───────────┐  ┌──────▼──────┐ │
│  │ Ingredient Matcher   │  │  Nutrition  │ │
│  │ Service              │  │  Calculator │ │
│  └──────────┬───────────┘  └──────┬──────┘ │
│             │                     │         │
│  ┌──────────▼─────────────────────▼──────┐ │
│  │    Recipe Recommendation Service     │ │
│  │                                       │ │
│  │  - Allergy Filter                    │ │
│  │  - Nutritional Filter                │ │
│  │  - Recipe Scorer                     │ │
│  │  - Nutritional Rationale Generator   │ │
│  └──────────┬────────────────────────────┘ │
│             │                               │
│  ┌──────────▼───────────┐  ┌─────────────┐ │
│  │   OpenAI Service     │  │   MongoDB   │ │
│  │                      │  │             │ │
│  │  - Recipe Generation │  │  - Health   │ │
│  │  - Ingredient        │  │    Profiles │ │
│  │    Matching          │  │  - Recipes  │ │
│  │  - Vision API        │  │  - Meal     │ │
│  │    (Image Recognition)│  │    History  │ │
│  └──────────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────┘
```

### Component Responsibilities

**Frontend Components:**
- **IngredientInputForm**: Collects available ingredients from user
- **ImageUploadComponent**: Handles image file selection, preview, and upload
- **HealthProfileForm**: Collects health information (age, gender, height, weight, allergies, goals, conditions)
- **RecipeDisplay**: Shows recommended recipes with nutritional info, missing ingredients, match type, and personalized rationale

**Backend Services:**
- **ImageUploadService**: Validates and processes uploaded image files
- **IngredientRecognitionService**: Calls OpenAI Vision API to extract ingredients from images
- **IngredientMatcherService**: Categorizes recipes as exact or extended matches, identifies missing ingredients
- **NutritionCalculator**: Computes BMI, BMR, TDEE, and macronutrient targets from health profile
- **RecipeRecommendationService**: Orchestrates filtering and scoring of recipes based on ingredients and nutrition
- **AllergyFilter**: Excludes recipes containing user allergens
- **NutritionalFilter**: Filters recipes by calorie and macronutrient targets
- **RecipeScorer**: Ranks recipes by ingredient match quality and nutritional alignment
- **NutritionalRationaleGenerator**: Creates personalized rationale text based on health profile and meal history
- **OpenAIService**: Generates recipe suggestions, performs ingredient matching, and recognizes ingredients from images
- **HealthProfileRepository**: Stores and retrieves user health profiles from MongoDB
- **MealHistoryRepository**: Stores and retrieves user meal history from MongoDB

## Components and Interfaces

### Frontend Components

#### IngredientInputForm

```typescript
interface IngredientInputFormProps {
  onSubmit: (ingredients: string[]) => void;
  initialIngredients?: string[];
}

interface IngredientInputFormState {
  ingredients: string[];
  currentInput: string;
}
```

**Responsibilities:**
- Display input field for adding ingredients
- Maintain list of added ingredients with remove capability
- Validate ingredient input (non-empty strings)
- Submit ingredient list to backend

#### HealthProfileForm

```typescript
interface HealthProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;  // in cm
  weight: number;  // in kg
  heightUnit: 'cm' | 'in';
  weightUnit: 'kg' | 'lb';
  allergies: string[];
  dietaryGoal: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain';
  medicalConditions?: string[];
}

interface HealthProfileFormProps {
  onSubmit: (profile: HealthProfile) => void;
  initialProfile?: HealthProfile;
}
```

**Responsibilities:**
- Collect all health information fields
- Validate numeric inputs (age > 0, height > 0, weight > 0)
- Support unit conversion (cm/in, kg/lb)
- Allow multiple allergy entries
- Submit complete health profile to backend

#### ImageUploadComponent

```typescript
interface ImageUploadComponentProps {
  onImageUpload: (file: File) => void;
  onRecognizedIngredients: (ingredients: string[]) => void;
  isProcessing: boolean;
}

interface ImageUploadComponentState {
  selectedFile: File | null;
  previewUrl: string | null;
  recognizedIngredients: string[];
  confirmedIngredients: string[];
  error: string | null;
}
```

**Responsibilities:**
- Display file input for image selection (JPEG, PNG, WebP)
- Show image preview after selection
- Validate file size (max 10MB) and format
- Upload image to backend for recognition
- Display recognized ingredients list
- Allow user to review and remove incorrect ingredients
- Allow user to manually add ingredients
- Confirm and submit final ingredient list
- Handle recognition errors gracefully

#### RecipeDisplay

```typescript
interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string[];
  nutrition: NutritionInfo;
  matchType: 'exact' | 'extended';
  missingIngredients?: string[];
  rationale?: string;  // Personalized explanation for recommendation
}

interface NutritionInfo {
  calories: number;
  protein: number;  // grams
  carbs: number;    // grams
  fat: number;      // grams
}

interface RecipeDisplayProps {
  recipes: Recipe[];
  userTargets?: MacronutrientTargets;
}
```

**Responsibilities:**
- Display recipe list grouped by match type
- Show nutritional information for each recipe
- Highlight missing ingredients for extended matches
- Compare recipe nutrition to user targets (if available)
- Display personalized rationale at the bottom of each recipe card
- Provide clear visual distinction between exact and extended matches

### Backend Services

#### NutritionCalculator

```typescript
interface NutritionCalculator {
  calculateBMI(height: number, weight: number): number;
  calculateBMR(age: number, gender: string, height: number, weight: number): number;
  calculateTDEE(bmr: number, activityLevel: string): number;
  calculateProteinTarget(weight: number, goal: string): number;
  calculateMacronutrients(tdee: number, proteinTarget: number, goal: string): MacronutrientTargets;
  determineTargetWeightRange(height: number, gender: string): { min: number; max: number };
}

interface MacronutrientTargets {
  calories: number;
  protein: number;   // grams
  carbs: number;     // grams
  fat: number;       // grams
}
```

**Calculation Formulas:**

**BMI Calculation:**
```
BMI = weight(kg) / (height(m))²
```

**BMR Calculation (Mifflin-St Jeor Equation):**
```
Male: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5
Female: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) - 161
```

**TDEE Calculation:**
```
TDEE = BMR × Activity_Factor
Activity Factors:
- Sedentary (little/no exercise): 1.2
- Lightly active (1-3 days/week): 1.375
- Moderately active (3-5 days/week): 1.55
- Very active (6-7 days/week): 1.725
- Extremely active (physical job + exercise): 1.9
```

**Protein Target:**
```
Weight Loss: 1.6-2.2g per kg body weight
Maintenance: 1.2-1.6g per kg body weight
Muscle Gain: 1.8-2.4g per kg body weight
```

**Macronutrient Distribution:**
```
Weight Loss: 40% carbs, 30% protein, 30% fat
Maintenance: 45% carbs, 25% protein, 30% fat
Muscle Gain: 50% carbs, 25% protein, 25% fat
```

**Target Weight Range (based on healthy BMI 18.5-24.9):**
```
Min Weight = 18.5 × (height(m))²
Max Weight = 24.9 × (height(m))²
```

#### IngredientMatcherService

```typescript
interface IngredientMatcherService {
  categorizeRecipes(
    recipes: Recipe[],
    availableIngredients: string[]
  ): CategorizedRecipes;
  
  identifyMissingIngredients(
    recipe: Recipe,
    availableIngredients: string[]
  ): string[];
}

interface CategorizedRecipes {
  exactMatches: Recipe[];
  extendedMatches: Recipe[];
}
```

**Matching Logic:**
- Normalize ingredient names (lowercase, trim whitespace)
- Use fuzzy matching for ingredient comparison (e.g., "tomato" matches "tomatoes")
- Exact match: All recipe ingredients are in available ingredients
- Extended match: Some recipe ingredients are missing

#### RecipeRecommendationService

```typescript
interface RecipeRecommendationService {
  recommendRecipes(
    availableIngredients: string[],
    healthProfile?: HealthProfile,
    nutritionTargets?: MacronutrientTargets,
    mealHistory?: MealHistory
  ): Recipe[];
  
  filterByAllergies(recipes: Recipe[], allergies: string[]): Recipe[];
  filterByNutrition(recipes: Recipe[], targets: MacronutrientTargets): Recipe[];
  scoreRecipes(recipes: Recipe[], criteria: ScoringCriteria): Recipe[];
  addRationales(
    recipes: Recipe[],
    healthProfile: HealthProfile,
    mealHistory?: MealHistory,
    nutritionTargets?: MacronutrientTargets
  ): Recipe[];
}

interface ScoringCriteria {
  ingredientMatchWeight: number;
  nutritionMatchWeight: number;
  calorieTolerancePercent: number;
  macroTolerancePercent: number;
}
```

**Recommendation Flow:**
1. Generate or retrieve candidate recipes from OpenAI/database
2. Apply allergy filter (if health profile provided)
3. Categorize by ingredient match (exact vs extended)
4. Apply nutritional filter (if targets provided)
5. Score and rank recipes
6. Generate personalized rationales for each recipe
7. Return top N recipes with rationales

**Scoring Algorithm:**
```
Ingredient Score = (matched_ingredients / total_recipe_ingredients) × 100
Nutrition Score = 100 - avg(
  |recipe_calories - target_calories| / target_calories × 100,
  |recipe_protein - target_protein| / target_protein × 100,
  |recipe_carbs - target_carbs| / target_carbs × 100,
  |recipe_fat - target_fat| / target_fat × 100
)
Final Score = (Ingredient Score × 0.6) + (Nutrition Score × 0.4)
```

#### AllergyFilter

```typescript
interface AllergyFilter {
  filterRecipes(recipes: Recipe[], allergies: string[]): Recipe[];
  containsAllergen(recipe: Recipe, allergen: string): boolean;
}
```

**Filtering Logic:**
- Normalize allergen names (lowercase, trim)
- Check each recipe ingredient against allergen list
- Use substring matching to catch variations (e.g., "milk" catches "whole milk", "skim milk")
- Exclude recipe if any ingredient contains an allergen

#### ImageUploadService

```typescript
interface ImageUploadService {
  validateImage(file: File): ValidationResult;
  uploadImage(file: File): Promise<string>;  // Returns image URL or base64
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}
```

**Validation Rules:**
- Accepted formats: JPEG, PNG, WebP
- Maximum file size: 10MB
- Minimum dimensions: 100x100 pixels (optional)

**Upload Process:**
1. Validate file format and size
2. Generate unique filename
3. Store temporarily or convert to base64
4. Return reference for Vision API call

#### IngredientRecognitionService

```typescript
interface IngredientRecognitionService {
  recognizeIngredients(imageUrl: string): Promise<string[]>;
  extractIngredientNames(visionResponse: any): string[];
}

interface VisionAPIRequest {
  model: string;  // "gpt-4-vision-preview" or similar
  messages: Array<{
    role: string;
    content: Array<{
      type: string;
      text?: string;
      image_url?: { url: string };
    }>;
  }>;
  max_tokens: number;
}
```

**Recognition Process:**
1. Prepare Vision API request with image
2. Send prompt: "List all food ingredients visible in this image. Return only ingredient names, one per line."
3. Parse response to extract ingredient names
4. Normalize ingredient names (lowercase, trim)
5. Remove duplicates
6. Return list of recognized ingredients

**Error Handling:**
- API timeout: Return empty array with error flag
- No ingredients recognized: Return empty array
- Invalid image: Return error message

#### NutritionalRationaleGenerator

```typescript
interface NutritionalRationaleGenerator {
  generateRationale(
    recipe: Recipe,
    healthProfile: HealthProfile,
    mealHistory?: MealHistory,
    nutritionTargets?: MacronutrientTargets
  ): string;
  
  analyzeNutritionalGaps(
    healthProfile: HealthProfile,
    mealHistory?: MealHistory,
    nutritionTargets?: MacronutrientTargets
  ): NutritionalGaps;
}

interface MealHistory {
  recentMeals: Array<{
    date: Date;
    nutrition: NutritionInfo;
  }>;
  averageDailyIntake: NutritionInfo;
}

interface NutritionalGaps {
  proteinDeficit?: number;  // grams below target
  carbDeficit?: number;
  fatDeficit?: number;
  calorieDeficit?: number;
  lowSugarNeeded?: boolean;
  specificNutrients?: string[];  // e.g., ["vitamin C", "iron"]
}
```

**Rationale Generation Logic:**

1. **Analyze Nutritional Gaps:**
   - Compare recent meal history to targets
   - Identify deficits (protein, carbs, fat, calories)
   - Check health goals (weight loss, muscle gain, etc.)
   - Consider dietary restrictions and allergies

2. **Match Recipe to Gaps:**
   - If protein deficit > 20g: Highlight protein content
   - If blood sugar management goal: Highlight low sugar/carbs
   - If specific allergen avoided: Mention allergen-free
   - If weight loss goal: Highlight low calorie density

3. **Generate One-Line Rationale:**
   - Format: "[Primary benefit]. [Secondary benefit if space allows]."
   - Examples:
     - "현재 단백질 섭취량이 부족한 상태입니다. 닭가슴살은 1회 제공량 기준 약 23g 단백질을 제공합니다."
     - "브로콜리는 식이섬유와 비타민 C 보충에 도움됩니다."
     - "당 함량이 낮아 혈당 관리에 적합합니다."

4. **Localization:**
   - Support multiple languages (Korean, English)
   - Use user's preferred language from profile

**Rationale Priority Rules:**
1. Critical deficits (>30% below target) - highest priority
2. Health goals (diabetes, weight loss) - high priority
3. Moderate deficits (10-30% below target) - medium priority
4. General nutritional benefits - low priority

## Data Models

### MongoDB Collections

#### HealthProfiles Collection

```typescript
interface HealthProfileDocument {
  _id: ObjectId;
  userId: string;
  age: number;
  gender: string;
  height: number;  // stored in cm
  weight: number;  // stored in kg
  allergies: string[];
  dietaryGoal: string;
  medicalConditions: string[];
  calculatedMetrics: {
    bmi: number;
    bmr: number;
    tdee: number;
    targetWeightRange: { min: number; max: number };
    macronutrientTargets: MacronutrientTargets;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `userId`: Unique index for fast user lookup
- `updatedAt`: Index for sorting by recency

#### Recipes Collection (Enhanced)

```typescript
interface RecipeDocument {
  _id: ObjectId;
  name: string;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  tags: string[];
  allergens: string[];  // New field for quick allergy filtering
  createdAt: Date;
}
```

**Indexes:**
- `allergens`: Multi-key index for allergy filtering
- `nutrition.calories`: Index for calorie-based queries
- `tags`: Multi-key index for category filtering

#### MealHistory Collection

```typescript
interface MealHistoryDocument {
  _id: ObjectId;
  userId: string;
  meals: Array<{
    date: Date;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    recipeId?: string;
    recipeName: string;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `userId`: Index for user lookup
- `meals.date`: Index for date-based queries
- `updatedAt`: Index for sorting by recency

### API Request/Response Models

#### POST /api/ingredients/recognize

**Request:**
```typescript
interface IngredientRecognitionRequest {
  image: File;  // Multipart form data
}
```

**Response:**
```typescript
interface IngredientRecognitionResponse {
  recognizedIngredients: string[];
  success: boolean;
  error?: string;
}
```

#### POST /api/recipes/recommend

**Request:**
```typescript
interface RecipeRecommendationRequest {
  ingredients: string[];
  userId?: string;  // Optional: to fetch stored health profile
  healthProfile?: HealthProfile;  // Optional: for one-time use
}
```

**Response:**
```typescript
interface RecipeRecommendationResponse {
  exactMatches: Recipe[];  // Each recipe includes rationale field
  extendedMatches: Recipe[];  // Each recipe includes rationale field
  nutritionTargets?: MacronutrientTargets;
  calculatedMetrics?: {
    bmi: number;
    bmr: number;
    tdee: number;
    targetWeightRange: { min: number; max: number };
  };
  nutritionalGaps?: NutritionalGaps;
}
```

#### POST /api/health-profile

**Request:**
```typescript
interface CreateHealthProfileRequest {
  userId: string;
  profile: HealthProfile;
}
```

**Response:**
```typescript
interface CreateHealthProfileResponse {
  profileId: string;
  calculatedMetrics: {
    bmi: number;
    bmr: number;
    tdee: number;
    targetWeightRange: { min: number; max: number };
    macronutrientTargets: MacronutrientTargets;
  };
}
```

#### GET /api/health-profile/:userId

**Response:**
```typescript
interface GetHealthProfileResponse {
  profile: HealthProfileDocument;
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Recipe Ingredient Feasibility

*For any* list of available ingredients and any returned recipe, all ingredients in that recipe should be either in the available ingredients list or explicitly marked as missing ingredients.

**Validates: Requirements 1.1**

### Property 2: Recipe Categorization Correctness

*For any* recipe categorized as an exact match, all recipe ingredients must be in the available ingredients list. *For any* recipe categorized as an extended match, at least one recipe ingredient must not be in the available ingredients list.

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 3: Missing Ingredient Identification

*For any* recipe and available ingredients list, the set of missing ingredients should equal the set difference between recipe ingredients and available ingredients (recipe ingredients - available ingredients).

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: BMI Calculation Accuracy

*For any* valid height (in meters) and weight (in kilograms), the calculated BMI should equal weight / (height²) within a tolerance of 0.01.

**Validates: Requirements 4.1**

### Property 5: Target Weight Range Calculation

*For any* valid height (in meters), the target weight range minimum should equal 18.5 × height² and the maximum should equal 24.9 × height², both within a tolerance of 0.1 kg.

**Validates: Requirements 4.2**

### Property 6: BMR Calculation Accuracy

*For any* valid age, gender, height (cm), and weight (kg), the calculated BMR should match the Mifflin-St Jeor equation result within a tolerance of 1 calorie. For males: BMR = 10×weight + 6.25×height - 5×age + 5. For females: BMR = 10×weight + 6.25×height - 5×age - 161.

**Validates: Requirements 4.3, 4.7**

### Property 7: TDEE Calculation Accuracy

*For any* valid BMR and activity level, the calculated TDEE should equal BMR × activity_factor within a tolerance of 1 calorie, where activity_factor is the standard multiplier for the given activity level.

**Validates: Requirements 4.4**

### Property 8: Protein Target Calculation

*For any* valid weight (kg) and dietary goal, the calculated protein target should fall within the appropriate range: weight_loss (1.6-2.2 g/kg), maintenance (1.2-1.6 g/kg), muscle_gain (1.8-2.4 g/kg).

**Validates: Requirements 4.5**

### Property 9: Macronutrient Distribution Correctness

*For any* calculated macronutrient targets, the sum of (protein_grams × 4) + (carbs_grams × 4) + (fat_grams × 9) should equal the target calories within a tolerance of 10 calories, and the percentage distribution should match the goal-specific ratios within 2%.

**Validates: Requirements 4.6**

### Property 10: Allergy Exclusion Completeness

*For any* list of allergens and any returned recipe, none of the recipe's ingredients should contain any of the specified allergens (using case-insensitive substring matching).

**Validates: Requirements 5.1, 5.3, 6.4**

### Property 11: Alternative Recipe Nutritional Similarity

*For any* excluded recipe due to allergens, if alternative recipes are suggested, each alternative should have calorie content within 20% of the excluded recipe and macronutrient values within 25% of the excluded recipe.

**Validates: Requirements 5.4**

### Property 12: Combined Filter Application

*For any* recipe recommendation request with both available ingredients and health profile, all returned recipes must satisfy both the ingredient matching criteria (exact or extended match) and the allergy exclusion criteria.

**Validates: Requirements 6.1**

### Property 13: Nutritional Target Filtering

*For any* recipe recommendation with nutritional targets, all returned recipes should have calories within 20% of target calories and macronutrients (protein, carbs, fat) within 30% of target values.

**Validates: Requirements 6.2, 6.3**

### Property 14: Recipe Scoring Monotonicity

*For any* two recipes A and B, if recipe A has both a higher ingredient match percentage and a higher nutritional match percentage than recipe B, then recipe A's final score should be higher than recipe B's final score.

**Validates: Requirements 6.5**

### Property 15: Nutritional Information Completeness

*For any* returned recipe, the recipe object must include all required nutritional fields: calories (number > 0), protein (number ≥ 0), carbs (number ≥ 0), and fat (number ≥ 0).

**Validates: Requirements 7.1, 7.2**

### Property 16: Nutrition Comparison Accuracy

*For any* recipe with user targets provided, the nutrition comparison data should correctly calculate the percentage difference between recipe nutrition and target nutrition for each macronutrient and calories.

**Validates: Requirements 7.3**

### Property 17: Health Profile Persistence Round-Trip

*For any* valid health profile, storing the profile to the database and then retrieving it should produce an equivalent profile with all fields matching (excluding auto-generated fields like _id and timestamps).

**Validates: Requirements 8.3**

### Property 18: Image Format Validation

*For any* uploaded file, the system should accept the file if and only if it has a valid image format (JPEG, PNG, WebP) and reject all other formats.

**Validates: Requirements 8.1**

### Property 19: Ingredient Name Extraction from Vision API Response

*For any* valid OpenAI Vision API response containing ingredient names, the extracted ingredient list should contain all ingredient names from the response with proper normalization (lowercase, trimmed).

**Validates: Requirements 8.3**

### Property 20: Ingredient List Manipulation Consistency

*For any* ingredient list, removing an ingredient should result in a list that does not contain that ingredient and has length decreased by 1. Adding an ingredient should result in a list that contains that ingredient and has length increased by 1.

**Validates: Requirements 8.6, 8.7**

### Property 21: Confirmed Ingredients Persistence

*For any* list of confirmed ingredients, saving them and then retrieving them should produce an equivalent list with all ingredients matching.

**Validates: Requirements 8.8**

### Property 22: Image File Size Validation

*For any* uploaded file, the system should accept the file if its size is ≤ 10MB and reject it if its size is > 10MB.

**Validates: Requirements 8.9**

### Property 23: Recipe Rationale Presence

*For any* returned recipe, the recipe object must include a non-empty rationale field (string with length > 0).

**Validates: Requirements 9.1**

### Property 24: Rationale Reflects Health Information Changes

*For any* two health profiles that differ in dietary restrictions, allergies, or health goals, the generated rationales for the same recipe should differ.

**Validates: Requirements 9.2**

### Property 25: Rationale Reflects Nutritional Deficits

*For any* recipe and meal history showing a nutritional deficit (protein, carbs, fat, or calories > 20% below target), if the recipe helps address that deficit, the rationale should mention the relevant nutrient.

**Validates: Requirements 9.3, 9.6, 9.7, 9.8**

### Property 26: Rationale Language Matches User Preference

*For any* user language preference and recipe, the generated rationale should be in the specified language (detectable by language-specific characters or keywords).

**Validates: Requirements 9.9**

### Property 27: Exact Matches Prioritized Over Extended Matches

*For any* recipe recommendation result, all exact match recipes should appear before all extended match recipes in the returned list.

**Validates: Requirements 10.4**


## Error Handling

### Input Validation Errors

**Invalid Health Profile Data:**
- Age ≤ 0 or > 120: Return 400 Bad Request with message "Age must be between 1 and 120"
- Height ≤ 0: Return 400 Bad Request with message "Height must be greater than 0"
- Weight ≤ 0: Return 400 Bad Request with message "Weight must be greater than 0"
- Invalid gender value: Return 400 Bad Request with message "Gender must be 'male', 'female', or 'other'"
- Invalid dietary goal: Return 400 Bad Request with message "Invalid dietary goal"

**Invalid Ingredient Input:**
- Empty ingredient list: Return 400 Bad Request with message "At least one ingredient is required"
- Empty string in ingredient list: Filter out empty strings, continue processing
- Null or undefined ingredients: Return 400 Bad Request with message "Invalid ingredient data"

**Invalid Image Upload:**
- Unsupported file format: Return 400 Bad Request with message "Image format not supported. Please upload JPEG, PNG, or WebP"
- File size exceeds 10MB: Return 400 Bad Request with message "Image file size exceeds 10MB limit"
- Corrupted or invalid image file: Return 400 Bad Request with message "Invalid image file"
- Missing image file: Return 400 Bad Request with message "No image file provided"

**Unit Conversion Errors:**
- Invalid unit values: Return 400 Bad Request with message "Invalid unit specified"
- Conversion overflow: Return 400 Bad Request with message "Value out of acceptable range"

### Calculation Errors

**Nutrition Calculation Failures:**
- If BMI calculation results in NaN or Infinity: Log error, return 500 Internal Server Error
- If BMR calculation results in negative value: Log error, return 500 Internal Server Error
- If TDEE calculation results in unrealistic value (< 800 or > 10000): Log warning, clamp to reasonable range

**Division by Zero:**
- In scoring calculations, if denominator is zero: Use default score of 0 for that component
- In percentage calculations, if target is zero: Skip that comparison metric

### External Service Errors

**OpenAI API Failures:**
- API timeout: Retry up to 3 times with exponential backoff, then return 503 Service Unavailable
- API rate limit: Return 429 Too Many Requests with Retry-After header
- API error response: Log error details, return 502 Bad Gateway with generic message
- No recipes generated: Return empty array with 200 OK status

**Vision API Failures:**
- API timeout: Retry up to 2 times, then return error with empty ingredient list
- API rate limit: Return 429 Too Many Requests with message to try again later
- No ingredients recognized: Return empty array with 200 OK status and message "No ingredients detected. Please try a clearer image or add ingredients manually"
- Vision API error: Log error, return 502 Bad Gateway with message "Image recognition failed. Please add ingredients manually"

**Rationale Generation Failures:**
- Missing health profile: Generate generic rationale based on recipe nutrition only
- Missing meal history: Generate rationale based on health profile without deficit analysis
- Rationale generation error: Use fallback generic rationale: "Balanced nutritional profile"
- Language not supported: Default to English rationale

**MongoDB Connection Errors:**
- Connection timeout: Retry connection, return 503 Service Unavailable if fails
- Write failure: Log error, return 500 Internal Server Error
- Read failure: Log error, return 500 Internal Server Error
- Document not found: Return 404 Not Found for GET requests

### Data Consistency Errors

**Missing Recipe Data:**
- Recipe missing nutrition information: Exclude from results, log warning
- Recipe missing ingredients: Exclude from results, log warning
- Malformed recipe data: Skip recipe, log error with recipe ID

**Allergy Filter Failures:**
- If allergen matching fails: Log error, exclude recipe to err on side of safety
- If allergen list is malformed: Treat as empty list, log warning

### Graceful Degradation

**Partial Feature Availability:**
- If health profile unavailable: Continue with ingredient-only matching
- If OpenAI unavailable: Fall back to database recipe search
- If nutrition calculation fails: Return recipes without nutritional filtering

**Empty Result Sets:**
- No exact matches found: Return empty exactMatches array, populate extendedMatches
- No recipes match criteria: Return empty arrays with 200 OK, include message "No recipes found matching your criteria"
- No alternatives for allergen exclusion: Return empty array, log info

## Testing Strategy

### Overview

This feature requires comprehensive testing using both unit tests and property-based tests. Unit tests validate specific examples, edge cases, and integration points, while property-based tests verify universal correctness properties across randomized inputs.

### Property-Based Testing

**Framework:** Use `fast-check` for JavaScript/TypeScript property-based testing.

**Configuration:**
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `Feature: ingredient-health-recipe-recommendation, Property {number}: {property_text}`

**Property Test Coverage:**

1. **Ingredient Matching Properties (Properties 1-3)**
   - Generate random ingredient lists and recipes
   - Verify categorization correctness
   - Verify missing ingredient identification

2. **Nutrition Calculation Properties (Properties 4-9)**
   - Generate random valid health profiles
   - Verify BMI, BMR, TDEE calculations against formulas
   - Verify protein targets and macro distributions
   - Test with edge cases: very tall/short, very light/heavy

3. **Filtering Properties (Properties 10-13)**
   - Generate random allergen lists and recipes
   - Verify complete allergen exclusion
   - Verify nutritional filtering within tolerance ranges
   - Test combined filter application

4. **Scoring and Ranking Properties (Property 14)**
   - Generate random recipes with varying match qualities
   - Verify monotonicity of scoring function
   - Test edge cases: perfect matches, no matches

5. **Data Completeness Properties (Properties 15-16)**
   - Generate random recipes
   - Verify all required fields present
   - Verify comparison calculations correct

6. **Persistence Properties (Properties 17, 21)**
   - Generate random health profiles and ingredient lists
   - Verify round-trip consistency through database

7. **Image Upload and Recognition Properties (Properties 18-22)**
   - Generate files with various formats and sizes
   - Verify format validation (JPEG, PNG, WebP accepted)
   - Verify size validation (≤10MB accepted)
   - Generate mock Vision API responses
   - Verify ingredient extraction from responses
   - Test ingredient list manipulation (add/remove)
   - Verify confirmed ingredients persistence

8. **Rationale Generation Properties (Properties 23-27)**
   - Generate random recipes and health profiles
   - Verify rationale presence for all recipes
   - Verify rationale changes with health profile changes
   - Generate meal histories with deficits
   - Verify rationale mentions relevant nutrients for deficits
   - Test language preference matching
   - Verify exact matches appear before extended matches

**Generator Strategies:**
- Health profiles: Generate valid ranges (age 18-80, height 150-200cm, weight 40-150kg)
- Ingredients: Use common ingredient names from predefined list
- Recipes: Generate with 3-15 ingredients, realistic nutrition values
- Allergens: Use common allergens (milk, eggs, nuts, soy, wheat, fish, shellfish)
- Image files: Generate mock files with various formats (JPEG, PNG, WebP, PDF, TXT) and sizes (1KB-20MB)
- Vision API responses: Generate mock responses with 0-20 ingredient names
- Meal histories: Generate 1-30 days of meal data with varying nutritional values
- Languages: Test with English and Korean (Korean uses Hangul characters for detection)

### Unit Testing

**Focus Areas:**

1. **API Endpoint Tests**
   - POST /api/recipes/recommend with various input combinations
   - POST /api/health-profile with valid and invalid data
   - GET /api/health-profile/:userId for existing and non-existing users
   - POST /api/ingredients/recognize with valid and invalid images
   - Test authentication and authorization

2. **Service Integration Tests**
   - NutritionCalculator with specific known values
   - IngredientMatcherService with specific recipe/ingredient combinations
   - AllergyFilter with specific allergen scenarios
   - RecipeRecommendationService orchestration
   - ImageUploadService with various file types and sizes
   - IngredientRecognitionService with mock Vision API responses
   - NutritionalRationaleGenerator with specific health profiles and deficits

3. **Edge Case Tests**
   - Empty ingredient lists
   - Single ingredient recipes
   - Recipes with all missing ingredients
   - Health profiles at boundary values (age 1, age 120)
   - Zero-calorie recipes
   - Recipes with missing nutritional data
   - Images at exactly 10MB size limit
   - Empty Vision API responses
   - Meal histories with extreme deficits
   - Unsupported languages for rationale

4. **Error Condition Tests**
   - Invalid input validation
   - Database connection failures
   - OpenAI API failures
   - Vision API failures
   - Malformed data handling
   - Corrupted image files
   - Rationale generation failures

5. **UI Component Tests**
   - IngredientInputForm: Add/remove ingredients, validation
   - HealthProfileForm: Field validation, unit conversion
   - RecipeDisplay: Correct rendering of exact/extended matches, missing ingredients, rationales
   - ImageUploadComponent: File selection, preview, upload, ingredient review/confirmation

**Test Data:**
- Use realistic recipe examples from various cuisines
- Include common dietary restrictions (vegetarian, vegan, gluten-free)
- Test with common allergens and combinations

### Integration Testing

**End-to-End Scenarios:**

1. **Ingredient-Only Flow**
   - User inputs ingredients → receives categorized recipes
   - Verify exact matches use only available ingredients
   - Verify extended matches show missing ingredients

2. **Image Upload Flow**
   - User uploads image → ingredients recognized → user reviews/edits → ingredients confirmed
   - Verify image validation (format, size)
   - Verify Vision API integration
   - Verify ingredient list manipulation
   - Verify confirmed ingredients saved

3. **Health Profile Flow**
   - User creates health profile → calculations performed → profile stored
   - User requests recipes with profile → filtered by nutrition and allergies
   - Verify nutritional targets applied correctly

4. **Combined Flow with Rationale**
   - User with health profile and meal history uploads image
   - Ingredients recognized and confirmed
   - Recipes returned with personalized rationales
   - Verify both ingredient and nutritional filtering applied
   - Verify allergy exclusion works
   - Verify recipes ranked appropriately
   - Verify rationales reflect health profile and deficits

5. **Profile Update Flow**
   - User updates health profile → recalculations performed
   - Verify new targets used in subsequent recommendations
   - Verify rationales change with profile changes

### Performance Testing

**Load Scenarios:**
- 100 concurrent recipe recommendation requests
- Large ingredient lists (50+ ingredients)
- Large recipe databases (10,000+ recipes)
- Complex allergy lists (10+ allergens)

**Performance Targets:**
- Recipe recommendation response time: < 2 seconds for 95th percentile
- Health profile calculation: < 100ms
- Database queries: < 500ms
- OpenAI API calls: < 5 seconds (with timeout)

### Test Coverage Goals

- Line coverage: > 80%
- Branch coverage: > 75%
- Property tests: 100% of identified properties
- Critical paths: 100% coverage (nutrition calculations, allergy filtering)

### Continuous Testing

**Pre-commit:**
- Run unit tests
- Run linting and type checking

**CI/CD Pipeline:**
- Run all unit tests
- Run all property-based tests
- Run integration tests
- Generate coverage reports
- Run performance benchmarks on key operations

**Monitoring:**
- Track property test failure rates
- Monitor calculation accuracy in production
- Alert on unexpected empty result sets
- Track API error rates and response times
