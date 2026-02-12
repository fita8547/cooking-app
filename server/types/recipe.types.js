/**
 * @typedef {Object} NutritionInfo
 * @property {number} calories - Calorie content
 * @property {number} protein - Protein in grams
 * @property {number} carbs - Carbohydrates in grams
 * @property {number} fat - Fat in grams
 * @property {number} [sodium] - Sodium in mg (optional)
 */

/**
 * @typedef {Object} RecipeIngredient
 * @property {string} name - Ingredient name
 * @property {string} [amount] - Amount (optional)
 * @property {string} [unit] - Unit of measurement (optional)
 */

/**
 * @typedef {Object} RecipeStep
 * @property {number} stepNumber - Step number
 * @property {string} instruction - Step instruction
 * @property {number} [duration] - Duration in minutes (optional)
 * @property {string} [imageUrl] - Image URL (optional)
 */

/**
 * @typedef {Object} Recipe
 * @property {string} _id - Recipe ID
 * @property {string} name - Recipe name
 * @property {string} [description] - Recipe description
 * @property {RecipeIngredient[]} ingredients - List of ingredients
 * @property {RecipeStep[]} steps - Cooking steps
 * @property {number} cookingTime - Total cooking time in minutes
 * @property {string} difficulty - Difficulty level
 * @property {number} servings - Number of servings
 * @property {NutritionInfo} nutrition - Nutritional information
 * @property {string} [category] - Recipe category
 * @property {string[]} tags - Recipe tags
 * @property {string[]} allergens - List of allergens for filtering
 * @property {string} [imageUrl] - Recipe image URL
 * @property {string} createdBy - Creator type (ai, user, admin)
 * @property {string} [rationale] - Personalized recommendation rationale
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Update timestamp
 */

/**
 * @typedef {Object} CategorizedRecipes
 * @property {Recipe[]} exactMatches - Recipes using only available ingredients
 * @property {Recipe[]} extendedMatches - Recipes requiring additional ingredients
 */

export {};
