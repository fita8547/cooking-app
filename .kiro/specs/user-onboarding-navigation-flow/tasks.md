# Implementation Plan: User Onboarding and Navigation Flow

## Overview

This implementation plan breaks down the user onboarding and navigation flow into discrete coding tasks. The approach follows an incremental development pattern, building core services first, then implementing the onboarding flow, navigation system, and finally integrating with existing features. Each task builds on previous work to ensure no orphaned code.

## Tasks

- [x] 1. Set up project structure and core data models
  - Create directory structure for services, models, and utilities
  - Define User, OnboardingStatus, HealthInformation, and NavigationState models in JavaScript
  - Set up testing framework (Jest) and property-based testing library (fast-check)
  - Create configuration for test execution (minimum 100 iterations for property tests)
  - _Requirements: 1.1, 2.1, 4.1, 6.1_

- [ ] 2. Implement Authentication Service
  - [x] 2.1 Create AuthenticationService with login, register, and session management methods
    - Implement login(email, password) with credential validation
    - Implement register(email, password, name) with user creation
    - Implement checkSession() and restoreSession(token) for session management
    - Implement logout() to clear session
    - Use JWT or similar for session tokens
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x]* 2.2 Write property test for valid credentials authentication
    - **Property 1: Valid credentials grant access**
    - **Validates: Requirements 1.1**
  
  - [x]* 2.3 Write property test for invalid credentials rejection
    - **Property 2: Invalid credentials deny access**
    - **Validates: Requirements 1.2**
  
  - [x]* 2.4 Write property test for registration and onboarding initiation
    - **Property 3: Registration creates account and initiates onboarding**
    - **Validates: Requirements 1.3**
  
  - [x]* 2.5 Write property test for session persistence
    - **Property 4: Session persistence across app restarts**
    - **Validates: Requirements 1.4**
  
  - [x]* 2.6 Write unit tests for authentication edge cases
    - Test network failure during authentication (Requirement 1.5)
    - Test malformed credentials
    - Test session expiration handling
    - _Requirements: 1.5_

- [ ] 3. Implement Health Information Repository
  - [x] 3.1 Create HealthInformationRepository with CRUD operations
    - Implement save(userId, healthInfo) for persisting health data
    - Implement get(userId) for retrieving health data
    - Implement update(userId, healthInfo) for updating health data
    - Implement exists(userId) to check if health info exists
    - Use appropriate storage mechanism (database or local storage)
    - _Requirements: 2.3, 2.5, 4.5, 5.1_
  
  - [ ]* 3.2 Write property test for health information persistence
    - **Property 7: Health information collection and persistence**
    - **Validates: Requirements 2.3, 2.5**
  
  - [ ]* 3.3 Write property test for health information updates
    - **Property 23: Health information updates propagate immediately**
    - **Validates: Requirements 5.5, 4.5**
  
  - [ ]* 3.4 Write unit tests for health information edge cases
    - Test empty health information
    - Test very long lists of restrictions/allergies
    - Test data persistence failure (Requirement 8.3)
    - _Requirements: 8.3_

- [ ] 4. Implement Onboarding Service
  - [x] 4.1 Create OnboardingService with status tracking and health info management
    - Implement getOnboardingStatus(userId) to retrieve status
    - Implement completeOnboarding(userId) to mark completion
    - Implement saveHealthInformation(userId, healthInfo) to save health data
    - Implement skipHealthInformation(userId) to skip and set flag
    - Implement hasHealthInformation(userId) to check if provided
    - Integrate with HealthInformationRepository
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2_
  
  - [ ]* 4.2 Write property test for new users seeing health info screen
    - **Property 5: New users see health information screen**
    - **Validates: Requirements 2.1**
  
  - [ ]* 4.3 Write property test for skip functionality
    - **Property 6: Skip functionality navigates to Home Hub**
    - **Validates: Requirements 2.2, 2.4**
  
  - [ ]* 4.4 Write property test for onboarding completion persistence
    - **Property 8: Onboarding completion persistence**
    - **Validates: Requirements 4.1, 4.2, 4.3**
  
  - [ ]* 4.5 Write property test for incomplete onboarding resumption
    - **Property 9: Incomplete onboarding resumption**
    - **Validates: Requirements 4.4**
  
  - [ ]* 4.6 Write unit tests for onboarding edge cases
    - Test network failure during onboarding (Requirement 8.1)
    - Test partial progress saving
    - Test onboarding resumption from various incomplete states
    - _Requirements: 8.1_

