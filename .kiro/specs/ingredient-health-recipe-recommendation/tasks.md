# Implementation Plan: Ingredient-Health Recipe Recommendation

## Overview

This implementation plan breaks down the ingredient-based recipe recommendation and health-based meal planning features into incremental coding tasks. The approach follows a bottom-up strategy: first implementing core calculation and filtering services, then building the recommendation orchestration layer, adding data persistence, and finally integrating with the frontend.

## Tasks

- [x] 1. Set up data models and database schemas
  - Create TypeScript interfaces for HealthProfile, Recipe, NutritionInfo, and MacronutrientTargets
  - Define MongoDB schemas for HealthProfiles and enhanced Recipes collections
  - Add indexes for userId, allergens, and nutrition fields
  - Set up database migration scripts if needed
  - _Requirements: 3.1-3.7, 8.3_

- [x] 2. Implement NutritionCalculator service
  - [x] 2.1 Create NutritionCalculator class with calculation methods
    - Implement calculateBMI(height, weight)
    - Implement calculateBMR(age, gender, height, weight) using Mifflin-St Jeor equation
    - Implement calculateTDEE(bmr, activityLevel)
    - Implement calculateProteinTarget(weight, goal)
    - Implement calculateMacronutrients(tdee, proteinTarget, goal)
    - Implement determineTargetWeightRange(height, gender)
    - Add input validation for all methods
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 2.2 Write property test for BMI calculation
    - **Property 4: BMI Calculation Accuracy**
    - **Validates: Requirements 4.1**

  - [ ]* 2.3 Write property test for target weight range calculation
    - **Property 5: Target Weight Range Calculation**
    - **Validates: Requirements 4.2**

  - [ ]* 2.4 Write property test for BMR calculation
    - **Property 6: BMR Calculation Accuracy**
    - **Validates: Requirements 4.3, 4.7**

  - [ ]* 2.5 Write property test for TDEE calculation
    - **Property 7: TDEE Calculation Accuracy**
    - **Validates: Requirements 4.4**

  - [ ]* 2.6 Write property test for protein target calculation
    - **Property 8: Protein Target Calculation**
    - **Validates: Requirements 4.5**

  - [ ]* 2.7 Write property test for macronutrient distribution
    - **Property 9: Macronutrient Distribution Correctness**
    - **Validates: Requirements 4.6**

  - [ ]* 2.8 Write unit tests for edge cases
    - Test boundary values (age 1, age 120, very tall/short, very light/heavy)
    - Test invalid inputs (negative values, zero values)
    - Test gender-specific formula differences
    - _Requirements: 4.1-4.7_

- [x] 3. Checkpoint - Ensure nutrition calculation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement IngredientMatcherService
  - [x] 4.1 Create IngredientMatcherService class
    - Implement categorizeRecipes(recipes, availableIngredients)
    - Implement identifyMissingIngredients(recipe, availableIngredients)
    - Add ingredient normalization (lowercase, trim)
    - Add fuzzy matching logic for ingredient comparison
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3_

  - [ ]* 4.2 Write property test for recipe ingredient feasibility
    - **Property 1: Recipe Ingredient Feasibility**
    - **Validates: Requirements 1.1**

  - [ ]* 4.3 Write property test for recipe categorization
    - **Property 2: Recipe Categorization Correctness**
    - **Validates: Requirements 1.2, 1.3, 1.4**

  - [ ]* 4.4 Write property test for missing ingredient identification
    - **Property 3: Missing Ingredient Identification**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]* 4.5 Write unit tests for ingredient matching
    - Test exact matches with various ingredient lists
    - Test extended matches with missing ingredients
    - Test fuzzy matching (singular/plural, variations)
    - Test empty ingredient lists
    - _Requirements: 1.1-1.4, 2.1-2.3_

- [x] 5. Implement AllergyFilter service
  - [x] 5.1 Create AllergyFilter class
    - Implement filterRecipes(recipes, allergies)
    - Implement containsAllergen(recipe, allergen)
    - Add allergen normalization and substring matching
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 5.2 Write property test for allergy exclusion
    - **Property 10: Allergy Exclusion Completeness**
    - **Validates: Requirements 5.1, 5.3, 6.4**

  - [ ]* 5.3 Write property test for alternative recipe similarity
    - **Property 11: Alternative Recipe Nutritional Similarity**
    - **Validates: Requirements 5.4**

  - [ ]* 5.4 Write unit tests for allergy filtering
    - Test common allergens (milk, eggs, nuts, soy, wheat, fish, shellfish)
    - Test substring matching (e.g., "milk" catches "whole milk")
    - Test multiple allergens
    - Test recipes with no allergens
    - _Requirements: 5.1-5.4_

