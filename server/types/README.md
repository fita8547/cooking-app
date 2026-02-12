# Type Definitions

This directory contains JSDoc type definitions for the Ingredient-Health Recipe Recommendation feature.

## Overview

Since this is a JavaScript project, we use JSDoc comments to provide type information. These types can be used by:
- IDEs for autocomplete and type checking
- JSDoc documentation generators
- TypeScript projects that consume this API

## Type Files

### `recipe.types.js`
Defines types related to recipes:
- `Recipe`: Complete recipe object with ingredients, steps, nutrition, and rationale
- `NutritionInfo`: Nutritional information (calories, protein, carbs, fat)
- `RecipeIngredient`: Individual ingredient with amount and unit
- `RecipeStep`: Cooking step with instruction and duration
- `CategorizedRecipes`: Recipes grouped by match type (exact/extended)

### `health.types.js`
Defines types related to health profiles:
- `HealthProfile`: User health information and preferences
- `MacronutrientTargets`: Daily targets for calories, protein, carbs, fat
- `CalculatedMetrics`: BMI, BMR, TDEE, and target weight range
- `NutritionalGaps`: Identified nutritional deficits
- `DietaryRestriction`, `Allergy`, `HealthGoal`: Health preference objects

### `meal.types.js`
Defines types related to meal history:
- `Meal`: Individual meal record
- `MealHistory`: Collection of recent meals with average intake
- `MealNutrition`: Nutritional information for a meal

### `api.types.js`
Defines API request and response types:
- `RecipeRecommendationRequest/Response`
- `IngredientRecognitionRequest/Response`
- `CreateHealthProfileRequest/Response`
- `ValidationResult`, `ScoringCriteria`

## Usage

### In JavaScript Files

```javascript
/**
 * Get recipe recommendations
 * @param {import('../types').RecipeRecommendationRequest} request
 * @returns {Promise<import('../types').RecipeRecommendationResponse>}
 */
async function getRecommendations(request) {
  // Implementation
}
```

### In Service Classes

```javascript
import '../types/index.js';

class RecipeRecommendationService {
  /**
   * @param {string[]} ingredients
   * @param {import('../types').HealthProfile} [healthProfile]
   * @returns {Promise<import('../types').Recipe[]>}
   */
  async recommendRecipes(ingredients, healthProfile) {
    // Implementation
  }
}
```

### Type Checking

To enable type checking in your IDE:
1. VS Code: Install the JavaScript and TypeScript extension
2. Add `// @ts-check` at the top of files for stricter checking
3. Configure `jsconfig.json` for project-wide settings

## Database Migration

To add indexes to existing collections, run:

```bash
node server/scripts/migrate-indexes.js
```

This will create indexes on:
- `recipes.allergens` - For allergy filtering
- `recipes.nutrition.calories` - For calorie-based queries
- `recipes.tags` - For category filtering
- `healthinformations.userId` - Unique index for user lookup
- `healthinformations.updatedAt` - For sorting by recency
- `meals.userId + meals.date` - Compound index for user meal history
- `meals.updatedAt` - For sorting by recency

## Best Practices

1. **Always use JSDoc comments** for function parameters and return types
2. **Import types explicitly** using `import('../types').TypeName`
3. **Keep types in sync** with MongoDB schemas
4. **Document optional fields** with `[fieldName]` in JSDoc
5. **Use union types** for enums: `@property {'male'|'female'|'other'} gender`