- [x] 5. Checkpoint - Ensure core services tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Navigation Service
  - [ ] 6.1 Create NavigationService with routing and state management
    - Implement navigateTo(screen, params) for screen navigation
    - Implement goBack() for back navigation
    - Implement getCurrentScreen() to get current screen
    - Implement getHistory() to retrieve navigation history
    - Implement clearHistory() for logout
    - Implement canGoBack() to check if back navigation is possible
    - Maintain NavigationState with current screen, history, and params
    - _Requirements: 3.3, 3.4, 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 6.2 Write property test for navigation state preservation
    - **Property 18: Navigation state preservation**
    - **Validates: Requirements 3.11, 6.1**
  
  - [ ]* 6.3 Write property test for back navigation correctness
    - **Property 19: Back navigation correctness**
    - **Validates: Requirements 6.2**
  
  - [ ]* 6.4 Write property test for navigation history maintenance
    - **Property 20: Navigation history maintenance**
    - **Validates: Requirements 6.3**
  
  - [ ]* 6.5 Write property test for logout clearing navigation state
    - **Property 21: Logout clears navigation state**
    - **Validates: Requirements 6.4**
  
  - [ ]* 6.6 Write property test for app lifecycle state restoration
    - **Property 22: App lifecycle state restoration**
    - **Validates: Requirements 6.5**
  
  - [ ]* 6.7 Write unit tests for navigation edge cases
    - Test rapid navigation actions
    - Test invalid navigation states
    - Test navigation with missing params
    - _Requirements: 8.2_

- [ ] 7. Implement Onboarding Flow Controller
  - [ ] 7.1 Create OnboardingFlowController to orchestrate onboarding
    - Implement getNextScreenAfterLogin(userId) to determine next screen
    - Implement submitHealthInfo(userId, healthInfo) to handle submission
    - Implement skipHealthInfo(userId) to handle skip action
    - Implement shouldShowOnboarding(userId) to check if onboarding needed
    - Integrate with OnboardingService and NavigationService
    - _Requirements: 2.1, 2.2, 3.1, 4.3, 4.4_
  
  - [ ]* 7.2 Write property test for Home Hub display after onboarding
    - **Property 10: Home Hub displays after onboarding**
    - **Validates: Requirements 3.1**
  
  - [ ]* 7.3 Write integration tests for complete onboarding flow
    - Test login → health info → home hub flow
    - Test login → skip → home hub flow
    - Test returning user → home hub flow
    - _Requirements: 2.1, 2.2, 3.1, 4.3_

- [ ] 8. Implement Home Hub Controller and Ingredient Repository
  - [x] 8.1 Create IngredientRepository for ingredient count retrieval
    - Implement getIngredientCount(userId) to retrieve count from storage
    - Implement getIngredients(userId) for full ingredient list
    - Implement addIngredient, removeIngredient, updateIngredient methods
    - Use appropriate storage mechanism (database or local storage)
    - _Requirements: 3.3, 3.11_
  
  - [ ] 8.2 Create HomeHubController for hub functionality
    - Implement getUserInfo(userId) to get display information
    - Implement getHomeScreenData(userId) to fetch all Hero section data
    - Implement getIngredientCount(userId) for Hero section
    - Implement getHealthGoalSummary(userId) for Hero section
    - Implement formatGreeting(userName) to format personalized greeting
    - Implement navigateToMyFridge() for fridge navigation
    - Implement navigateToRecipeRecommendation() for recipe navigation
    - Implement navigateToMealLogging() for meal logging navigation
    - Implement isPersonalizationAvailable(userId) to check health info status
    - Integrate with NavigationService, OnboardingService, and IngredientRepository
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 5.4_
  
  - [ ]* 8.3 Write property test for Home Hub navigation options
    - **Property 11: Home Hub contains required navigation options**
    - **Validates: Requirements 3.7**
  
  - [ ]* 8.4 Write property test for feature navigation correctness
    - **Property 12: Feature navigation correctness**
    - **Validates: Requirements 3.8, 3.9, 3.10**
  
  - [ ]* 8.5 Write property test for Hero section greeting personalization
    - **Property 13: Hero section greeting personalization**
    - **Validates: Requirements 3.2**
  
  - [ ]* 8.6 Write property test for ingredient count display accuracy
    - **Property 14: Ingredient count display accuracy**
    - **Validates: Requirements 3.3**
  
  - [ ]* 8.7 Write property test for health goal reference conditional display
    - **Property 15: Health goal reference conditional display**
    - **Validates: Requirements 3.4, 3.5**
  
  - [ ]* 8.8 Write property test for CTA button navigation
    - **Property 16: CTA button navigation**
    - **Validates: Requirements 3.6**
  
  - [ ]* 8.9 Write property test for ingredient count updates on return
    - **Property 17: Ingredient count updates on return**
    - **Validates: Requirements 3.11**
  
  - [ ]* 8.10 Write unit tests for Home Hub specific scenarios
    - Test navigation to My Fridge with specific user
    - Test navigation to Recipe Recommendations with specific user
    - Test navigation to Meal Logging with specific user
    - Test Hero section display with and without health information
    - Test ingredient count display with 0, 1, and multiple ingredients
    - Test greeting formatting with various user names
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [x] 9. Checkpoint - Ensure navigation and controller tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement UI components for Login screen
  - [x] 10.1 Create Login component with form and validation
    - Build login form with email and password fields
    - Implement form validation (email format, required fields)
    - Integrate with AuthenticationService for login
    - Add registration link/button
    - Display error messages in Korean
    - Handle loading states during authentication
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 7.1, 8.2_
  
  - [ ]* 10.2 Write unit tests for Login component
    - Test form validation
    - Test error message display in Korean
    - Test loading states
    - _Requirements: 1.1, 1.2, 7.1_