- [x] 6. Checkpoint - Ensure filtering services tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement RecipeRecommendationService
  - [x] 7.1 Create RecipeRecommendationService class
    - Implement recommendRecipes(availableIngredients, healthProfile?, nutritionTargets?)
    - Implement filterByNutrition(recipes, targets)
    - Implement scoreRecipes(recipes, criteria)
    - Integrate IngredientMatcherService, AllergyFilter, and NutritionCalculator
    - Add recipe scoring algorithm (ingredient match 60%, nutrition match 40%)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3_

  - [ ]* 7.2 Write property test for combined filter application
    - **Property 12: Combined Filter Application**
    - **Validates: Requirements 6.1**

  - [ ]* 7.3 Write property test for nutritional target filtering
    - **Property 13: Nutritional Target Filtering**
    - **Validates: Requirements 6.2, 6.3**

  - [ ]* 7.4 Write property test for recipe scoring monotonicity
    - **Property 14: Recipe Scoring Monotonicity**
    - **Validates: Requirements 6.5**

  - [ ]* 7.5 Write property test for nutritional information completeness
    - **Property 15: Nutritional Information Completeness**
    - **Validates: Requirements 7.1, 7.2**

  - [ ]* 7.6 Write property test for nutrition comparison accuracy
    - **Property 16: Nutrition Comparison Accuracy**
    - **Validates: Requirements 7.3**

  - [ ]* 7.7 Write unit tests for recommendation service
    - Test ingredient-only recommendations
    - Test health-profile-only recommendations
    - Test combined recommendations
    - Test empty result scenarios
    - Test scoring with various recipe qualities
    - _Requirements: 6.1-6.5, 7.1-7.3_

- [x] 8. Implement HealthProfileRepository
  - [x] 8.1 Create HealthProfileRepository class
    - Implement createProfile(userId, profile)
    - Implement getProfile(userId)
    - Implement updateProfile(userId, profile)
    - Add unit conversion helpers (cm/in, kg/lb)
    - Store calculated metrics with profile
    - _Requirements: 3.1-3.7, 8.3_

  - [ ]* 8.2 Write property test for health profile persistence
    - **Property 17: Health Profile Persistence Round-Trip**
    - **Validates: Requirements 8.3**

  - [ ]* 8.3 Write unit tests for repository operations
    - Test create, read, update operations
    - Test unit conversions
    - Test profile not found scenarios
    - Test duplicate userId handling
    - _Requirements: 3.1-3.7, 8.3_

- [x] 9. Checkpoint - Ensure all service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement backend API endpoints
  - [x] 10.1 Create POST /api/recipes/recommend endpoint
    - Accept RecipeRecommendationRequest body
    - Validate input (ingredients array, optional healthProfile)
    - Call RecipeRecommendationService
    - Return RecipeRecommendationResponse with categorized recipes
    - Add error handling for validation and service errors
    - _Requirements: 1.1-1.5, 2.1-2.3, 6.1-6.5, 7.1-7.3_

  - [x] 10.2 Create POST /api/health-profile endpoint
    - Accept CreateHealthProfileRequest body
    - Validate health profile data
    - Calculate nutrition metrics using NutritionCalculator
    - Store profile using HealthProfileRepository
    - Return CreateHealthProfileResponse with calculated metrics
    - Add error handling for validation and database errors
    - _Requirements: 3.1-3.7, 4.1-4.7_

  - [x] 10.3 Create GET /api/health-profile/:userId endpoint
    - Retrieve profile using HealthProfileRepository
    - Return GetHealthProfileResponse
    - Handle profile not found (404)
    - _Requirements: 3.1-3.7, 8.3_

  - [ ]* 10.4 Write integration tests for API endpoints
    - Test POST /api/recipes/recommend with various inputs
    - Test POST /api/health-profile with valid and invalid data
    - Test GET /api/health-profile for existing and non-existing users
    - Test error responses (400, 404, 500)
    - _Requirements: 1.1-1.5, 2.1-2.3, 3.1-3.7, 6.1-6.5_

