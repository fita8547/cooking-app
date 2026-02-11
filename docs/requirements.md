# 요구사항 문서 (Requirements Document)

## 소개 (Introduction)

애드혹 쿡킹 AI 서비스는 사용자의 냉장고 재료를 기반으로 맞춤형 레시피를 추천하고, 건강 정보를 고려한 식단 관리를 제공하며, 단계별 요리 가이드를 통해 누구나 쉽게 요리할 수 있도록 돕는 AI 기반 요리 서비스입니다.

**프로젝트 컨텍스트:**
- 해커톤: 조코딩 x OpenAI x Primer AI 해커톤
- 마감일: 2026-02-20
- 팀: 장준수 (리더), 강제형, 모예송
- 태그라인: "요리의 모든 것, AI로 더하다. 셰프가 옆에서 알려주는 것처럼 쉽고 친절하게, 나만의 맞춤형 요리를 시작해보세요."

## 용어 사전 (Glossary)

- **System**: 애드혹 쿡킹 AI 서비스 전체 시스템
- **User**: 서비스를 사용하는 일반 사용자
- **Recipe_Engine**: 재료 기반으로 레시피를 생성하고 추천하는 AI 엔진
- **Ingredient_Recognizer**: 이미지에서 재료를 인식하는 AI 컴포넌트
- **Health_Calculator**: 사용자의 건강 정보를 기반으로 영양소 기준을 계산하는 컴포넌트
- **Meal_Tracker**: 사용자의 식사 기록을 관리하는 컴포넌트
- **Preference_Learner**: 사용자의 취향을 학습하고 개인화 추천을 제공하는 AI 컴포넌트
- **Cooking_Guide**: 단계별 요리 가이드를 제공하는 컴포넌트
- **BMR**: 기초대사량 (Basal Metabolic Rate)
- **Valid_Ingredient**: 시스템이 인식할 수 있는 유효한 재료
- **Recipe**: 재료 목록, 조리 단계, 영양 정보를 포함한 요리 레시피
- **Meal_Record**: 날짜, 시간, 섭취한 음식, 영양 정보를 포함한 식사 기록
- **User_Profile**: 나이, 성별, 키, 체중, 알레르기, 식단 목표를 포함한 사용자 건강 정보

## 요구사항 (Requirements)

### Requirement 1: 냉장고 재료 입력 및 인식

**User Story:** 사용자로서, 냉장고에 있는 재료를 쉽게 입력하거나 촬영하여 인식시키고 싶습니다. 그래야 빠르게 요리 가능한 레시피를 찾을 수 있기 때문입니다.

#### Acceptance Criteria

1. WHEN a user manually enters ingredient names, THE System SHALL add them to the user's ingredient list
2. WHEN a user uploads or captures a photo of ingredients, THE Ingredient_Recognizer SHALL analyze the image and return a list of recognized ingredient candidates within 10 seconds
3. WHEN ingredient recognition is complete, THE System SHALL display the recognized ingredients to the user for confirmation
4. WHEN a user reviews recognized ingredients, THE System SHALL allow the user to add, remove, or modify ingredients in the list
5. THE System SHALL store only Valid_Ingredients in the user's ingredient list

### Requirement 2: 재료 기반 레시피 추천

**User Story:** 사용자로서, 내가 가진 재료로 만들 수 있는 요리를 추천받고 싶습니다. 그래야 재료를 낭비하지 않고 효율적으로 요리할 수 있기 때문입니다.

#### Acceptance Criteria

1. WHEN a user requests recipe recommendations, THE Recipe_Engine SHALL generate recipes based on the user's ingredient list
2. WHEN generating recommendations, THE Recipe_Engine SHALL prioritize recipes that use only available ingredients and display them at the top
3. WHEN a user selects "available ingredients only" mode, THE Recipe_Engine SHALL return only recipes that require no additional ingredients
4. WHEN a user selects "allow additional ingredients" mode, THE Recipe_Engine SHALL return recipes that may require additional ingredients
5. WHEN a recipe requires additional ingredients, THE System SHALL clearly display the list of missing ingredients
6. WHEN displaying missing ingredients, THE System SHALL provide purchase links or purchase guides for each missing ingredient
7. THE Recipe_Engine SHALL return recipe recommendations within 5 seconds

