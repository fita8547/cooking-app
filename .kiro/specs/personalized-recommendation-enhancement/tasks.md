# Implementation Plan: Personalized Recommendation Enhancement

## Overview

This implementation plan breaks down the personalized recommendation system enhancement into incremental, testable steps. The approach follows a bottom-up strategy: first establishing data models and storage, then building analysis and scoring components, followed by recommendation engine logic, API endpoints, and finally frontend integration.

Each task builds on previous work, with property-based tests integrated close to implementation to catch errors early. The plan assumes the existing React frontend, Node.js/Express backend, MongoDB database, and OpenAI API integration are functional.

## Tasks

- [x] 1. Create Preference data model and storage layer
  - [x] 1.1 Create Preference MongoDB schema
    - Define schema in `server/models/Preference.js` with all fields: userId, recipeId, mealId, ratingType, ratingValue, ingredients, cuisineType, difficulty, cookingTime, context, timestamps
    - Add indexes for userId and timestamp
    - Add referential integrity validation
    - _Requirements: 2.1, 2.4, 2.5_
  
  - [x] 1.2 Extend User model with preference fields
    - Add ingredientAffinities array to User schema
    - Add cuisinePreferences array to User schema
    - Add cookingPatterns object to User schema
    - Add recommendationMetrics object to User schema
    - _Requirements: 2.2, 3.5, 6.1, 8.3_
  
  - [x] 1.3 Extend Meal model with recommendation tracking
    - Add preferenceId reference field
    - Add wasRecommended boolean field
    - Add recommendationScore number field
    - _Requirements: 8.3_
  
  - [x] 1.4 Write property test for preference data schema
    - **Property 3: Preference data schema completeness**
    - **Validates: Requirements 1.5, 2.1**
  
  - [ ]* 1.5 Write property test for referential integrity
    - **Property 6: Referential integrity**
    - **Validates: Requirements 2.4**

- [ ] 2. Implement PreferenceService for CRUD operations
  - [x] 2.1 Create PreferenceService class
    - Implement `rateRecipe(userId, recipeId, ratingType, ratingValue, context)` method
    - Implement `getUserPreferences(userId, filters)` method
    - Implement `deleteRating(userId, preferenceId)` method
    - Implement `resetUserPreferences(userId)` method
    - Handle validation and error cases
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.1, 10.2, 10.3_
  
  - [ ]* 2.2 Write property test for rating persistence round-trip
    - **Property 1: Rating persistence round-trip**
    - **Validates: Requirements 1.3**
  
  - [ ]* 2.3 Write property test for rating update consistency
    - **Property 2: Rating update consistency**
    - **Validates: Requirements 1.4**
  
  - [ ]* 2.4 Write property test for preference deletion consistency
    - **Property 29: Preference deletion consistency**
    - **Validates: Requirements 10.2, 10.3, 10.4**
  
  - [ ]* 2.5 Write property test for user data isolation
    - **Property 28: User preference data isolation**
    - **Validates: Requirements 10.5**
  
  - [ ]* 2.6 Write unit tests for error cases
    - Test invalid rating values
    - Test non-existent references
    - Test unauthorized access attempts
    - _Requirements: 1.3, 10.5_

- [ ] 3. Implement ingredient affinity calculation
  - [ ] 3.1 Create affinity calculation methods in PreferenceService
    - Implement `calculateIngredientAffinities(userId)` method
    - Calculate affinity scores with recency weighting
    - Update User.ingredientAffinities array
    - Implement `updatePreferenceSummary(userId)` method to update cuisine and difficulty preferences
    - _Requirements: 2.2, 3.5, 8.1_
  
  - [ ]* 3.2 Write property test for ingredient affinity derivation
    - **Property 4: Ingredient affinity derivation**
    - **Validates: Requirements 2.2**
  
  - [ ]* 3.3 Write property test for affinity calculation correctness
    - **Property 8: Ingredient affinity calculation correctness**
    - **Validates: Requirements 3.5**
  
  - [ ]* 3.4 Write property test for immediate affinity updates
    - **Property 24: Immediate affinity score updates**
    - **Validates: Requirements 8.1**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement PatternAnalyzer for cooking pattern detection
  - [ ] 5.1 Create PatternAnalyzer class
    - Implement `detectCuisinePreferences(meals, preferences)` method
    - Implement `detectDifficultyPreferences(meals, preferences)` method
    - Implement `detectTimePatterns(meals)` method for meal time, duration, weekday/weekend patterns
    - Implement `calculateIngredientCooccurrence(meals, preferences)` method
    - Implement `detectServingSizePatterns(meals)` method
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.2, 6.3, 6.5_
  
  - [ ]* 5.2 Write property test for pattern detection accuracy
    - **Property 7: Pattern detection accuracy**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  
  - [ ]* 5.3 Write property test for temporal pattern detection
    - **Property 19: Temporal pattern detection accuracy**
    - **Validates: Requirements 6.1, 6.2, 6.3**
  
  - [ ]* 5.4 Write unit tests for edge cases
    - Test empty meal history
    - Test single meal
    - Test meals without ratings
    - _Requirements: 3.1, 6.1_

