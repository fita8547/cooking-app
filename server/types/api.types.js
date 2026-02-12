/**
 * API Request and Response Types
 */

/**
 * @typedef {Object} IngredientRecognitionRequest
 * @property {string} imageBase64 - Base64 encoded image
 */

/**
 * @typedef {Object} IngredientRecognitionResponse
 * @property {string[]} ingredients - Recognized ingredient names
 * @property {boolean} success - Whether recognition was successful
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {Object} RecipeRecommendationRequest
 * @property {string[]} ingredients - Available ingredients
 * @property {string} [userId] - User ID (optional, to fetch stored health profile)
 * @property {import('./health.types').HealthProfile} [healthProfile] - Health profile (optional, for one-time use)
 */

/**
 * @typedef {Object} RecipeRecommendationResponse
 * @property {import('./recipe.types').Recipe[]} exactMatches - Recipes using only available ingredients
 * @property {import('./recipe.types').Recipe[]} extendedMatches - Recipes requiring additional ingredients
 * @property {import('./health.types').MacronutrientTargets} [nutritionTargets] - Nutritional targets
 * @property {import('./health.types').CalculatedMetrics} [calculatedMetrics] - Calculated health metrics
 * @property {import('./health.types').NutritionalGaps} [nutritionalGaps] - Identified nutritional gaps
 */

/**
 * @typedef {Object} CreateHealthProfileRequest
 * @property {string} userId - User ID
 * @property {import('./health.types').HealthProfile} profile - Health profile data
 */

/**
 * @typedef {Object} CreateHealthProfileResponse
 * @property {string} profileId - Created profile ID
 * @property {import('./health.types').CalculatedMetrics} calculatedMetrics - Calculated health metrics
 */

/**
 * @typedef {Object} GetHealthProfileResponse
 * @property {import('./health.types').HealthProfile} profile - Health profile
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {string} [error] - Error message if validation failed
 */

/**
 * @typedef {Object} ScoringCriteria
 * @property {number} ingredientMatchWeight - Weight for ingredient matching (0-1)
 * @property {number} nutritionMatchWeight - Weight for nutrition matching (0-1)
 * @property {number} calorieTolerancePercent - Tolerance for calorie matching (percentage)
 * @property {number} macroTolerancePercent - Tolerance for macro matching (percentage)
 */

export {};