- [ ] 11. Implement UI components for Quick Health Info screen
  - [x] 11.1 Create QuickHealthInfo component with form and skip option
    - Build form for dietary restrictions (checkboxes/multi-select)
    - Build form for allergies with severity selection
    - Build form for health goals (checkboxes/multi-select)
    - Add prominent skip button
    - Implement form validation
    - Integrate with OnboardingFlowController
    - Display all text in Korean
    - Ensure touch targets meet minimum size (44x44 points)
    - Auto-save partial progress for network failure recovery
    - _Requirements: 2.2, 2.3, 2.6, 7.1, 7.4, 8.1_
  
  - [ ]* 11.2 Write property test for touch target size compliance
    - **Property 29: Touch target size compliance**
    - **Validates: Requirements 7.4**
  
  - [ ]* 11.3 Write unit tests for QuickHealthInfo component
    - Test skip button functionality
    - Test form submission with valid data
    - Test form validation errors
    - Test auto-save on network failure
    - Test Korean text display (Requirement 7.3)
    - _Requirements: 2.2, 2.3, 7.1, 8.1_

- [ ] 12. Implement UI components for Home Hub screen
  - [x] 12.1 Create Hero Section component with personalized content
    - Display personalized greeting: "{사용자명}님, 오늘의 한 끼 준비됐나요?"
    - Display ingredient count: "냉장고 재료 {N}개로"
    - Display health goal reference: "건강 목표에 맞춰 추천해드릴게요." (conditional)
    - Create primary CTA button: "🍳 지금 추천받기"
    - Implement CTA button click handler to navigate to Recipe Recommendation
    - Fetch ingredient count from IngredientRepository
    - Fetch health goal status from HealthInformationRepository
    - Handle fallback text when data unavailable
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 7.1_
  
  - [x] 12.2 Create Feature Cards component with navigation options
    - Create "우리집 냉장고 관리" card with navigation to Fridge Feature
    - Create "식사 기록" card with navigation to Meal Logging Feature
    - Implement card click handlers via HomeHubController
    - Ensure touch targets meet minimum size (44x44 points)
    - Use grid layout for responsive design
    - _Requirements: 3.7, 3.8, 3.10, 7.3, 7.4_
  
  - [x] 12.3 Wire Hero Section and Feature Cards into complete HomeHub component
    - Combine Hero Section and Feature Cards into single HomeHub layout
    - Implement data fetching on component mount
    - Implement data refresh when returning from features
    - Handle loading and error states
    - Ensure all text is in Korean
    - _Requirements: 3.1, 3.11, 7.1_
  
  - [ ]* 12.4 Write property test for Korean language display
    - **Property 28: Korean language display**
    - **Validates: Requirements 7.1**
  
  - [ ]* 12.5 Write unit tests for HomeHub component
    - Test Hero section with user name "예송" displays "예송님, 오늘의 한 끼 준비됐나요?"
    - Test Hero section with 8 ingredients displays "냉장고 재료 8개로"
    - Test Hero section with 0 ingredients displays "냉장고 재료로"
    - Test Hero section with health goals displays "건강 목표에 맞춰 추천해드릴게요."
    - Test Hero section without health goals displays "맞춤 추천해드릴게요."
    - Test CTA button "🍳 지금 추천받기" click navigates to Recipe Recommendation
    - Test "우리집 냉장고 관리" card click navigates to Fridge Management
    - Test "식사 기록" card click navigates to Meal Logging
    - Test display of specific Korean terminology (Requirement 7.3)
    - Test ingredient count refresh when returning from Fridge Feature
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.10, 3.11, 7.3_