- [x] 11. Implement frontend components
  - [x] 11.1 Create IngredientInputForm component
    - Add input field for ingredient entry
    - Display list of added ingredients with remove buttons
    - Validate non-empty ingredient input
    - Implement onSubmit handler to pass ingredients to parent
    - Add styling consistent with existing UI
    - _Requirements: 1.5_

  - [x] 11.2 Create HealthProfileForm component
    - Add input fields for age, gender, height, weight
    - Add unit selection dropdowns (cm/in, kg/lb)
    - Add allergy input with multi-entry capability
    - Add dietary goal selection dropdown
    - Add optional medical conditions field
    - Implement field validation (age > 0, height > 0, weight > 0)
    - Implement onSubmit handler to pass profile to parent
    - Add styling consistent with existing UI
    - _Requirements: 3.1-3.7_

  - [x] 11.3 Create RecipeDisplay component
    - Display recipes grouped by match type (exact/extended)
    - Show recipe name, ingredients, instructions
    - Display nutritional information (calories, protein, carbs, fat)
    - Highlight missing ingredients for extended matches
    - Show nutrition comparison to user targets (if available)
    - Add visual distinction between exact and extended matches
    - Add styling consistent with existing UI
    - _Requirements: 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 7.1, 7.2, 7.3_

  - [ ]* 11.4 Write unit tests for frontend components
    - Test IngredientInputForm: add/remove ingredients, validation, submit
    - Test HealthProfileForm: field validation, unit conversion, submit
    - Test RecipeDisplay: correct rendering of exact/extended matches, missing ingredients
    - _Requirements: 1.2-1.5, 2.1-2.3, 3.1-3.7, 7.1-7.3_

- [x] 12. Integrate frontend with backend
  - [x] 12.1 Create API client functions
    - Implement fetchRecipeRecommendations(ingredients, healthProfile?)
    - Implement createHealthProfile(userId, profile)
    - Implement getHealthProfile(userId)
    - Add error handling and loading states
    - _Requirements: 8.1, 8.2_

  - [x] 12.2 Wire components together in main app
    - Add IngredientInputForm to recipe search page
    - Add HealthProfileForm to user profile page
    - Connect RecipeDisplay to recommendation API
    - Implement state management for ingredients and health profile
    - Add loading indicators during API calls
    - Add error message display
    - _Requirements: 8.1, 8.2, 8.5_

  - [ ]* 12.3 Write end-to-end integration tests
    - Test ingredient-only flow: input ingredients → receive categorized recipes
    - Test health profile flow: create profile → request recipes → filtered by nutrition
    - Test combined flow: profile + ingredients → filtered and ranked recipes
    - Test profile update flow: update profile → new targets applied
    - _Requirements: 1.1-1.5, 2.1-2.3, 3.1-3.7, 6.1-6.5_

- [x] 13. Add error handling and edge cases
  - [x] 13.1 Implement comprehensive input validation
    - Add validation for all API endpoints
    - Add client-side validation for forms
    - Return appropriate error messages and status codes
    - _Requirements: 3.1-3.7_

  - [x] 13.2 Implement graceful degradation
    - Handle OpenAI API failures (fallback to database search)
    - Handle missing recipe nutrition data (exclude from results)
    - Handle empty result sets (return appropriate messages)
    - _Requirements: 8.4_

  - [ ] 13.3 Add error logging and monitoring
    - Log calculation errors
    - Log API failures
    - Log malformed data
    - Add monitoring for empty result rates
    - _Requirements: 8.1-8.5_

- [x] 14. Final checkpoint - Ensure all tests pass and integration works
  - [x] Run all unit tests
  - [ ]* Run all property-based tests
  - [ ]* Run all integration tests
  - [x] Test end-to-end flows manually
  - [x] Verify backward compatibility with existing features
  - [x] All core features implemented and ready for testing
  - [x] Backend services tested and working
  - [x] Sample recipes added to database
  - [x] API endpoints tested with curl
  - [x] Ready for frontend testing at http://localhost:5173

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests verify end-to-end functionality
- Checkpoints ensure incremental validation throughout implementation