### Requirement 3: 건강 정보 기반 맞춤 식단

**User Story:** 사용자로서, 내 건강 정보를 입력하고 그에 맞는 식단을 추천받고 싶습니다. 그래야 건강 목표를 달성하면서 안전하게 식사할 수 있기 때문입니다.

#### Acceptance Criteria

1. WHEN a user creates or updates their profile, THE System SHALL allow input of age, gender, height, weight, allergies, dietary goals, and medical conditions
2. WHEN a User_Profile is saved, THE Health_Calculator SHALL compute the user's BMR and target calorie intake
3. WHEN generating recipe recommendations, THE Recipe_Engine SHALL exclude recipes containing ingredients that match the user's allergy list
4. WHEN displaying recipes, THE System SHALL show nutritional information including calories, protein, carbohydrates, and fats
5. WHEN a user has a dietary goal, THE Recipe_Engine SHALL prioritize recipes that align with the user's target calorie intake and nutritional needs

### Requirement 4: 단계별 요리 가이드

**User Story:** 사용자로서, 선택한 레시피를 단계별로 따라하면서 요리하고 싶습니다. 그래야 요리 경험이 없어도 성공적으로 요리를 완성할 수 있기 때문입니다.

#### Acceptance Criteria

1. WHEN a user selects a recipe to cook, THE Cooking_Guide SHALL display step-by-step cooking instructions
2. WHEN displaying cooking steps, THE Cooking_Guide SHALL provide visual guides (2D or 3D illustrations) for each step
3. WHEN a user enables voice guidance, THE Cooking_Guide SHALL provide audio instructions for each cooking step
4. WHEN a cooking step requires timing, THE Cooking_Guide SHALL provide a timer function with notifications
5. WHEN a user completes a step, THE System SHALL allow the user to proceed to the next step
6. THE Cooking_Guide SHALL allow users to navigate backward to previous steps

### Requirement 5: 식사 기록 조회 및 관리

**User Story:** 사용자로서, 내가 먹은 음식을 기록하고 과거 식사 내역을 확인하고 싶습니다. 그래야 식습관을 관리하고 개선할 수 있기 때문입니다.

#### Acceptance Criteria

1. WHEN a user completes a meal, THE System SHALL allow the user to save a Meal_Record with date, time, recipe, and nutritional information
2. WHEN a user requests meal history, THE Meal_Tracker SHALL display meal records organized by date
3. WHEN viewing meal history, THE System SHALL display nutritional summaries for each day
4. WHEN a user selects a Meal_Record, THE System SHALL allow the user to edit or delete the record
5. WHEN a Meal_Record is deleted, THE System SHALL remove it from the user's history immediately

### Requirement 6: 사용자 취향 학습 및 개인화 추천

**User Story:** 사용자로서, 내가 좋아하는 음식을 시스템이 학습하여 나에게 맞는 요리를 추천받고 싶습니다. 그래야 서비스를 지속적으로 사용하고 만족도를 높일 수 있기 때문입니다.

#### Acceptance Criteria

1. WHEN a user views a recipe or meal record, THE System SHALL allow the user to mark it with a preference rating (like/dislike)
2. WHEN a user marks preferences, THE Preference_Learner SHALL store the preference data associated with the user's profile
3. WHEN generating recipe recommendations, THE Preference_Learner SHALL analyze the user's meal history and preference ratings
4. WHEN a user has sufficient preference data, THE Preference_Learner SHALL prioritize recipes similar to previously liked meals
5. WHEN recommending recipes, THE Preference_Learner SHALL suggest new recipes based on ingredients and flavors from the user's preferred meals

