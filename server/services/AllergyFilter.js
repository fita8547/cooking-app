/**
 * AllergyFilter Service
 * 
 * Filters recipes based on user allergies to ensure safe meal recommendations.
 * 
 * Features:
 * - Complete allergen exclusion
 * - Substring matching for allergen variations
 * - Support for both English and Korean allergen names
 * - Alternative recipe suggestions with similar nutrition
 */

import '../types/index.js';

class AllergyFilter {
  /**
   * Normalize allergen name for comparison
   * - Convert to lowercase
   * - Trim whitespace
   * 
   * @param {string} allergen - Allergen name
   * @returns {string} Normalized allergen name
   * @private
   */
  _normalizeAllergen(allergen) {
    if (!allergen || typeof allergen !== 'string') {
      return '';
    }

    return allergen.toLowerCase().trim();
  }

  /**
   * Extract allergen names from allergy objects or strings
   * Handles both formats:
   * - String: "milk"
   * - Object: { name: "milk", nameKo: "우유", severity: "Severe" }
   * 
   * @param {Array<string|Object>} allergies - User allergies
   * @returns {string[]} List of allergen names (both English and Korean)
   * @private
   */
  _extractAllergenNames(allergies) {
    if (!allergies || !Array.isArray(allergies)) {
      return [];
    }

    const allergenNames = [];

    for (const allergy of allergies) {
      if (typeof allergy === 'string') {
        allergenNames.push(this._normalizeAllergen(allergy));
      } else if (allergy && typeof allergy === 'object') {
        // Add English name
        if (allergy.name) {
          allergenNames.push(this._normalizeAllergen(allergy.name));
        }
        // Add Korean name
        if (allergy.nameKo) {
          allergenNames.push(this._normalizeAllergen(allergy.nameKo));
        }
      }
    }

    return allergenNames;
  }

  /**
   * Check if a recipe ingredient contains an allergen
   * Uses substring matching to catch variations:
   * - "milk" catches "whole milk", "skim milk", "milk powder"
   * - "peanut" catches "peanuts", "peanut butter", "peanut oil"
   * 
   * @param {string} ingredient - Ingredient name
   * @param {string} allergen - Allergen name (normalized)
   * @returns {boolean} True if ingredient contains allergen
   * @private
   */
  _ingredientContainsAllergen(ingredient, allergen) {
    const normalizedIngredient = this._normalizeAllergen(ingredient);
    
    if (!normalizedIngredient || !allergen) {
      return false;
    }

    // Check if allergen is a substring of ingredient
    return normalizedIngredient.includes(allergen);
  }

