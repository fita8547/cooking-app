import Ingredient from '../models/Ingredient.js';

class IngredientRepository {
  /**
   * Get count of ingredients in user's fridge
   * @param {string} userId 
   * @returns {Promise<{success: boolean, data?: number, error?: string}>}
   */
  async getIngredientCount(userId) {
    try {
      const count = await Ingredient.countDocuments({ userId });
      return { success: true, data: count };
    } catch (error) {
      return { success: false, error: 'CountFailed' };
    }
  }

  /**
   * Get all ingredients for user
   * @param {string} userId 
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getIngredients(userId) {
    try {
      const ingredients = await Ingredient.find({ userId });
      return { success: true, data: ingredients };
    } catch (error) {
      return { success: false, error: 'RetrieveFailed' };
    }
  }

  /**
   * Add ingredient to user's fridge
   * @param {string} userId 
   * @param {object} ingredient 
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async addIngredient(userId, ingredient) {
    try {
      const newIngredient = await Ingredient.create({
        userId,
        ...ingredient
      });
      return { success: true, data: newIngredient };
    } catch (error) {
      return { success: false, error: 'AddFailed' };
    }
  }

  /**
   * Remove ingredient from user's fridge
   * @param {string} userId 
   * @param {string} ingredientId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async removeIngredient(userId, ingredientId) {
    try {
      await Ingredient.deleteOne({ _id: ingredientId, userId });
      return { success: true };
    } catch (error) {
      return { success: false, error: 'RemoveFailed' };
    }
  }

  /**
   * Update ingredient quantity
   * @param {string} userId 
   * @param {string} ingredientId 
   * @param {number} quantity 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateIngredient(userId, ingredientId, quantity) {
    try {
      await Ingredient.findOneAndUpdate(
        { _id: ingredientId, userId },
        { quantity },
        { new: true }
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: 'UpdateFailed' };
    }
  }
}

export default new IngredientRepository();