### Requirement 7: 성능 요구사항

**User Story:** 사용자로서, 빠른 응답 속도로 서비스를 이용하고 싶습니다. 그래야 요리 준비 과정에서 대기 시간 없이 효율적으로 진행할 수 있기 때문입니다.

#### Acceptance Criteria

1. WHEN a user requests recipe generation, THE Recipe_Engine SHALL return results within 5 seconds
2. WHEN a user uploads an image for ingredient recognition, THE Ingredient_Recognizer SHALL return results within 10 seconds
3. WHEN a user navigates between screens, THE System SHALL load the screen within 2 seconds
4. WHEN multiple users access the system simultaneously, THE System SHALL maintain response times within specified limits

### Requirement 8: 모바일 최적화

**User Story:** 사용자로서, 모바일 기기에서 원활하게 서비스를 사용하고 싶습니다. 그래야 주방에서 요리하면서 편리하게 가이드를 확인할 수 있기 때문입니다.

#### Acceptance Criteria

1. WHEN a user accesses the service on a mobile device, THE System SHALL display a responsive interface optimized for the device screen size
2. WHEN a user interacts with the mobile interface, THE System SHALL respond to touch gestures appropriately
3. WHEN a user uses the camera feature, THE System SHALL access the device camera and capture images smoothly
4. WHEN a user enables voice guidance, THE System SHALL utilize the device's audio output without interruption
5. THE System SHALL function properly on both iOS and Android platforms

### Requirement 9: 보안 및 개인정보 보호

**User Story:** 사용자로서, 내 건강 정보와 식사 기록이 안전하게 보호되기를 원합니다. 그래야 안심하고 개인 정보를 입력하고 서비스를 이용할 수 있기 때문입니다.

#### Acceptance Criteria

1. WHEN a user's data is stored, THE System SHALL encrypt sensitive information including health data and meal records
2. WHEN a user's data is transmitted, THE System SHALL use secure communication protocols (HTTPS)
3. THE System SHALL NOT transmit user data to external parties without explicit user consent
4. WHEN a user requests data deletion, THE System SHALL permanently remove all associated user data
5. THE System SHALL implement authentication to ensure only authorized users can access their own data

### Requirement 10: 사용자 경험 및 접근성

**User Story:** 사용자로서, 직관적이고 사용하기 쉬운 인터페이스를 원합니다. 그래야 요리 초보자도 어려움 없이 서비스를 활용할 수 있기 때문입니다.

#### Acceptance Criteria

1. WHEN a user first launches the app, THE System SHALL provide a simple onboarding flow explaining key features
2. WHEN a user navigates the app, THE System SHALL ensure all primary functions are accessible within 3 taps
3. WHEN a user performs an action, THE System SHALL provide clear visual feedback confirming the action
4. WHEN an error occurs, THE System SHALL display user-friendly error messages in Korean with guidance on how to resolve the issue
5. THE System SHALL use clear, consistent iconography and labeling throughout the interface
6. THE System SHALL support accessibility features including text size adjustment and screen reader compatibility

### Requirement 11: API 모듈화 및 유지보수성

**User Story:** 개발자로서, 시스템을 쉽게 유지보수하고 확장할 수 있기를 원합니다. 그래야 새로운 기능을 추가하거나 문제를 해결할 때 효율적으로 작업할 수 있기 때문입니다.

#### Acceptance Criteria

1. WHEN the system is designed, THE System SHALL organize API endpoints into logical modules (recipes, meals, diet, users)
2. WHEN an API endpoint is called, THE System SHALL follow RESTful conventions for request and response formats
3. WHEN a module is updated, THE System SHALL ensure changes do not break other modules through proper interface definitions
4. THE System SHALL provide clear API documentation for all endpoints
5. THE System SHALL implement error handling that returns consistent error response formats across all endpoints