- [ ] 6. Implement ScoreCalculator for preference scoring
  - [ ] 6.1 Create ScoreCalculator class
    - Implement `calculateIngredientScore(recipeIngredients, ingredientAffinities)` method
    - Implement `calculateCuisineScore(recipeCuisine, cuisinePreferences)` method
    - Implement `calculateDifficultyScore(recipeDifficulty, preferredDifficulty)` method
    - Implement `calculateTimeScore(recipeCookingTime, context, patterns)` method
    - Implement `calculateSimilarityScore(recipe1, recipe2)` method
    - Implement `combineScores(scores, weights)` method
    - Implement `calculatePreferenceScore(recipe, userPreferences, patterns)` as main scoring method
    - _Requirements: 4.1, 4.3, 4.4, 4.6, 5.1, 5.2, 6.4_
  
  - [ ]* 6.2 Write property test for ingredient-based prioritization
    - **Property 9: Ingredient-based recommendation prioritization**
    - **Validates: Requirements 4.1**
  
  - [ ]* 6.3 Write property test for cuisine preference weighting
    - **Property 11: Cuisine preference weighting**
    - **Validates: Requirements 4.3**
  
  - [ ]* 6.4 Write property test for difficulty matching
    - **Property 12: Difficulty level matching**
    - **Validates: Requirements 4.4**
  
  - [ ]* 6.5 Write property test for similar recipe ingredient overlap
    - **Property 15: Similar recipe ingredient overlap**
    - **Validates: Requirements 5.1, 5.2**
  
  - [ ]* 6.6 Write property test for context-aware adjustment
    - **Property 20: Context-aware recommendation adjustment**
    - **Validates: Requirements 6.4**
  
  - [ ]* 6.7 Write unit tests for score calculation edge cases
    - Test with zero affinities
    - Test with missing preference data
    - Test with extreme values
    - _Requirements: 4.6_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement RecommendationEngine core logic
  - [ ] 8.1 Create RecommendationEngine class with filtering and ranking
    - Implement `calculatePreferenceScore(userId, recipe)` method using ScoreCalculator
    - Implement recipe filtering logic for disliked ingredients and dietary restrictions
    - Implement ranking logic to sort by preference score
    - _Requirements: 4.2, 4.5, 4.6, 4.7_
  
  - [ ] 8.2 Implement personalized recommendation generation
    - Implement `generatePersonalizedRecommendations(userId, availableIngredients, context, limit)` method
    - Fetch user preferences and patterns
    - Query candidate recipes from database
    - Calculate scores for each recipe
    - Filter and rank results
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [ ]* 8.3 Write property test for disliked ingredient exclusion
    - **Property 10: Disliked ingredient exclusion**
    - **Validates: Requirements 4.2**
  
  - [ ]* 8.4 Write property test for dietary restriction compliance
    - **Property 13: Dietary restriction compliance**
    - **Validates: Requirements 4.5**
  
  - [ ]* 8.5 Write property test for recommendation ranking
    - **Property 14: Recommendation ranking by score**
    - **Validates: Requirements 4.6, 4.7**
  
  - [ ]* 8.6 Write property test for serving size matching
    - **Property 21: Serving size preference matching**
    - **Validates: Requirements 6.5**

- [ ] 9. Implement similar recipe discovery
  - [ ] 9.1 Add similar recipe methods to RecommendationEngine
    - Implement `findSimilarRecipes(recipeId, userId, limit)` method
    - Calculate similarity scores using ScoreCalculator
    - Filter out negatively-rated recipes
    - Rank by similarity score
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 9.2 Write property test for multi-factor similarity
    - **Property 16: Similar recipe multi-factor similarity**
    - **Validates: Requirements 5.3**
  
  - [ ]* 9.3 Write property test for negative rating exclusion
    - **Property 17: Negative rating exclusion from similar recipes**
    - **Validates: Requirements 5.4**
  
  - [ ]* 9.4 Write property test for similar recipe ranking
    - **Property 18: Similar recipe ranking by similarity**
    - **Validates: Requirements 5.5**

