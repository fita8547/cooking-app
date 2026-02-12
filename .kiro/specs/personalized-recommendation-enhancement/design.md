# Design Document: Personalized Recommendation Enhancement

## Overview

This design enhances the existing Ad-hoc Cooking AI service with a comprehensive preference learning and personalized recommendation system. The system will collect user feedback through ratings, analyze historical meal data, identify cooking patterns, and generate intelligent recipe recommendations using both rule-based algorithms and OpenAI API integration.

The design integrates seamlessly with the existing React frontend, Node.js/Express backend, MongoDB database, and OpenAI API service. It extends current User, Recipe, and Meal models with new preference tracking capabilities and introduces a sophisticated recommendation engine.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (src/)                    │
│  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │ Rating Interface │  │  Recommendation Display         │ │
│  │  - Like/Dislike  │  │  - Personalized Recipes         │ │
│  │  - 1-5 Stars     │  │  - Similar Recipe Suggestions   │ │
│  └──────────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Express Backend (server/)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Preference API Routes                    │  │
│  │  - POST /api/preferences/rate                        │  │
│  │  - GET  /api/preferences/user/:userId                │  │
│  │  - DELETE /api/preferences/:id                       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Recommendation API Routes                   │  │
│  │  - GET /api/recommendations/personalized             │  │
│  │  - GET /api/recommendations/similar/:recipeId        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Recommendation Engine                      │  │
│  │  - Preference Analyzer                               │  │
│  │  - Pattern Detector                                  │  │
│  │  - Score Calculator                                  │  │
│  │  - OpenAI Integration                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
         ┌──────────────────┐  ┌──────────────┐
         │  MongoDB Models  │  │  OpenAI API  │
         │  - Preference    │  │  - GPT-4     │
         │  - User (ext.)   │  │              │
         │  - Recipe        │  │              │
         │  - Meal (ext.)   │  │              │
         └──────────────────┘  └──────────────┘
