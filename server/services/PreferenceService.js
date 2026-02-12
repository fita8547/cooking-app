import Preference from '../models/Preference.js';
import User from '../models/User.js';
import Recipe from '../models/Recipe.js';
import Meal from '../models/Meal.js';

class PreferenceService {
  /**
   * Create or update a recipe rating
   * @param {string} userId - User ID
   * @param {string} recipeId - Recipe ID (optional if mealId provided)
   * @param {string} ratingType - 'like', 'dislike', or 'star'
   * @param {number} ratingValue - 1/-1 for like/dislike, 1-5 for star
   * @param {object} context - Context information (mealType, dayOfWeek, timeOfDay)
   * @returns {Promise<object>} Created or updated preference
   */
  async rateRecipe(userId, recipeId, ratingType, ratingValue, context = {}) {
    // Validation
    if (!userId) {
      throw new Error('userId is required');
    }

    if (!recipeId && !context.mealId) {
      throw new Error('Either recipeId or mealId is required');
    }

    // Validate ratingType
    const validRatingTypes = ['like', 'dislike', 'star'];
    if (!validRatingTypes.includes(ratingType)) {
      throw new Error(`Invalid ratingType. Must be one of: ${validRatingTypes.join(', ')}`);
    }

    // Validate ratingValue based on ratingType
    if (ratingType === 'like' && ratingValue !== 1) {
      throw new Error('ratingValue must be 1 for like');
    }
    if (ratingType === 'dislike' && ratingValue !== -1) {
      throw new Error('ratingValue must be -1 for dislike');
    }
    if (ratingType === 'star' && (ratingValue < 1 || ratingValue > 5)) {
      throw new Error('ratingValue must be between 1 and 5 for star ratings');
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify recipe exists if provided
    if (recipeId) {
      const recipe = await Recipe.findById(recipeId);
      if (!recipe) {
        throw new Error('Recipe not found');
      }
    }

    // Verify meal exists if provided
    if (context.mealId) {
      const meal = await Meal.findById(context.mealId);
      if (!meal) {
        throw new Error('Meal not found');
      }
      
      // Ensure meal belongs to user
      if (meal.userId.toString() !== userId) {
        throw new Error('Unauthorized: Meal does not belong to user');
      }
    }

    // Get recipe details for storing with preference
    let recipeDetails = {};
    if (recipeId) {
      const recipe = await Recipe.findById(recipeId);
      recipeDetails = {
        ingredients: recipe.ingredients || [],
        cuisineType: recipe.cuisineType || recipe.cuisine || '',
        difficulty: recipe.difficulty || '',
        cookingTime: recipe.cookingTime || recipe.prepTime || 0
      };
    } else if (context.mealId) {
      const meal = await Meal.findById(context.mealId);
      if (meal.recipeId) {
        const recipe = await Recipe.findById(meal.recipeId);
        if (recipe) {
          recipeDetails = {
            ingredients: recipe.ingredients || [],
            cuisineType: recipe.cuisineType || recipe.cuisine || '',
            difficulty: recipe.difficulty || '',
            cookingTime: recipe.cookingTime || recipe.prepTime || 0
          };
        }
      }
    }

    // Check if preference already exists for this user and recipe/meal
    const existingQuery = { userId };
    if (recipeId) {
      existingQuery.recipeId = recipeId;
    }
    if (context.mealId) {
      existingQuery.mealId = context.mealId;
    }

    let preference = await Preference.findOne(existingQuery);

    if (preference) {
      // Update existing preference
      preference.ratingType = ratingType;
      preference.ratingValue = ratingValue;
      preference.context = {
        ...preference.context,
        ...context
      };
      preference.ingredients = recipeDetails.ingredients || preference.ingredients;
      preference.cuisineType = recipeDetails.cuisineType || preference.cuisineType;
      preference.difficulty = recipeDetails.difficulty || preference.difficulty;
      preference.cookingTime = recipeDetails.cookingTime || preference.cookingTime;
      
      await preference.save();
    } else {
      // Create new preference
      preference = await Preference.create({
        userId,
        recipeId: recipeId || null,
        mealId: context.mealId || null,
        ratingType,
        ratingValue,
        ingredients: recipeDetails.ingredients || [],
        cuisineType: recipeDetails.cuisineType || '',
        difficulty: recipeDetails.difficulty || '',
        cookingTime: recipeDetails.cookingTime || 0,
        context: {
          mealType: context.mealType || '',
          dayOfWeek: context.dayOfWeek !== undefined ? context.dayOfWeek : new Date().getDay(),
          timeOfDay: context.timeOfDay || this._getTimeOfDay()
        }
      });
    }

    return preference;
  }

  /**
   * Get user preferences with optional filters
   * @param {string} userId - User ID
   * @param {object} filters - Optional filters (limit, offset, ratingType, startDate, endDate)
   * @returns {Promise<object>} Preferences and total count
   */
  async getUserPreferences(userId, filters = {}) {
    if (!userId) {
      throw new Error('userId is required');
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Build query
    const query = { userId };

    // Apply filters
    if (filters.ratingType) {
      query.ratingType = filters.ratingType;
    }

    if (filters.preferenceId) {
      query._id = filters.preferenceId;
    }

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.timestamp.$lte = new Date(filters.endDate);
      }
    }

    // Get total count
    const total = await Preference.countDocuments(query);

    // Build query with pagination
    let queryBuilder = Preference.find(query)
      .sort({ timestamp: -1 });

    if (filters.limit) {
      queryBuilder = queryBuilder.limit(parseInt(filters.limit));
    }

    if (filters.offset) {
      queryBuilder = queryBuilder.skip(parseInt(filters.offset));
    }

    const preferences = await queryBuilder
      .populate('recipeId', 'name ingredients cuisineType difficulty')
      .populate('mealId', 'recipeName mealType date')
      .exec();

    return {
      preferences,
      total
    };
  }

