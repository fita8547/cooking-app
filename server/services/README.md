# Services Directory

This directory contains business logic services for the user onboarding and navigation flow.

## Services

### AuthenticationService
Handles user authentication, registration, and session management.
- `login(email, password)` - Authenticate user with credentials
- `register(email, password, name)` - Register new user
- `checkSession(token)` - Check if user has active session
- `restoreSession(token)` - Restore session from stored token
- `logout()` - End user session

### OnboardingService
Manages onboarding flow state and health information collection.
- `getOnboardingStatus(userId)` - Get current onboarding status
- `completeOnboarding(userId)` - Mark onboarding as complete
- `saveHealthInformation(userId, healthInfo)` - Save health information
- `skipHealthInformation(userId)` - Skip health information step
- `hasHealthInformation(userId)` - Check if health information was provided

### HealthInformationRepository
Persists and retrieves health information.
- `save(userId, healthInfo)` - Save health information
- `get(userId)` - Retrieve health information
- `update(userId, healthInfo)` - Update health information
- `exists(userId)` - Check if health information exists
- `delete(userId)` - Delete health information
- `getHealthGoalSummary(userId)` - Get health goal summary for display

### IngredientRepository
Manages user's ingredient inventory.
- `getIngredientCount(userId)` - Get count of ingredients in user's fridge
- `getIngredients(userId)` - Get all ingredients for user
- `addIngredient(userId, ingredient)` - Add ingredient to user's fridge
- `removeIngredient(userId, ingredientId)` - Remove ingredient from user's fridge
- `updateIngredient(userId, ingredientId, quantity)` - Update ingredient quantity

## Testing

All services should have corresponding test files in `server/tests/`:
- Unit tests for specific examples and edge cases
- Property-based tests for universal correctness properties (minimum 100 iterations)

## Error Handling

All services return a consistent response format:
```javascript
{
  success: boolean,
  data?: any,
  error?: string
}
```

Error codes:
- `InvalidCredentials` - Invalid email or password
- `UserAlreadyExists` - User with email already exists
- `ServerError` - Internal server error
- `InvalidToken` - Invalid or malformed token
- `ExpiredSession` - Session token has expired
- `StatusNotFound` - Onboarding status not found
- `SaveFailed` - Failed to save data
- `UpdateFailed` - Failed to update data
- `RetrieveFailed` - Failed to retrieve data
- `DeleteFailed` - Failed to delete data
- `CheckFailed` - Failed to check existence