```

### Data Flow

1. **Rating Collection**: User rates recipe → Frontend sends rating → Backend stores in Preference model → Updates User preferences
2. **Preference Analysis**: Backend analyzes Meal and Preference history → Calculates ingredient affinities and cooking patterns
3. **Recommendation Generation**: 
   - Backend retrieves user preferences and patterns
   - Calculates rule-based scores for candidate recipes
   - Optionally enhances with OpenAI API for contextual recommendations
   - Returns ranked recipe list to frontend
4. **Feedback Loop**: User interactions with recommendations → New ratings → Updated preferences → Improved future recommendations

## Components and Interfaces

### 1. Preference Model (MongoDB Schema)

```javascript
{
  userId: ObjectId,              // Reference to User
  recipeId: ObjectId,            // Reference to Recipe (optional)
  mealId: ObjectId,              // Reference to Meal (optional)
  ratingType: String,            // 'like', 'dislike', 'star'
  ratingValue: Number,           // 1-5 for star ratings, 1/-1 for like/dislike
  ingredients: [String],         // Ingredients in the rated recipe
  cuisineType: String,           // Cuisine category
  difficulty: String,            // Recipe difficulty
  cookingTime: Number,           // Time in minutes
  context: {
    mealType: String,            // 'breakfast', 'lunch', 'dinner', 'snack'
    dayOfWeek: Number,           // 0-6
    timeOfDay: String            // 'morning', 'afternoon', 'evening'
  },
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Extended User Model

Add to existing User schema:

```javascript
preferences: {
  favoriteRecipes: [ObjectId],           // Existing
  dislikedIngredients: [String],         // Existing
  ingredientAffinities: [{               // NEW
    ingredient: String,
    score: Number,                       // -1.0 to 1.0
    confidence: Number,                  // 0.0 to 1.0
    lastUpdated: Date
  }],
  cuisinePreferences: [{                 // NEW
    cuisine: String,
    score: Number,
    count: Number
  }],
  cookingPatterns: {                     // NEW
    preferredDifficulty: String,
    averageCookingTime: Number,
    preferredMealTimes: {
      breakfast: [String],               // Preferred recipe types
      lunch: [String],
      dinner: [String],
      snack: [String]
    },
    weekdayVsWeekend: {
      weekday: { avgTime: Number, difficulty: String },
      weekend: { avgTime: Number, difficulty: String }
    }
  },
  recommendationMetrics: {               // NEW
    totalRecommendations: Number,
    acceptedRecommendations: Number,
    acceptanceRate: Number,
    lastCalculated: Date
  }
}
```

### 3. Extended Meal Model

Add to existing Meal schema:

```javascript
{
  // ... existing fields ...
  rating: Number,                        // Existing (1-5)
  preferenceId: ObjectId,                // NEW - Reference to Preference
  wasRecommended: Boolean,               // NEW - Track if from recommendations
  recommendationScore: Number            // NEW - Original recommendation score
}
```

### 4. Preference Service

```javascript
class PreferenceService {
  // Create or update a rating
  async rateRecipe(userId, recipeId, ratingType, ratingValue, context)
  
  // Get user's preference history
  async getUserPreferences(userId, filters)
  
  // Delete a specific rating
  async deleteRating(userId, preferenceId)
  
  // Reset all user preferences
  async resetUserPreferences(userId)
  
  // Calculate ingredient affinity scores
  async calculateIngredientAffinities(userId)
  
  // Update user preference summary
  async updatePreferenceSummary(userId)
}
```

### 5. Recommendation Engine

```javascript
class RecommendationEngine {
  // Generate personalized recommendations
  async generatePersonalizedRecommendations(userId, availableIngredients, context, limit)
  
  // Find similar recipes to a liked recipe
  async findSimilarRecipes(recipeId, userId, limit)
  
  // Calculate preference score for a recipe
  async calculatePreferenceScore(userId, recipe)
  
  // Analyze cooking patterns
  async analyzeCookingPatterns(userId)
  
  // Handle cold start (new users)
  async generateColdStartRecommendations(userId, limit)
  
  // Generate OpenAI-enhanced recommendations
  async generateAIRecommendations(userId, preferences, context)
}
```

### 6. Pattern Analyzer

```javascript
class PatternAnalyzer {
  // Detect cuisine preferences from history
  detectCuisinePreferences(meals, preferences)
  
  // Detect difficulty preferences
  detectDifficultyPreferences(meals, preferences)
  
  // Detect time-based patterns
  detectTimePatterns(meals)
  
  // Calculate ingredient co-occurrence
  calculateIngredientCooccurrence(meals, preferences)
  
  // Detect serving size patterns
  detectServingSizePatterns(meals)
}
```

### 7. Score Calculator

```javascript
class ScoreCalculator {
  // Calculate overall preference score
  calculatePreferenceScore(recipe, userPreferences, patterns)
  
  // Calculate ingredient match score
  calculateIngredientScore(recipeIngredients, ingredientAffinities)
  
  // Calculate cuisine match score
  calculateCuisineScore(recipeCuisine, cuisinePreferences)
  
  // Calculate difficulty match score
  calculateDifficultyScore(recipeDifficulty, preferredDifficulty)
  
  // Calculate time match score
  calculateTimeScore(recipeCookingTime, context, patterns)
  
  // Calculate similarity score between recipes
  calculateSimilarityScore(recipe1, recipe2)
  
  // Normalize and combine scores
  combineScores(scores, weights)
}
```

### 8. API Endpoints

#### Preference Endpoints

```
POST   /api/preferences/rate
Body: { recipeId, mealId, ratingType, ratingValue, context }
Response: { success, preference, updatedAffinities }

GET    /api/preferences/user/:userId
Query: { limit, offset, ratingType }
Response: { preferences: [...], total }

DELETE /api/preferences/:preferenceId
Response: { success, message }

POST   /api/preferences/reset
Response: { success, message }
```

#### Recommendation Endpoints

```
GET    /api/recommendations/personalized
Query: { ingredients, mealType, limit }
Response: { recommendations: [...], scores: [...] }

GET    /api/recommendations/similar/:recipeId
Query: { limit }
Response: { similarRecipes: [...], scores: [...] }

GET    /api/recommendations/patterns
Response: { patterns: {...}, affinities: [...] }
```

## Data Models

### Preference Score Calculation

The preference score for a recipe is calculated as a weighted combination of multiple factors:

```
PreferenceScore = w1 × IngredientScore 
                + w2 × CuisineScore 
                + w3 × DifficultyScore 
                + w4 × TimeScore 
                + w5 × NutritionScore 
                + w6 × NoveltyScore

Where:
- w1 = 0.35 (ingredient affinity weight)
- w2 = 0.20 (cuisine preference weight)
- w3 = 0.15 (difficulty match weight)
- w4 = 0.15 (time context weight)
- w5 = 0.10 (nutrition alignment weight)
- w6 = 0.05 (novelty/diversity weight)
```

### Ingredient Affinity Score

```
IngredientAffinity(ingredient) = (ΣRatings × RecencyWeight) / TotalRatings

Where:
- ΣRatings: Sum of all ratings for recipes containing the ingredient
- RecencyWeight: Exponential decay based on rating age (more recent = higher weight)
- TotalRatings: Number of ratings involving the ingredient
- Range: -1.0 (strongly disliked) to +1.0 (strongly liked)
```

### Recipe Similarity Score

```
SimilarityScore(R1, R2) = α × IngredientOverlap 
                        + β × CuisineMatch 
                        + γ × DifficultyMatch 
                        + δ × TimeProximity

Where:
- IngredientOverlap = |R1.ingredients ∩ R2.ingredients| / |R1.ingredients ∪ R2.ingredients|
- CuisineMatch = 1 if same cuisine, 0 otherwise
- DifficultyMatch = 1 - |R1.difficulty - R2.difficulty| / maxDifficulty
- TimeProximity = 1 - |R1.cookingTime - R2.cookingTime| / maxTime
- α = 0.50, β = 0.25, γ = 0.15, δ = 0.10
```

### Cold Start Strategy

For users with insufficient preference data:

```
ColdStartScore = 0.4 × HealthProfileMatch 
               + 0.3 × PopularityScore 
               + 0.2 × DiversityScore 
               + 0.1 × SeasonalRelevance

Where:
- HealthProfileMatch: Alignment with user's health goals and restrictions
- PopularityScore: Recipe's overall rating across all users
- DiversityScore: Ensures variety across cuisine types
- SeasonalRelevance: Preference for seasonal ingredients
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified several opportunities to consolidate redundant properties:

**Consolidations:**
1. Properties 2.1 and 1.5 both test data schema completeness - can be combined into one comprehensive schema validation property
2. Properties 4.6 and 4.7 (score existence and ordering) can be combined - if all items are ordered by score, they must have scores
3. Properties 5.2 and 5.5 (similarity score calculation and ordering) can be combined similarly
4. Properties 3.2, 3.3, 3.4 (cuisine, difficulty, time pattern detection) all test pattern detection correctness - can use one property with multiple pattern types
5. Properties 6.1, 6.2, 6.3 (meal time, duration, weekday patterns) are all temporal pattern detection - can be consolidated
6. Properties 10.1, 10.2, 10.3 (view, delete individual, delete all) are CRUD operations - can be tested with fewer properties focusing on data consistency

**Unique Properties Retained:**
- Round-trip properties (1.3, 7.4)
- Filtering properties (4.2, 5.4)
- Constraint satisfaction (4.5)
- Authorization (10.5)
- Cold start diversity (9.4, 9.5)

### Correctness Properties

Property 1: Rating persistence round-trip
*For any* valid rating submission (user, recipe, rating value, context), storing the rating and then querying for it should return an equivalent rating object with all fields preserved.
**Validates: Requirements 1.3**

Property 2: Rating update consistency
*For any* existing rating, updating its value should result in the stored rating reflecting the new value and all dependent scores (ingredient affinities, cuisine preferences) being recalculated to reflect the change.
**Validates: Requirements 1.4**

Property 3: Preference data schema completeness
*For any* stored preference record, it must contain all required fields: userId, recipeId (or mealId), ratingType, ratingValue, ingredients array, cuisineType, difficulty, cookingTime, context object, and timestamp.
**Validates: Requirements 1.5, 2.1**

Property 4: Ingredient affinity derivation
*For any* recipe rating, the system should update ingredient affinity scores for all ingredients in that recipe, such that ingredients in highly-rated recipes have positive affinities and ingredients in low-rated recipes have negative affinities.
**Validates: Requirements 2.2**

Property 5: Preference history retention
*For any* preference update or deletion, the previous state should remain retrievable in the preference history, ensuring a complete audit trail of all preference changes.
**Validates: Requirements 2.3**

Property 6: Referential integrity
*For any* stored preference record, all referenced IDs (userId, recipeId, mealId) must exist in their respective collections, ensuring no orphaned preference data.
**Validates: Requirements 2.4**

Property 7: Pattern detection accuracy
*For any* meal history, detected patterns (frequent ingredients, cuisine preferences, difficulty preferences, time-based patterns) should accurately reflect the statistical distribution in the history data, with the most common values identified as preferences.
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

Property 8: Ingredient affinity calculation correctness
*For any* set of ratings involving an ingredient, the calculated affinity score should be proportional to the average rating value, weighted by recency, with more recent ratings having greater influence.
**Validates: Requirements 3.5**

Property 9: Ingredient-based recommendation prioritization
*For any* recommendation set and user with ingredient affinities, recipes containing highly-rated ingredients (affinity > 0.5) should have higher preference scores than recipes with neutral or low-rated ingredients.
**Validates: Requirements 4.1**

Property 10: Disliked ingredient exclusion
*For any* recommendation set and any ingredient marked as disliked (affinity < -0.5 or in dislikedIngredients list), no recommended recipe should contain that ingredient.
**Validates: Requirements 4.2**

Property 11: Cuisine preference weighting
*For any* recommendation set and user with cuisine preferences, recipes matching preferred cuisines (score > 0.6) should have higher preference scores than recipes from non-preferred cuisines.
**Validates: Requirements 4.3**

Property 12: Difficulty level matching
*For any* recommendation set and user with a preferred difficulty level, the majority of recommended recipes should match or be within one level of the user's preferred difficulty.
**Validates: Requirements 4.4**

Property 13: Dietary restriction compliance
*For any* recommendation and any dietary restriction in the user's health profile (allergies, diseases), the recipe must not contain restricted ingredients or violate dietary constraints.
**Validates: Requirements 4.5**

Property 14: Recommendation ranking by score
*For any* recommendation list, recipes must be ordered by preference score in descending order, such that for all adjacent pairs (recipe_i, recipe_{i+1}), score_i >= score_{i+1}.
**Validates: Requirements 4.6, 4.7**

Property 15: Similar recipe ingredient overlap
*For any* pair of recipes identified as similar, the ingredient overlap ratio (intersection / union) should exceed 0.3, ensuring meaningful similarity.
**Validates: Requirements 5.1, 5.2**

Property 16: Similar recipe multi-factor similarity
*For any* pair of recipes identified as similar, they should share at least one of: cuisine type, cooking method, or difficulty level, in addition to ingredient overlap.
**Validates: Requirements 5.3**

Property 17: Negative rating exclusion from similar recipes
*For any* similar recipe set for a liked recipe, no recipe that the user has rated negatively (rating < 3 or dislike) should appear in the results.
**Validates: Requirements 5.4**

Property 18: Similar recipe ranking by similarity
*For any* similar recipe list, recipes must be ordered by similarity score in descending order, such that for all adjacent pairs, similarity_i >= similarity_{i+1}.
**Validates: Requirements 5.5**

Property 19: Temporal pattern detection accuracy
*For any* meal history, detected temporal patterns (preferred meal times, cooking duration ranges, weekday vs weekend preferences) should accurately reflect the time-based distribution in the history, with statistical significance.
**Validates: Requirements 6.1, 6.2, 6.3**

Property 20: Context-aware recommendation adjustment
*For any* recommendation request with temporal context (time of day, day of week), recipes matching the user's historical patterns for that context should receive higher scores than recipes that don't match the context.
**Validates: Requirements 6.4**

Property 21: Serving size preference matching
*For any* recommendation set and user with serving size history, the majority of recommended recipes should have serving sizes within ±1 of the user's median serving size preference.
**Validates: Requirements 6.5**

Property 22: OpenAI prompt completeness
*For any* OpenAI API call for personalized recommendations, the prompt must include ingredient affinities, cuisine preferences, cooking patterns, and dietary restrictions from the user's profile.
**Validates: Requirements 7.2**

Property 23: OpenAI response parsing round-trip
*For any* valid OpenAI API response containing recipe data, parsing the response should produce valid recipe objects that conform to the Recipe schema, with all required fields present.
**Validates: Requirements 7.4**

Property 24: Immediate affinity score updates
*For any* rating submission, querying ingredient affinity scores immediately after should reflect the new rating's influence on the scores for all ingredients in the rated recipe.
**Validates: Requirements 8.1**

Property 25: Recommendation acceptance tracking
*For any* recommended recipe that gets cooked (meal logged with wasRecommended=true), the user's recommendation acceptance count should increase and the acceptance rate should be recalculated.
**Validates: Requirements 8.3**

Property 26: Rolling window preference filtering
*For any* preference query with a time window (e.g., last 30 days), only preferences with timestamps within that window should be returned, ensuring recency-based analysis.
**Validates: Requirements 8.5**

Property 27: Cold start recommendation diversity
*For any* user with fewer than 5 ratings, recommendation sets should include recipes from at least 3 different cuisine types and span at least 2 difficulty levels, ensuring diverse preference learning.
**Validates: Requirements 9.4, 9.5**

Property 28: User preference data isolation
*For any* preference query by user A, the results must only include preferences where userId equals A's ID, ensuring no cross-user data leakage.
**Validates: Requirements 10.5**

Property 29: Preference deletion consistency
*For any* preference deletion (individual or bulk reset), subsequent queries for that preference should return no results, and subsequent recommendations should not reflect the deleted preference data.
**Validates: Requirements 10.2, 10.3, 10.4**

Property 30: Complete preference data retrieval
*For any* user, querying all their preferences should return every preference record where userId matches, with no omissions, ensuring complete data access.
**Validates: Requirements 10.1**

## Error Handling

### Error Categories and Responses

1. **Invalid Rating Data**
   - Missing required fields (userId, recipeId, ratingValue)
   - Invalid rating values (outside 1-5 range for stars, not ±1 for like/dislike)
   - Non-existent recipe or user references
   - Response: 400 Bad Request with detailed validation errors

2. **Database Errors**
   - Connection failures
   - Write conflicts
   - Query timeouts
   - Response: 500 Internal Server Error, retry with exponential backoff

3. **OpenAI API Errors**
   - API key invalid or expired
   - Rate limit exceeded
   - Timeout or network errors
   - Malformed responses
   - Response: Fall back to rule-based recommendations, log error for monitoring

4. **Authorization Errors**
   - Unauthenticated requests
   - Attempting to access other users' preference data
   - Response: 401 Unauthorized or 403 Forbidden

5. **Insufficient Data Errors**
   - User has no meal history for pattern analysis
   - No recipes match user's strict constraints
   - Response: Return cold start recommendations with appropriate messaging

6. **Calculation Errors**
   - Division by zero in score calculations
   - Invalid numerical operations
   - Response: Use default/fallback scores, log error

### Error Recovery Strategies

- **Graceful Degradation**: If OpenAI API fails, fall back to rule-based recommendations
- **Partial Results**: If some score calculations fail, return recommendations with available scores
- **Default Values**: Use sensible defaults for missing preference data (neutral affinity = 0.0)
- **Retry Logic**: Implement exponential backoff for transient database/API errors
- **User Feedback**: Provide clear error messages explaining why recommendations might be limited

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of rating submissions and updates
- Edge cases (empty meal history, single rating, extreme values)
- Error conditions (invalid data, missing references, API failures)
- Integration points (API endpoints, database operations)
- Cold start scenarios (new users, limited data)

**Property-Based Tests** focus on:
- Universal properties across all inputs (30 properties defined above)
- Comprehensive input coverage through randomization
- Invariants that must hold regardless of data
- Round-trip properties (store/retrieve, parse/format)
- Ordering and filtering correctness

### Property-Based Testing Configuration

**Framework**: Use `fast-check` for JavaScript/Node.js property-based testing

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `Feature: personalized-recommendation-enhancement, Property {number}: {property_text}`

**Example Property Test Structure**:

```javascript
// Feature: personalized-recommendation-enhancement, Property 1: Rating persistence round-trip
test('Property 1: Rating persistence round-trip', async () => {
  await fc.assert(
    fc.asyncProperty(
      arbitraryUserId(),
      arbitraryRecipeId(),
      arbitraryRating(),
      arbitraryContext(),
      async (userId, recipeId, rating, context) => {
        // Store rating
        const stored = await preferenceService.rateRecipe(
          userId, recipeId, rating.type, rating.value, context
        );
        
        // Retrieve rating
        const retrieved = await preferenceService.getUserPreferences(
          userId, { preferenceId: stored._id }
        );
        
        // Assert equivalence
        expect(retrieved[0]).toMatchObject({
          userId, recipeId,
          ratingType: rating.type,
          ratingValue: rating.value,
          context
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Data Generators

Create generators for:
- Random user IDs (existing users)
- Random recipe IDs (existing recipes)
- Random ratings (types and values)
- Random ingredient lists
- Random meal histories
- Random preference profiles
- Random temporal contexts

### Integration Testing

- Test complete recommendation flow: rating → analysis → recommendation → feedback
- Test OpenAI integration with mock API responses
- Test database operations with test database
- Test API endpoints with supertest
- Test authentication and authorization

### Performance Testing

While not part of property-based testing, monitor:
- Recommendation generation time (target: < 500ms for rule-based, < 2s with OpenAI)
- Database query performance (ensure indexes are effective)
- Memory usage during pattern analysis
- API response times under load

### Test Coverage Goals

- Unit test coverage: > 80% of service and utility functions
- Property test coverage: All 30 correctness properties implemented
- Integration test coverage: All API endpoints and critical flows
- Edge case coverage: Cold start, empty data, extreme values, API failures
