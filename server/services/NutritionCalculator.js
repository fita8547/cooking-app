/**
 * NutritionCalculator Service
 * 
 * Calculates nutritional metrics based on user health information:
 * - BMI (Body Mass Index)
 * - BMR (Basal Metabolic Rate) using Mifflin-St Jeor equation
 * - TDEE (Total Daily Energy Expenditure)
 * - Protein targets based on dietary goals
 * - Macronutrient distribution
 * - Target weight range based on healthy BMI
 */

import '../types/index.js';

class NutritionCalculator {
  /**
   * Calculate Body Mass Index (BMI)
   * Formula: BMI = weight(kg) / (height(m))²
   * 
   * @param {number} height - Height in centimeters
   * @param {number} weight - Weight in kilograms
   * @returns {number} BMI value
   * @throws {Error} If height or weight is invalid
   */
  calculateBMI(height, weight) {
    // Input validation
    if (!height || height <= 0) {
      throw new Error('Height must be greater than 0');
    }
    if (!weight || weight <= 0) {
      throw new Error('Weight must be greater than 0');
    }

    // Convert height from cm to meters
    const heightInMeters = height / 100;
    
    // Calculate BMI
    const bmi = weight / (heightInMeters * heightInMeters);
    
    // Round to 1 decimal place
    return Math.round(bmi * 10) / 10;
  }

  /**
   * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
   * Male: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5
   * Female: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) - 161
   * 
   * @param {number} age - Age in years
   * @param {string} gender - Gender ('male', 'female', 'other')
   * @param {number} height - Height in centimeters
   * @param {number} weight - Weight in kilograms
   * @returns {number} BMR in calories per day
   * @throws {Error} If any parameter is invalid
   */
  calculateBMR(age, gender, height, weight) {
    // Input validation
    if (!age || age <= 0 || age > 120) {
      throw new Error('Age must be between 1 and 120');
    }
    if (!gender || !['male', 'female', 'other'].includes(gender)) {
      throw new Error("Gender must be 'male', 'female', or 'other'");
    }
    if (!height || height <= 0) {
      throw new Error('Height must be greater than 0');
    }
    if (!weight || weight <= 0) {
      throw new Error('Weight must be greater than 0');
    }

    // Mifflin-St Jeor Equation
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    
    // Gender-specific adjustment
    if (gender === 'male') {
      bmr += 5;
    } else if (gender === 'female') {
      bmr -= 161;
    } else {
      // For 'other', use average of male and female
      bmr -= 78; // Average of +5 and -161
    }
    
    // Round to nearest integer
    return Math.round(bmr);
  }

  /**
   * Calculate Total Daily Energy Expenditure (TDEE)
   * Formula: TDEE = BMR × Activity Factor
   * 
   * Activity Factors:
   * - sedentary: 1.2 (little/no exercise)
   * - lightly_active: 1.375 (1-3 days/week)
   * - moderately_active: 1.55 (3-5 days/week)
   * - very_active: 1.725 (6-7 days/week)
   * - extremely_active: 1.9 (physical job + exercise)
   * 
   * @param {number} bmr - Basal Metabolic Rate
   * @param {string} activityLevel - Activity level
   * @returns {number} TDEE in calories per day
   * @throws {Error} If BMR is invalid or activity level is unknown
   */
  calculateTDEE(bmr, activityLevel = 'sedentary') {
    // Input validation
    if (!bmr || bmr < 800 || bmr > 10000) {
      throw new Error('BMR must be between 800 and 10000');
    }

    // Activity factors
    const activityFactors = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extremely_active: 1.9
    };

    const factor = activityFactors[activityLevel];
    if (!factor) {
      throw new Error(`Unknown activity level: ${activityLevel}. Must be one of: ${Object.keys(activityFactors).join(', ')}`);
    }

    // Calculate TDEE
    const tdee = bmr * factor;
    
