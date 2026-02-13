/**
 * IngredientMatcherService
 * 
 * Matches recipes with available ingredients and categorizes them as:
 * - Exact matches: Recipes using only available ingredients
 * - Extended matches: Recipes requiring additional ingredients
 * 
 * Features:
 * - Ingredient normalization (lowercase, trim)
 * - Fuzzy matching for ingredient variations
 * - Missing ingredient identification
 */

import '../types/index.js';

class IngredientMatcherService {
  /**
   * Normalize ingredient name for comparison
   * - Convert to lowercase
   * - Trim whitespace
   * - Remove common variations (e.g., "fresh", "dried")
   * 
   * @param {string} ingredient - Ingredient name
   * @returns {string} Normalized ingredient name
   * @private
   */
  _normalizeIngredient(ingredient) {
    if (!ingredient || typeof ingredient !== 'string') {
      return '';
    }

    return ingredient
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' '); // Replace multiple spaces with single space
  }

  /**
   * Check if two ingredients match using fuzzy matching
   * Handles variations like:
   * - Singular/plural (tomato/tomatoes)
   * - Common prefixes (fresh tomato/tomato)
   * - Partial matches (chicken breast/chicken)
   * 
   * @param {string} ingredient1 - First ingredient
   * @param {string} ingredient2 - Second ingredient
   * @returns {boolean} True if ingredients match
   * @private
   */
  _ingredientsMatch(ingredient1, ingredient2) {
    const norm1 = this._normalizeIngredient(ingredient1);
    const norm2 = this._normalizeIngredient(ingredient2);

    if (!norm1 || !norm2) {
      return false;
    }

    // Exact match
    if (norm1 === norm2) {
      return true;
    }

    // Check if one contains the other (for partial matches)
    // e.g., "chicken" matches "chicken breast"
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      return true;
    }

    // Check singular/plural variations
    // Simple approach: check if adding/removing 's' or 'es' creates a match
    const variations = [
      [norm1, norm2 + 's'],
      [norm1, norm2 + 'es'],
      [norm1 + 's', norm2],
      [norm1 + 'es', norm2]
    ];

    for (const [v1, v2] of variations) {
      if (v1 === v2) {
        return true;
      }
    }

    // Check if removing common prefixes creates a match
    const prefixes = ['fresh ', 'dried ', 'frozen ', 'raw ', 'cooked '];
    for (const prefix of prefixes) {
      const stripped1 = norm1.startsWith(prefix) ? norm1.slice(prefix.length) : norm1;
      const stripped2 = norm2.startsWith(prefix) ? norm2.slice(prefix.length) : norm2;
      
      if (stripped1 === stripped2) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if an ingredient is available in the user's ingredient list
   * 
   * @param {string} recipeIngredient - Ingredient from recipe
   * @param {string[]} availableIngredients - User's available ingredients
   * @returns {boolean} True if ingredient is available
   * @private
   */
  _isIngredientAvailable(recipeIngredient, availableIngredients) {
    // Extract ingredient name if it's an object
    const ingredientName = typeof recipeIngredient === 'string' 
      ? recipeIngredient 
      : recipeIngredient.name || '';

    // Check against all available ingredients
    return availableIngredients.some(available => 
      this._ingredientsMatch(ingredientName, available)
    );
  }

  /**
   * Identify missing ingredients for a recipe
   * 
   * @param {import('../types').Recipe} recipe - Recipe object
   * @param {string[]} availableIngredients - User's available ingredients
   * @returns {string[]} List of missing ingredient names
   */
  identifyMissingIngredients(recipe, availableIngredients) {
    if (!recipe || !recipe.ingredients) {
      return [];
    }

    if (!availableIngredients || availableIngredients.length === 0) {
      // If no ingredients available, all recipe ingredients are missing
      return recipe.ingredients.map(ing => 
        typeof ing === 'string' ? ing : ing.name
      );
    }

    const missingIngredients = [];

    for (const ingredient of recipe.ingredients) {
      const ingredientName = typeof ingredient === 'string' 
        ? ingredient 
        : ingredient.name;

      if (!this._isIngredientAvailable(ingredient, availableIngredients)) {
        missingIngredients.push(ingredientName);
      }
    }

    return missingIngredients;
  }

  /**
   * Categorize recipes into exact matches and extended matches
   * 
   * Exact match: All recipe ingredients are available
   * Extended match: At least one recipe ingredient is missing
   * 
   * @param {import('../types').Recipe[]} recipes - List of recipes
   * @param {string[]} availableIngredients - User's available ingredients
   * @returns {import('../types').CategorizedRecipes} Categorized recipes
   */
  categorizeRecipes(recipes, availableIngredients) {
    if (!recipes || recipes.length === 0) {
      return {
        exactMatches: [],
        extendedMatches: []
      };
    }

    if (!availableIngredients || availableIngredients.length === 0) {
      // If no ingredients available, all recipes are extended matches
      return {
        exactMatches: [],
        extendedMatches: recipes.map(recipe => ({
          ...recipe,
          matchType: 'extended',
          missingIngredients: this.identifyMissingIngredients(recipe, availableIngredients)
        }))
      };
    }

    const exactMatches = [];
    const extendedMatches = [];

    for (const recipe of recipes) {
      const missingIngredients = this.identifyMissingIngredients(recipe, availableIngredients);

      if (missingIngredients.length === 0) {
        // All ingredients available - exact match
        exactMatches.push({
          ...recipe,
          matchType: 'exact',
          missingIngredients: []
        });
      } else {
        // Some ingredients missing - extended match
        extendedMatches.push({
          ...recipe,
          matchType: 'extended',
          missingIngredients
        });
      }
    }

    return {
      exactMatches,
      extendedMatches
    };
  }

  /**
   * Calculate ingredient match percentage for a recipe
   * 
   * @param {import('../types').Recipe} recipe - Recipe object
   * @param {string[]} availableIngredients - User's available ingredients
   * @returns {number} Match percentage (0-100)
   */
  calculateMatchPercentage(recipe, availableIngredients) {
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      return 0;
    }

    if (!availableIngredients || availableIngredients.length === 0) {
      return 0;
    }

    const totalIngredients = recipe.ingredients.length;
    const missingIngredients = this.identifyMissingIngredients(recipe, availableIngredients);
    const matchedIngredients = totalIngredients - missingIngredients.length;

    return Math.round((matchedIngredients / totalIngredients) * 100);
  }

  /**
   * Get ingredient match statistics for a recipe
   * 
   * @param {import('../types').Recipe} recipe - Recipe object
   * @param {string[]} availableIngredients - User's available ingredients
   * @returns {Object} Match statistics
   */
  getMatchStatistics(recipe, availableIngredients) {
    const missingIngredients = this.identifyMissingIngredients(recipe, availableIngredients);
    const totalIngredients = recipe.ingredients ? recipe.ingredients.length : 0;
    const matchedIngredients = totalIngredients - missingIngredients.length;
    const matchPercentage = this.calculateMatchPercentage(recipe, availableIngredients);

    return {
      totalIngredients,
      matchedIngredients,
      missingIngredients: missingIngredients.length,
      matchPercentage,
      isExactMatch: missingIngredients.length === 0
    };
  }
}

// Export singleton instance
export default new IngredientMatcherService();