  /**
   * Check if a recipe contains any allergens
   * 
   * @param {import('../types').Recipe} recipe - Recipe object
   * @param {string} allergen - Allergen name (normalized)
   * @returns {boolean} True if recipe contains the allergen
   */
  containsAllergen(recipe, allergen) {
    if (!recipe || !recipe.ingredients) {
      return false;
    }

    if (!allergen) {
      return false;
    }

    const normalizedAllergen = this._normalizeAllergen(allergen);

    // Check recipe ingredients
    for (const ingredient of recipe.ingredients) {
      const ingredientName = typeof ingredient === 'string' 
        ? ingredient 
        : ingredient.name || '';

      if (this._ingredientContainsAllergen(ingredientName, normalizedAllergen)) {
        return true;
      }
    }

    // Check recipe allergens field if available
    if (recipe.allergens && Array.isArray(recipe.allergens)) {
      for (const recipeAllergen of recipe.allergens) {
        if (this._normalizeAllergen(recipeAllergen) === normalizedAllergen) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Filter recipes to exclude those containing user allergens
   * 
   * @param {import('../types').Recipe[]} recipes - List of recipes
   * @param {Array<string|Object>} allergies - User allergies
   * @returns {import('../types').Recipe[]} Filtered recipes (safe to eat)
   */
  filterRecipes(recipes, allergies) {
    if (!recipes || recipes.length === 0) {
      return [];
    }

    if (!allergies || allergies.length === 0) {
      // No allergies, return all recipes
      return recipes;
    }

    // Extract all allergen names (English and Korean)
    const allergenNames = this._extractAllergenNames(allergies);

    if (allergenNames.length === 0) {
      return recipes;
    }

    // Filter out recipes containing any allergen
    return recipes.filter(recipe => {
      // Check if recipe contains any allergen
      for (const allergen of allergenNames) {
        if (this.containsAllergen(recipe, allergen)) {
          return false; // Exclude this recipe
        }
      }
      return true; // Safe to include
    });
  }

  /**
   * Find alternative recipes with similar nutrition to an excluded recipe
   * 
   * Similarity criteria:
   * - Calories within 20% of original
   * - Macronutrients within 25% of original
   * 
   * @param {import('../types').Recipe} excludedRecipe - Recipe that was excluded
   * @param {import('../types').Recipe[]} availableRecipes - Pool of safe recipes
   * @param {number} maxResults - Maximum number of alternatives to return
   * @returns {import('../types').Recipe[]} Alternative recipes
   */
  findAlternatives(excludedRecipe, availableRecipes, maxResults = 3) {
    if (!excludedRecipe || !excludedRecipe.nutrition) {
      return [];
    }

    if (!availableRecipes || availableRecipes.length === 0) {
      return [];
    }

    const targetNutrition = excludedRecipe.nutrition;
    const alternatives = [];

    for (const recipe of availableRecipes) {
      if (!recipe.nutrition) {
        continue;
      }

      // Calculate nutritional similarity
      const caloriesDiff = Math.abs(recipe.nutrition.calories - targetNutrition.calories) / targetNutrition.calories;
      const proteinDiff = Math.abs(recipe.nutrition.protein - targetNutrition.protein) / (targetNutrition.protein || 1);
      const carbsDiff = Math.abs(recipe.nutrition.carbs - targetNutrition.carbs) / (targetNutrition.carbs || 1);
      const fatDiff = Math.abs(recipe.nutrition.fat - targetNutrition.fat) / (targetNutrition.fat || 1);

      // Check if within similarity thresholds
      const caloriesWithinRange = caloriesDiff <= 0.20; // 20% tolerance
      const macrosWithinRange = proteinDiff <= 0.25 && carbsDiff <= 0.25 && fatDiff <= 0.25; // 25% tolerance

      if (caloriesWithinRange && macrosWithinRange) {
        // Calculate overall similarity score (lower is better)
        const similarityScore = caloriesDiff + proteinDiff + carbsDiff + fatDiff;
        
        alternatives.push({
          recipe,
          similarityScore
        });
      }
    }

    // Sort by similarity score (most similar first)
    alternatives.sort((a, b) => a.similarityScore - b.similarityScore);

    // Return top N alternatives
    return alternatives.slice(0, maxResults).map(alt => alt.recipe);
  }

  /**
   * Get detailed allergen information for a recipe
   * 
   * @param {import('../types').Recipe} recipe - Recipe object
   * @param {Array<string|Object>} userAllergies - User allergies
   * @returns {Object} Allergen information
   */
  getAllergenInfo(recipe, userAllergies) {
    if (!recipe || !recipe.ingredients) {
      return {
        containsAllergens: false,
        detectedAllergens: [],
        isSafe: true
      };
    }

    const allergenNames = this._extractAllergenNames(userAllergies);
    const detectedAllergens = [];

    for (const allergen of allergenNames) {
      if (this.containsAllergen(recipe, allergen)) {
        detectedAllergens.push(allergen);
      }
    }

    return {
      containsAllergens: detectedAllergens.length > 0,
      detectedAllergens,
      isSafe: detectedAllergens.length === 0
    };
  }

  /**
   * Get statistics about allergen filtering
   * 
   * @param {import('../types').Recipe[]} originalRecipes - Original recipe list
   * @param {import('../types').Recipe[]} filteredRecipes - Filtered recipe list
   * @param {Array<string|Object>} allergies - User allergies
   * @returns {Object} Filtering statistics
   */
  getFilteringStatistics(originalRecipes, filteredRecipes, allergies) {
    const allergenNames = this._extractAllergenNames(allergies);
    
    return {
      totalRecipes: originalRecipes.length,
      safeRecipes: filteredRecipes.length,
      excludedRecipes: originalRecipes.length - filteredRecipes.length,
      allergenCount: allergenNames.length,
      filteringRate: originalRecipes.length > 0 
        ? Math.round((filteredRecipes.length / originalRecipes.length) * 100) 
        : 0
    };
  }
}

// Export singleton instance
export default new AllergyFilter();