    // Round to nearest integer
    return Math.round(tdee);
  }

  /**
   * Calculate daily protein target based on weight and dietary goal
   * 
   * Protein targets (grams per kg body weight):
   * - weight_loss: 1.6-2.2 g/kg (use 1.9 g/kg)
   * - maintenance: 1.2-1.6 g/kg (use 1.4 g/kg)
   * - muscle_gain: 1.8-2.4 g/kg (use 2.1 g/kg)
   * - weight_gain: 1.4-1.8 g/kg (use 1.6 g/kg)
   * 
   * @param {number} weight - Weight in kilograms
   * @param {string} goal - Dietary goal
   * @returns {number} Daily protein target in grams
   * @throws {Error} If weight is invalid or goal is unknown
   */
  calculateProteinTarget(weight, goal = 'maintenance') {
    // Input validation
    if (!weight || weight <= 0) {
      throw new Error('Weight must be greater than 0');
    }

    // Protein multipliers (g/kg)
    const proteinMultipliers = {
      weight_loss: 1.9,
      maintenance: 1.4,
      muscle_gain: 2.1,
      weight_gain: 1.6
    };

    const multiplier = proteinMultipliers[goal];
    if (!multiplier) {
      throw new Error(`Unknown dietary goal: ${goal}. Must be one of: ${Object.keys(proteinMultipliers).join(', ')}`);
    }

    // Calculate protein target
    const proteinTarget = weight * multiplier;
    
    // Round to nearest integer
    return Math.round(proteinTarget);
  }

  /**
   * Calculate macronutrient distribution based on TDEE, protein target, and dietary goal
   * 
   * Macronutrient distributions:
   * - weight_loss: 40% carbs, 30% protein, 30% fat
   * - maintenance: 45% carbs, 25% protein, 30% fat
   * - muscle_gain: 50% carbs, 25% protein, 25% fat
   * - weight_gain: 50% carbs, 25% protein, 25% fat
   * 
   * Calorie conversions:
   * - Protein: 4 calories per gram
   * - Carbs: 4 calories per gram
   * - Fat: 9 calories per gram
   * 
   * @param {number} tdee - Total Daily Energy Expenditure
   * @param {number} proteinTarget - Daily protein target in grams
   * @param {string} goal - Dietary goal
   * @returns {import('../types').MacronutrientTargets} Macronutrient targets
   * @throws {Error} If TDEE or protein target is invalid
   */
  calculateMacronutrients(tdee, proteinTarget, goal = 'maintenance') {
    // Input validation
    if (!tdee || tdee < 800 || tdee > 10000) {
      throw new Error('TDEE must be between 800 and 10000');
    }
    if (!proteinTarget || proteinTarget <= 0) {
      throw new Error('Protein target must be greater than 0');
    }

    // Macronutrient percentage distributions
    const distributions = {
      weight_loss: { carbs: 0.40, protein: 0.30, fat: 0.30 },
      maintenance: { carbs: 0.45, protein: 0.25, fat: 0.30 },
      muscle_gain: { carbs: 0.50, protein: 0.25, fat: 0.25 },
      weight_gain: { carbs: 0.50, protein: 0.25, fat: 0.25 }
    };

    const distribution = distributions[goal];
    if (!distribution) {
      throw new Error(`Unknown dietary goal: ${goal}. Must be one of: ${Object.keys(distributions).join(', ')}`);
    }

    // Adjust TDEE based on goal
    let targetCalories = tdee;
    if (goal === 'weight_loss') {
      targetCalories = tdee - 500; // 500 calorie deficit
    } else if (goal === 'weight_gain' || goal === 'muscle_gain') {
      targetCalories = tdee + 300; // 300 calorie surplus
    }

    // Calculate macronutrients in grams
    // Use the provided protein target
    const protein = proteinTarget;
    
    // Calculate remaining calories after protein
    const proteinCalories = protein * 4;
    const remainingCalories = targetCalories - proteinCalories;
    
    // Distribute remaining calories between carbs and fat
    const carbPercentage = distribution.carbs / (distribution.carbs + distribution.fat);
    const fatPercentage = distribution.fat / (distribution.carbs + distribution.fat);
    
    const carbs = Math.round((remainingCalories * carbPercentage) / 4);
    const fat = Math.round((remainingCalories * fatPercentage) / 9);

    return {
      calories: Math.round(targetCalories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat)
    };
  }

  /**
   * Determine target weight range based on healthy BMI (18.5-24.9)
   * 
   * Formula:
   * - Min Weight = 18.5 × (height(m))²
   * - Max Weight = 24.9 × (height(m))²
   * 
   * @param {number} height - Height in centimeters
   * @param {string} gender - Gender (not used in calculation, but kept for API consistency)
   * @returns {{min: number, max: number}} Target weight range in kg
   * @throws {Error} If height is invalid
   */
  determineTargetWeightRange(height, gender = 'other') {
    // Input validation
    if (!height || height <= 0) {
      throw new Error('Height must be greater than 0');
    }

    // Convert height from cm to meters
    const heightInMeters = height / 100;
    
    // Calculate weight range based on healthy BMI (18.5-24.9)
    const minWeight = 18.5 * (heightInMeters * heightInMeters);
    const maxWeight = 24.9 * (heightInMeters * heightInMeters);
    
    return {
      min: Math.round(minWeight * 10) / 10,
      max: Math.round(maxWeight * 10) / 10
    };
  }

  /**
   * Calculate all metrics at once for a health profile
   * 
   * @param {Object} profile - Health profile
   * @param {number} profile.age - Age in years
   * @param {string} profile.gender - Gender
   * @param {number} profile.height - Height in cm
   * @param {number} profile.weight - Weight in kg
   * @param {string} [profile.dietaryGoal='maintenance'] - Dietary goal
   * @param {string} [profile.activityLevel='sedentary'] - Activity level
   * @returns {import('../types').CalculatedMetrics} All calculated metrics
   */
  calculateAllMetrics(profile) {
    const { age, gender, height, weight, dietaryGoal = 'maintenance', activityLevel = 'sedentary' } = profile;

    // Calculate all metrics
    const bmi = this.calculateBMI(height, weight);
    const bmr = this.calculateBMR(age, gender, height, weight);
    const tdee = this.calculateTDEE(bmr, activityLevel);
    const proteinTarget = this.calculateProteinTarget(weight, dietaryGoal);
    const macronutrientTargets = this.calculateMacronutrients(tdee, proteinTarget, dietaryGoal);
    const targetWeightRange = this.determineTargetWeightRange(height, gender);

    return {
      bmi,
      bmr,
      tdee,
      targetWeightRange,
      macronutrientTargets
    };
  }
}

// Export singleton instance
export default new NutritionCalculator();