- [ ] 10. Implement cold start handling
  - [ ] 10.1 Add cold start methods to RecommendationEngine
    - Implement `generateColdStartRecommendations(userId, limit)` method
    - Use health profile and dietary restrictions as primary factors
    - Ensure cuisine and difficulty diversity
    - Blend with preference-based recommendations for users with 1-4 ratings
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 10.2 Write property test for cold start diversity
    - **Property 27: Cold start recommendation diversity**
    - **Validates: Requirements 9.4, 9.5**
  
  - [ ]* 10.3 Write unit tests for cold start scenarios
    - Test user with zero ratings
    - Test user with 1-4 ratings
    - Test blending logic
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement OpenAI integration for intelligent recommendations
  - [ ] 12.1 Add OpenAI recommendation method to RecommendationEngine
    - Implement `generateAIRecommendations(userId, preferences, context)` method
    - Build prompt with ingredient affinities, cuisine preferences, cooking patterns
    - Call OpenAI API via existing service
    - Parse response and extract recipe data
    - Implement fallback to rule-based recommendations on API failure
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 12.2 Write property test for OpenAI prompt completeness
    - **Property 22: OpenAI prompt completeness**
    - **Validates: Requirements 7.2**
  
  - [ ]* 12.3 Write property test for OpenAI response parsing
    - **Property 23: OpenAI response parsing round-trip**
    - **Validates: Requirements 7.4**
  
  - [ ]* 12.4 Write unit tests for OpenAI integration
    - Test successful API call
    - Test API failure and fallback
    - Test malformed response handling
    - _Requirements: 7.1, 7.5_

- [ ] 13. Implement recommendation acceptance tracking
  - [ ] 13.1 Add tracking methods to PreferenceService
    - Update `rateRecipe` to check if meal was recommended
    - Implement logic to update User.recommendationMetrics
    - Calculate acceptance rate
    - _Requirements: 8.3_
  
  - [ ]* 13.2 Write property test for acceptance tracking
    - **Property 25: Recommendation acceptance tracking**
    - **Validates: Requirements 8.3**

- [ ] 14. Implement preference history and rolling window
  - [ ] 14.1 Add history methods to PreferenceService
    - Implement `getPreferenceHistory(userId, timeWindow)` method
    - Implement rolling window filtering logic
    - Update analysis methods to use rolling window
    - _Requirements: 2.3, 8.5_
  
  - [ ]* 14.2 Write property test for preference history retention
    - **Property 5: Preference history retention**
    - **Validates: Requirements 2.3**
  
  - [ ]* 14.3 Write property test for rolling window filtering
    - **Property 26: Rolling window preference filtering**
    - **Validates: Requirements 8.5**

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Create API routes for preferences
  - [ ] 16.1 Create preference routes in `server/routes/preferences.js`
    - POST /api/preferences/rate - Create or update rating
    - GET /api/preferences/user/:userId - Get user preferences
    - DELETE /api/preferences/:preferenceId - Delete rating
    - POST /api/preferences/reset - Reset all preferences
    - Add authentication middleware
    - Add authorization checks
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.1, 10.2, 10.3, 10.5_
  
  - [ ]* 16.2 Write integration tests for preference API endpoints
    - Test all CRUD operations
    - Test authentication and authorization
    - Test error responses
    - _Requirements: 1.3, 10.5_
  
  - [ ]* 16.3 Write property test for complete data retrieval
    - **Property 30: Complete preference data retrieval**
    - **Validates: Requirements 10.1**

- [ ] 17. Create API routes for recommendations
  - [ ] 17.1 Create recommendation routes in `server/routes/recommendations.js`
    - GET /api/recommendations/personalized - Get personalized recommendations
    - GET /api/recommendations/similar/:recipeId - Get similar recipes
    - GET /api/recommendations/patterns - Get user patterns and affinities
    - Add authentication middleware
    - Handle query parameters (ingredients, mealType, limit)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 17.2 Write integration tests for recommendation API endpoints
    - Test personalized recommendations endpoint
    - Test similar recipes endpoint
    - Test patterns endpoint
    - Test with various query parameters
    - _Requirements: 4.7, 5.5_

- [ ] 18. Register new routes in Express app
  - [ ] 18.1 Update `server/index.js` to include new routes
    - Import and register preference routes
    - Import and register recommendation routes
    - Ensure proper middleware order
    - _Requirements: All API requirements_

