// NavigationState is a client-side model for managing navigation history
// This file defines the structure for reference, but implementation will be in the frontend

/**
 * @typedef {Object} NavigationState
 * @property {string} currentScreen - Current screen identifier
 * @property {string|null} previousScreen - Previous screen identifier
 * @property {Array<HistoryEntry>} history - Navigation history
 * @property {Object} params - Navigation parameters
 */

/**
 * @typedef {Object} HistoryEntry
 * @property {string} screen - Screen identifier
 * @property {Date} timestamp - When navigation occurred
 * @property {Object} params - Parameters passed to screen
 */

/**
 * Screen types
 * @enum {string}
 */
export const ScreenType = {
  LOGIN: 'Login',
  QUICK_HEALTH_INFO: 'QuickHealthInfo',
  HOME_HUB: 'HomeHub',
  MY_FRIDGE: 'MyFridge',
  RECIPE_RECOMMENDATION: 'RecipeRecommendation',
  MEAL_LOGGING: 'MealLogging'
};

export default {
  ScreenType
};
