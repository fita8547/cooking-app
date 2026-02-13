/**
 * RecipeRecommendationService
 * 
 * Orchestrates recipe recommendations by integrating:
 * - OpenAI GPT-4 for recipe generation
 * - Ingredient matching
 * - Allergy filtering
 * - Nutritional filtering
 * - Recipe scoring and ranking
 * - Nutritional rationale generation
 */

import '../types/index.js';
import IngredientMatcherService from './IngredientMatcherService.js';
import AllergyFilter from './AllergyFilter.js';
import NutritionCalculator from './NutritionCalculator.js';
import Recipe from '../models/Recipe.js';
import Meal from '../models/Meal.js';
import OpenAI from 'openai';

class RecipeRecommendationService {
  constructor() {
    this._defaultScoringCriteria = {
      ingredientMatchWeight: 0.6,
      nutritionMatchWeight: 0.4,
      calorieTolerancePercent: 0.20,
      macroTolerancePercent: 0.30
    };
  }

  /**
   * OpenAI 클라이언트 초기화 (지연 초기화)
   * @private
   */
  _getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      return null;
    }
    
    return new OpenAI({ apiKey });
  }

  /**
   * OpenAI를 사용하여 레시피 생성
   * @private
   */
  async _generateRecipesWithAI(availableIngredients, healthProfile, nutritionTargets) {
    const openai = this._getOpenAIClient();
    
    if (!openai) {
      console.log('⚠️  OpenAI API 키 없음 - DB 레시피 사용');
      return null;
    }

    try {
      console.log('✅ OpenAI로 레시피 생성 중...');
      
      const prompt = this._buildRecipePrompt(availableIngredients, healthProfile, nutritionTargets);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "당신은 전문 셰프이자 영양사입니다. 사용자의 재료와 건강 정보를 바탕으로 맛있고 건강한 레시피를 추천합니다. 항상 JSON 형식으로 응답하세요."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      const result = JSON.parse(content);
      
      return result.recipes || [];
    } catch (error) {
      console.error('OpenAI 레시피 생성 오류:', error);
      return null;
    }
  }

  /**
   * 레시피 생성 프롬프트 구성
   * @private
   */
  _buildRecipePrompt(ingredients, healthProfile, nutritionTargets) {
    let prompt = `다음 재료를 사용하여 레시피를 추천해주세요.

사용 가능한 재료: ${ingredients.join(', ')}

`;

    // 건강 프로필 정보 추가
    if (healthProfile) {
      prompt += `사용자 건강 정보:\n`;
      
      if (healthProfile.age) {
        prompt += `- 나이: ${healthProfile.age}세\n`;
      }
      
      if (healthProfile.gender) {
        const genderText = healthProfile.gender === 'male' ? '남성' : healthProfile.gender === 'female' ? '여성' : '기타';
        prompt += `- 성별: ${genderText}\n`;
      }
      
      if (healthProfile.allergies && healthProfile.allergies.length > 0) {
        const allergyNames = healthProfile.allergies.map(a => 
          typeof a === 'string' ? a : a.name
        ).filter(Boolean);
        if (allergyNames.length > 0) {
          prompt += `- 알레르기: ${allergyNames.join(', ')} (이 재료들은 절대 사용하지 마세요)\n`;
        }
      }
      
      if (healthProfile.dietaryGoal) {
        const goalText = {
          'weight_loss': '체중 감량',
          'weight_gain': '체중 증가',
          'muscle_gain': '근육 증가',
          'health_maintenance': '건강 유지'
        };
        prompt += `- 식단 목표: ${goalText[healthProfile.dietaryGoal] || healthProfile.dietaryGoal}\n`;
      }

      if (healthProfile.preferences && healthProfile.preferences.length > 0) {
        prompt += `- 선호 식단: ${healthProfile.preferences.join(', ')}\n`;
      }
    }

    // 영양 목표 추가
    if (nutritionTargets) {
      prompt += `\n목표 영양 정보 (1끼 기준):\n`;
      prompt += `- 칼로리: ${Math.round(nutritionTargets.calories)}kcal\n`;
      prompt += `- 단백질: ${Math.round(nutritionTargets.protein)}g\n`;
      prompt += `- 탄수화물: ${Math.round(nutritionTargets.carbs)}g\n`;
      prompt += `- 지방: ${Math.round(nutritionTargets.fat)}g\n`;
    }

    prompt += `
다음 JSON 형식으로 5개의 레시피를 반환해주세요:
{
  "recipes": [
    {
      "name": "레시피 이름",
      "description": "간단한 설명 (한 줄)",
      "cuisine": "한식|양식|중식|일식|기타",
      "ingredients": [
        {
          "name": "재료명",
          "amount": "양",
          "unit": "단위",
          "isAvailable": true/false (사용 가능한 재료 목록에 있으면 true)
        }
      ],
      "steps": [
        {
          "stepNumber": 1,
          "instruction": "조리 단계 설명",
          "duration": 예상시간(분)
        }
      ],
      "nutrition": {
        "calories": 숫자,
        "protein": 숫자,
        "carbs": 숫자,
        "fat": 숫자
      },
      "difficulty": "쉬움|보통|어려움",
      "cookingTime": 총조리시간(분),
      "servings": 인분수,
      "image": "🍲" (적절한 이모지),
      "rationale": "이 레시피를 추천하는 이유 (건강 목표와 연관)"
    }
  ]
}

레시피는 실용적이고 맛있으며, 사용자의 건강 목표와 영양 목표에 맞춰주세요.
가능한 한 사용 가능한 재료를 많이 활용하되, 필요시 추가 재료(최대 3개)를 포함할 수 있습니다.`;

    return prompt;
  }

  /**
   * Filter recipes by nutritional targets
   * 
   * @param {import('../types').Recipe[]} recipes - List of recipes
   * @param {import('../types').MacronutrientTargets} targets - Nutritional targets
   * @returns {import('../types').Recipe[]} Filtered recipes
   */
  filterByNutrition(recipes, targets) {
    if (!recipes || recipes.length === 0) {
      return [];
    }

    if (!targets) {
      return recipes;
    }

    const { calories, protein, carbs, fat } = targets;
    const { calorieTolerancePercent, macroTolerancePercent } = this._defaultScoringCriteria;

    return recipes.filter(recipe => {
      if (!recipe.nutrition) {
        return false;
      }

      const recipeNutrition = recipe.nutrition;

      // Check calorie tolerance
      const calorieDiff = Math.abs(recipeNutrition.calories - calories) / calories;
      if (calorieDiff > calorieTolerancePercent) {
        return false;
      }

      // Check macro tolerances
      const proteinDiff = Math.abs(recipeNutrition.protein - protein) / (protein || 1);
      const carbsDiff = Math.abs(recipeNutrition.carbs - carbs) / (carbs || 1);
      const fatDiff = Math.abs(recipeNutrition.fat - fat) / (fat || 1);

      if (proteinDiff > macroTolerancePercent || 
          carbsDiff > macroTolerancePercent || 
          fatDiff > macroTolerancePercent) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calculate nutrition match score for a recipe
   * 
   * @param {import('../types').Recipe} recipe - Recipe object
   * @param {import('../types').MacronutrientTargets} targets - Nutritional targets
   * @returns {number} Nutrition match score (0-100)
   * @private
   */
  _calculateNutritionScore(recipe, targets) {
    if (!recipe.nutrition || !targets) {
      return 0;
    }

    const recipeNutrition = recipe.nutrition;

    // Calculate percentage differences
    const calorieDiff = Math.abs(recipeNutrition.calories - targets.calories) / targets.calories;
    const proteinDiff = Math.abs(recipeNutrition.protein - targets.protein) / (targets.protein || 1);
    const carbsDiff = Math.abs(recipeNutrition.carbs - targets.carbs) / (targets.carbs || 1);
    const fatDiff = Math.abs(recipeNutrition.fat - targets.fat) / (targets.fat || 1);

    // Average difference (0 = perfect match, 1 = 100% off)
    const avgDiff = (calorieDiff + proteinDiff + carbsDiff + fatDiff) / 4;

    // Convert to score (100 = perfect match, 0 = completely off)
    const score = Math.max(0, 100 - (avgDiff * 100));

    return Math.round(score);
  }

  /**
   * Score and rank recipes based on ingredient match and nutrition match
   * 
   * Scoring formula:
   * Final Score = (Ingredient Score × 0.6) + (Nutrition Score × 0.4)
   * 
   * @param {import('../types').Recipe[]} recipes - List of recipes
   * @param {string[]} availableIngredients - User's available ingredients
   * @param {import('../types').MacronutrientTargets} [nutritionTargets] - Nutritional targets
   * @param {import('../types').ScoringCriteria} [criteria] - Custom scoring criteria
   * @returns {import('../types').Recipe[]} Scored and sorted recipes
   */
  scoreRecipes(recipes, availableIngredients, nutritionTargets = null, criteria = null) {
    if (!recipes || recipes.length === 0) {
      return [];
    }

    const scoringCriteria = criteria || this._defaultScoringCriteria;
    const scoredRecipes = [];

    for (const recipe of recipes) {
      // Calculate ingredient match score
      const ingredientScore = IngredientMatcherService.calculateMatchPercentage(
        recipe,
        availableIngredients
      );

      // Calculate nutrition match score
      let nutritionScore = 0;
      if (nutritionTargets) {
        nutritionScore = this._calculateNutritionScore(recipe, nutritionTargets);
      }

      // Calculate final score
      const finalScore = nutritionTargets
        ? (ingredientScore * scoringCriteria.ingredientMatchWeight) + 
          (nutritionScore * scoringCriteria.nutritionMatchWeight)
        : ingredientScore;

      scoredRecipes.push({
        ...recipe,
        scores: {
          ingredient: ingredientScore,
          nutrition: nutritionScore,
          final: Math.round(finalScore)
        }
      });
    }

    // Sort by final score (highest first)
    scoredRecipes.sort((a, b) => b.scores.final - a.scores.final);

    return scoredRecipes;
  }

  /**
   * Analyze nutritional gaps based on meal history and targets
   * 
   * @param {import('../types').MealHistory} [mealHistory] - User's meal history
   * @param {import('../types').MacronutrientTargets} [nutritionTargets] - Nutritional targets
   * @returns {import('../types').NutritionalGaps} Identified nutritional gaps
   * @private
   */
  async _analyzeNutritionalGaps(userId, nutritionTargets) {
    const gaps = {};

    if (!nutritionTargets) {
      return gaps;
    }

    try {
      // Get recent meals (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentMeals = await Meal.find({
        userId,
        date: { $gte: sevenDaysAgo }
      }).sort({ date: -1 });

      if (recentMeals.length === 0) {
        // No meal history, assume all nutrients needed
        gaps.proteinDeficit = nutritionTargets.protein * 0.3;
        gaps.carbDeficit = nutritionTargets.carbs * 0.3;
        gaps.fatDeficit = nutritionTargets.fat * 0.3;
        gaps.calorieDeficit = nutritionTargets.calories * 0.3;
        return gaps;
      }

      // Calculate average daily intake
      const totalNutrition = recentMeals.reduce((acc, meal) => {
        if (meal.nutrition) {
          acc.calories += meal.nutrition.calories || 0;
          acc.protein += meal.nutrition.protein || 0;
          acc.carbs += meal.nutrition.carbs || 0;
          acc.fat += meal.nutrition.fat || 0;
        }
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

      const daysCount = Math.max(1, recentMeals.length / 3); // Assume 3 meals per day
      const avgDailyIntake = {
        calories: totalNutrition.calories / daysCount,
        protein: totalNutrition.protein / daysCount,
        carbs: totalNutrition.carbs / daysCount,
        fat: totalNutrition.fat / daysCount
      };

      // Calculate deficits (if intake is below target)
      if (avgDailyIntake.protein < nutritionTargets.protein * 0.8) {
        gaps.proteinDeficit = nutritionTargets.protein - avgDailyIntake.protein;
      }

      if (avgDailyIntake.carbs < nutritionTargets.carbs * 0.8) {
        gaps.carbDeficit = nutritionTargets.carbs - avgDailyIntake.carbs;
      }

      if (avgDailyIntake.fat < nutritionTargets.fat * 0.8) {
        gaps.fatDeficit = nutritionTargets.fat - avgDailyIntake.fat;
      }

      if (avgDailyIntake.calories < nutritionTargets.calories * 0.8) {
        gaps.calorieDeficit = nutritionTargets.calories - avgDailyIntake.calories;
      }

    } catch (error) {
      console.error('Error analyzing nutritional gaps:', error);
    }

    return gaps;
  }

  /**
   * Generate personalized rationale for a recipe recommendation
   * 
   * @param {import('../types').Recipe} recipe - Recipe object
   * @param {import('../types').HealthProfile} [healthProfile] - User's health profile
   * @param {import('../types').NutritionalGaps} [nutritionalGaps] - Identified nutritional gaps
   * @returns {string} Personalized rationale
   * @private
   */
  _generateRationale(recipe, healthProfile, nutritionalGaps) {
    if (!recipe || !recipe.nutrition) {
      return '균형 잡힌 영양 구성';
    }

    const rationales = [];
    const nutrition = recipe.nutrition;

    // Check for protein deficit
    if (nutritionalGaps && nutritionalGaps.proteinDeficit && nutritionalGaps.proteinDeficit > 20) {
      if (nutrition.protein > 20) {
        rationales.push(`단백질 보충 (${nutrition.protein}g)`);
      }
    }

    // Check for dietary goals
    if (healthProfile && healthProfile.dietaryGoal) {
      if (healthProfile.dietaryGoal === 'weight_loss' && nutrition.calories < 400) {
        rationales.push('저칼로리');
      }
      if (healthProfile.dietaryGoal === 'muscle_gain' && nutrition.protein > 25) {
        rationales.push('고단백');
      }
    }

    // Check for health goals
    if (healthProfile && healthProfile.healthGoals) {
      const hasBloodSugarGoal = healthProfile.healthGoals.some(goal => 
        goal.name && goal.name.toLowerCase().includes('blood sugar')
      );
      if (hasBloodSugarGoal && nutrition.carbs < 30) {
        rationales.push('저당');
      }
    }

    // Default rationales based on nutrition
    if (rationales.length === 0) {
      if (nutrition.protein > 20) {
        rationales.push('고단백');
      }
      if (nutrition.calories < 400) {
        rationales.push('저칼로리');
      }
      if (nutrition.fat < 15) {
        rationales.push('저지방');
      }
    }

    // If still no rationales, use generic
    if (rationales.length === 0) {
      return '균형 잡힌 영양 구성';
    }

    return rationales.join(' + ');
  }

  /**
   * Add personalized rationales to recipes
   * 
   * @param {import('../types').Recipe[]} recipes - List of recipes
   * @param {import('../types').HealthProfile} [healthProfile] - User's health profile
   * @param {string} [userId] - User ID for meal history lookup
   * @param {import('../types').MacronutrientTargets} [nutritionTargets] - Nutritional targets
   * @returns {Promise<import('../types').Recipe[]>} Recipes with rationales
   */
  async addRationales(recipes, healthProfile, userId, nutritionTargets) {
    if (!recipes || recipes.length === 0) {
      return [];
    }

    // Analyze nutritional gaps if user ID provided
    let nutritionalGaps = {};
    if (userId && nutritionTargets) {
      nutritionalGaps = await this._analyzeNutritionalGaps(userId, nutritionTargets);
    }

    // Add rationale to each recipe
    return recipes.map(recipe => ({
      ...recipe,
      rationale: this._generateRationale(recipe, healthProfile, nutritionalGaps)
    }));
  }

  /**
   * Main recommendation method - orchestrates all filtering and scoring
   * 
   * @param {string[]} availableIngredients - User's available ingredients
   * @param {import('../types').HealthProfile} [healthProfile] - User's health profile
   * @param {import('../types').MacronutrientTargets} [nutritionTargets] - Nutritional targets
   * @param {string} [userId] - User ID for meal history
   * @returns {Promise<Object>} Recommendation results with exact and extended matches
   */
  async recommendRecipes(availableIngredients, healthProfile = null, nutritionTargets = null, userId = null) {
    try {
      // 1. OpenAI로 레시피 생성 시도
      const aiRecipes = await this._generateRecipesWithAI(availableIngredients, healthProfile, nutritionTargets);
      
      if (aiRecipes && aiRecipes.length > 0) {
        console.log(`✅ OpenAI로 ${aiRecipes.length}개 레시피 생성 완료`);
        
        // AI 생성 레시피를 exact/extended로 분류
        const exactMatches = [];
        const extendedMatches = [];
        
        for (const recipe of aiRecipes) {
          // 모든 재료가 사용 가능한지 확인
          const allAvailable = recipe.ingredients.every(ing => ing.isAvailable);
          
          if (allAvailable) {
            exactMatches.push(recipe);
          } else {
            extendedMatches.push(recipe);
          }
        }
        
        return {
          exactMatches: exactMatches.slice(0, 10),
          extendedMatches: extendedMatches.slice(0, 10)
        };
      }

      // 2. OpenAI 실패 시 DB 기반 추천으로 폴백
      console.log('⚠️  OpenAI 사용 불가 - DB 레시피 사용');
      
      let candidateRecipes = await Recipe.find().limit(100).lean();

      if (!candidateRecipes || candidateRecipes.length === 0) {
        return {
          exactMatches: [],
          extendedMatches: []
        };
      }

      // 3. Apply allergy filter if health profile provided
      if (healthProfile && healthProfile.allergies && healthProfile.allergies.length > 0) {
        candidateRecipes = AllergyFilter.filterRecipes(candidateRecipes, healthProfile.allergies);
      }

      // 4. Apply nutritional filter if targets provided
      if (nutritionTargets) {
        candidateRecipes = this.filterByNutrition(candidateRecipes, nutritionTargets);
      }

      // 5. Categorize by ingredient match
      const { exactMatches, extendedMatches } = IngredientMatcherService.categorizeRecipes(
        candidateRecipes,
        availableIngredients
      );

      // 6. Score and rank recipes
      const scoredExactMatches = this.scoreRecipes(
        exactMatches,
        availableIngredients,
        nutritionTargets
      );

      const scoredExtendedMatches = this.scoreRecipes(
        extendedMatches,
        availableIngredients,
        nutritionTargets
      );

      // 7. Add personalized rationales
      const exactWithRationales = await this.addRationales(
        scoredExactMatches,
        healthProfile,
        userId,
        nutritionTargets
      );

      const extendedWithRationales = await this.addRationales(
        scoredExtendedMatches,
        healthProfile,
        userId,
        nutritionTargets
      );

      // 8. Return top results
      return {
        exactMatches: exactWithRationales.slice(0, 10),
        extendedMatches: extendedWithRationales.slice(0, 10)
      };

    } catch (error) {
      console.error('Error in recommendRecipes:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new RecipeRecommendationService();