- [ ] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Create frontend rating interface components
  - [ ] 20.1 Create RecipeRating component
    - Build like/dislike button interface
    - Build 1-5 star rating interface
    - Handle rating submission
    - Call POST /api/preferences/rate endpoint
    - Show success/error feedback
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 20.2 Create MealRating component for meal logging
    - Integrate rating interface into meal logging flow
    - Pass meal context (mealType, time, day)
    - _Requirements: 1.2, 1.3_
  
  - [ ]* 20.3 Write unit tests for rating components
    - Test button interactions
    - Test API call handling
    - Test error states
    - _Requirements: 1.1, 1.2_

- [ ] 21. Create frontend recommendation display components
  - [ ] 21.1 Create PersonalizedRecommendations component
    - Fetch recommendations from GET /api/recommendations/personalized
    - Display recipe cards with preference scores
    - Show why recipe was recommended (matching ingredients, cuisine, etc.)
    - Handle loading and error states
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [ ] 21.2 Create SimilarRecipes component
    - Fetch similar recipes from GET /api/recommendations/similar/:recipeId
    - Display on recipe detail pages
    - Show similarity indicators
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ] 21.3 Create PreferenceInsights component
    - Fetch patterns from GET /api/recommendations/patterns
    - Display ingredient affinities
    - Display cuisine preferences
    - Display cooking patterns
    - Allow viewing and managing preference data
    - _Requirements: 10.1_
  
  - [ ]* 21.4 Write unit tests for recommendation display components
    - Test data fetching and display
    - Test loading states
    - Test error handling
    - _Requirements: 4.7, 5.5_

- [ ] 22. Integrate rating interface into existing recipe views
  - [ ] 22.1 Add RecipeRating component to recipe generation results
    - Update recipe display to include rating interface
    - Track which recipes are rated
    - _Requirements: 1.1_
  
  - [ ] 22.2 Add MealRating component to meal logging interface
    - Update meal logging form to include rating
    - Make rating optional but encouraged
    - _Requirements: 1.2_

- [ ] 23. Integrate recommendations into main app flow
  - [ ] 23.1 Add PersonalizedRecommendations to home/dashboard
    - Show personalized recommendations on main page
    - Update based on available ingredients if provided
    - Adapt to time of day context
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 6.4_
  
  - [ ] 23.2 Add SimilarRecipes to recipe detail pages
    - Show similar recipes when viewing a recipe
    - Show similar recipes after rating a recipe positively
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ] 23.3 Add PreferenceInsights to user profile/settings
    - Create section for viewing preference data
    - Add controls for deleting ratings and resetting preferences
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 24. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 25. Add error handling and loading states throughout
  - [ ] 25.1 Implement error boundaries in React components
    - Add error boundaries for recommendation components
    - Show user-friendly error messages
    - _Requirements: All frontend requirements_
  
  - [ ] 25.2 Add loading skeletons and spinners
    - Show loading states while fetching recommendations
    - Show loading states while submitting ratings
    - _Requirements: All frontend requirements_
  
  - [ ] 25.3 Implement retry logic for failed API calls
    - Add retry with exponential backoff for transient errors
    - Show retry options to users
    - _Requirements: 7.5_

- [ ] 26. Create test data generators for property-based tests
  - [ ] 26.1 Create arbitraries for fast-check
    - Create `arbitraryUserId()` generator
    - Create `arbitraryRecipeId()` generator
    - Create `arbitraryRating()` generator
    - Create `arbitraryIngredientList()` generator
    - Create `arbitraryMealHistory()` generator
    - Create `arbitraryPreferenceProfile()` generator
    - Create `arbitraryContext()` generator
    - _Requirements: All property test requirements_
  
  - [ ]* 26.2 Write validation tests for generators
    - Ensure generators produce valid data
    - Test generator edge cases
    - _Requirements: All property test requirements_

- [ ] 27. Final integration testing and validation
  - [ ]* 27.1 Write end-to-end integration tests
    - Test complete flow: rate recipe → analyze → get recommendations → rate recommendation
    - Test cold start to established user journey
    - Test preference reset and rebuild
    - _Requirements: All requirements_
  
  - [ ]* 27.2 Write performance tests
    - Test recommendation generation time
    - Test database query performance
    - Test with large datasets
    - _Requirements: All requirements_

- [ ] 28. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties (30 properties total)
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests validate end-to-end flows and API contracts
- The implementation follows a bottom-up approach: data layer → business logic → API → frontend
- OpenAI integration includes fallback to rule-based recommendations for reliability
- Cold start handling ensures good experience for new users
- All preference data operations include authorization checks for security
