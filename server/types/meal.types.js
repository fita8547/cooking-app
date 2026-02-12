/**
 * @typedef {Object} MealNutrition
 * @property {number} calories - Calorie content
 * @property {number} protein - Protein in grams
 * @property {number} carbs - Carbohydrates in grams
 * @property {number} fat - Fat in grams
 */

/**
 * @typedef {Object} Meal
 * @property {string} _id - Meal ID
 * @property {string} userId - User ID
 * @property {string} [recipeId] - Recipe ID (optional)
 * @property {string} recipeName - Recipe name
 * @property {Date} date - Meal date
 * @property {string} mealType - Meal type (아침, 점심, 저녁, 간식)
 * @property {number} [rating] - User rating (1-5)
 * @property {string} [notes] - User notes
 * @property {MealNutrition} nutrition - Nutritional information
 * @property {string} [imageUrl] - Meal image URL
 * @property {string} [preferenceId] - Preference ID
 * @property {boolean} wasRecommended - Whether this was a recommended recipe
 * @property {number} [recommendationScore] - Recommendation score
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Update timestamp
 */

/**
 * @typedef {Object} MealHistoryEntry
 * @property {Date} date - Meal date
 * @property {string} mealType - Meal type
 * @property {string} [recipeId] - Recipe ID
 * @property {string} recipeName - Recipe name
 * @property {MealNutrition} nutrition - Nutritional information
 */

/**
 * @typedef {Object} MealHistory
 * @property {MealHistoryEntry[]} recentMeals - Recent meals
 * @property {MealNutrition} averageDailyIntake - Average daily nutritional intake
 */

export {};
