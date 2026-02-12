/**
 * @typedef {Object} MacronutrientTargets
 * @property {number} calories - Target daily calories
 * @property {number} protein - Target daily protein in grams
 * @property {number} carbs - Target daily carbohydrates in grams
 * @property {number} fat - Target daily fat in grams
 */

/**
 * @typedef {Object} TargetWeightRange
 * @property {number} min - Minimum healthy weight in kg
 * @property {number} max - Maximum healthy weight in kg
 */

/**
 * @typedef {Object} CalculatedMetrics
 * @property {number} bmi - Body Mass Index
 * @property {number} bmr - Basal Metabolic Rate
 * @property {number} tdee - Total Daily Energy Expenditure
 * @property {TargetWeightRange} targetWeightRange - Healthy weight range
 * @property {MacronutrientTargets} macronutrientTargets - Daily macro targets
 */

/**
 * @typedef {Object} DietaryRestriction
 * @property {string} id - Restriction ID
 * @property {string} name - Restriction name (English)
 * @property {string} nameKo - Restriction name (Korean)
 */

/**
 * @typedef {Object} Allergy
 * @property {string} id - Allergy ID
 * @property {string} name - Allergen name (English)
 * @property {string} nameKo - Allergen name (Korean)
 * @property {string} severity - Severity level (Mild, Moderate, Severe)
 */

/**
 * @typedef {Object} HealthGoal
 * @property {string} id - Goal ID
 * @property {string} name - Goal name (English)
 * @property {string} nameKo - Goal name (Korean)
 */

/**
 * @typedef {Object} HealthProfile
 * @property {string} userId - User ID
 * @property {number} [age] - Age in years
 * @property {string} [gender] - Gender (male, female, other)
 * @property {number} [height] - Height in cm
 * @property {number} [weight] - Weight in kg
 * @property {DietaryRestriction[]} dietaryRestrictions - Dietary restrictions
 * @property {Allergy[]} allergies - Food allergies
 * @property {HealthGoal[]} healthGoals - Health goals
 * @property {string} [dietaryGoal] - Dietary goal (weight_loss, weight_gain, maintenance, muscle_gain)
 * @property {string[]} [medicalConditions] - Medical conditions
 * @property {CalculatedMetrics} [calculatedMetrics] - Calculated health metrics
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Update timestamp
 */

/**
 * @typedef {Object} NutritionalGaps
 * @property {number} [proteinDeficit] - Protein deficit in grams
 * @property {number} [carbDeficit] - Carbohydrate deficit in grams
 * @property {number} [fatDeficit] - Fat deficit in grams
 * @property {number} [calorieDeficit] - Calorie deficit
 * @property {boolean} [lowSugarNeeded] - Whether low sugar is needed
 * @property {string[]} [specificNutrients] - Specific nutrients needed (e.g., vitamin C, iron)
 */

export {};