- [ ] 13. Integrate health information with recipe recommendation system
  - [ ] 13.1 Create integration layer for health-based filtering
    - Implement function to retrieve health information for user
    - Implement recipe filtering logic based on dietary restrictions
    - Implement recipe filtering logic based on allergies
    - Ensure filtered recipes exclude conflicting ingredients
    - Add personalization indicator to recommendation results
    - Provide general recommendations when health info not available
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 13.2 Write property test for health information availability
    - **Property 23: Health information availability for recommendations**
    - **Validates: Requirements 5.1**
  
  - [ ]* 13.3 Write property test for recipe filtering
    - **Property 24: Recipe filtering based on health information**
    - **Validates: Requirements 5.2**
  
  - [ ]* 13.4 Write property test for general recommendations
    - **Property 25: General recommendations for users without health info**
    - **Validates: Requirements 5.3**
  
  - [ ]* 13.5 Write property test for personalization indicator
    - **Property 26: Personalization indicator accuracy**
    - **Validates: Requirements 5.4**
  
  - [ ]* 13.6 Write unit tests for recipe filtering scenarios
    - Test filtering with specific dietary restrictions (vegetarian, vegan, etc.)
    - Test filtering with specific allergies (peanuts, shellfish, etc.)
    - Test filtering with multiple restrictions and allergies
    - Test general recommendations without health info
    - _Requirements: 5.2, 5.3_

- [ ] 14. Implement error handling and recovery mechanisms
  - [ ] 14.1 Create error handling utilities and recovery functions
    - Implement error message formatter for Korean display
    - Implement error logger that excludes PII (passwords, emails, health data)
    - Implement recovery functions for navigation errors
    - Implement recovery functions for data persistence errors
    - Add retry mechanisms for network failures
    - Implement safe state restoration after errors
    - _Requirements: 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 14.2 Write property test for navigation error handling
    - **Property 30: Navigation error handling**
    - **Validates: Requirements 8.2**
  
  - [ ]* 14.3 Write property test for error logging without PII
    - **Property 31: Error logging without privacy violation**
    - **Validates: Requirements 8.4**
  
  - [ ]* 14.4 Write property test for error recovery
    - **Property 32: Error recovery to safe state**
    - **Validates: Requirements 8.5**
  
  - [ ]* 14.5 Write unit tests for specific error scenarios
    - Test authentication network failure with retry
    - Test onboarding network failure with partial save
    - Test data persistence failure with retry
    - Test navigation error recovery
    - Test error messages in Korean
    - _Requirements: 1.5, 8.1, 8.2, 8.3_

- [ ] 15. Wire all components together and implement routing
  - [ ] 15.1 Create main App component with routing logic
    - Set up routing for Login, QuickHealthInfo, HomeHub screens
    - Implement authentication check on app start
    - Implement onboarding status check after authentication
    - Route to appropriate screen based on user state
    - Integrate NavigationService with UI routing
    - Handle app lifecycle events (background/resume)
    - _Requirements: 1.4, 4.2, 4.3, 4.4, 6.5_
  
  - [ ]* 15.2 Write integration tests for complete user flows
    - Test new user flow: login → register → health info → home hub
    - Test new user skip flow: login → register → skip → home hub
    - Test returning user flow: login → home hub
    - Test incomplete onboarding flow: login → resume onboarding → home hub
    - Test navigation flow: home hub → feature → back → home hub
    - Test logout flow: home hub → logout → login
    - _Requirements: 1.3, 2.1, 2.2, 3.1, 4.3, 4.4, 6.4_

- [ ] 16. Final checkpoint - Ensure all tests pass and integration is complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all 32 properties are tested with minimum 100 iterations
  - Verify all edge cases are covered in unit tests
  - Verify integration tests cover complete user flows
  - Verify all Korean text is displayed correctly
  - Verify touch targets meet minimum size requirements
  - Verify Hero section displays personalized content correctly
  - Verify ingredient count updates when returning from Fridge Feature

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties (32 total)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end user flows
- All property tests must run with minimum 100 iterations
- All UI text must be in Korean (Requirements 7.1, 7.3)
- All touch targets must meet 44x44 point minimum (Requirement 7.4)
- Error messages must be user-friendly and in Korean (Requirement 8.2)
- Hero section must display personalized greeting, ingredient count, and health goal reference (Requirements 3.2, 3.3, 3.4, 3.5)
- Home Hub must include navigation to three features: Fridge Management, Recipe Recommendation, and Meal Logging (Requirements 3.7, 3.8, 3.9, 3.10)