  /**
   * Delete a specific rating
   * @param {string} userId - User ID
   * @param {string} preferenceId - Preference ID to delete
   * @returns {Promise<object>} Deletion result
   */
  async deleteRating(userId, preferenceId) {
    if (!userId) {
      throw new Error('userId is required');
    }

    if (!preferenceId) {
      throw new Error('preferenceId is required');
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Find preference
    const preference = await Preference.findById(preferenceId);
    if (!preference) {
      throw new Error('Preference not found');
    }

    // Verify preference belongs to user
    if (preference.userId.toString() !== userId) {
      throw new Error('Unauthorized: Preference does not belong to user');
    }

    // Delete preference
    await Preference.findByIdAndDelete(preferenceId);

    return {
      success: true,
      message: 'Preference deleted successfully'
    };
  }

  /**
   * Reset all user preferences
   * @param {string} userId - User ID
   * @returns {Promise<object>} Reset result
   */
  async resetUserPreferences(userId) {
    if (!userId) {
      throw new Error('userId is required');
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Delete all preferences for user
    const result = await Preference.deleteMany({ userId });

    // Reset user preference fields (only reset fields that exist in the schema)
    if (!user.preferences) {
      user.preferences = {};
    }
    
    user.preferences.favoriteRecipes = [];
    user.preferences.dislikedIngredients = [];
    
    // Reset extended preference fields if they exist (added in task 1.2)
    if (user.preferences.ingredientAffinities !== undefined) {
      user.preferences.ingredientAffinities = [];
    }
    if (user.preferences.cuisinePreferences !== undefined) {
      user.preferences.cuisinePreferences = [];
    }
    if (user.preferences.cookingPatterns !== undefined) {
      user.preferences.cookingPatterns = {
        preferredDifficulty: '',
        averageCookingTime: 0,
        preferredMealTimes: {
          breakfast: [],
          lunch: [],
          dinner: [],
          snack: []
        },
        weekdayVsWeekend: {
          weekday: { avgTime: 0, difficulty: '' },
          weekend: { avgTime: 0, difficulty: '' }
        }
      };
    }
    if (user.preferences.recommendationMetrics !== undefined) {
      user.preferences.recommendationMetrics = {
        totalRecommendations: 0,
        acceptedRecommendations: 0,
        acceptanceRate: 0,
        lastCalculated: new Date()
      };
    }

    await user.save();

    return {
      success: true,
      message: `Reset ${result.deletedCount} preferences successfully`
    };
  }

  /**
   * Helper method to determine time of day
   * @private
   * @returns {string} Time of day (morning, afternoon, evening)
   */
  _getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    return 'evening';
  }
}

export default new PreferenceService();
