# Requirements Document

## Introduction

This feature extends the Ad-hoc Cooking AI service to provide intelligent recipe recommendations based on available ingredients and personalized meal planning based on user health information. The system integrates ingredient-based recipe discovery with nutritional filtering to deliver recipes that match both ingredient availability and individual health goals, including allergy management and macronutrient targets.

## Glossary

- **Recipe_Recommender**: The system component that suggests recipes based on input criteria
- **Health_Profile**: User's health information including age, gender, height, weight, allergies, dietary goals, and medical conditions
- **BMI**: Body Mass Index, calculated from height and weight
- **BMR**: Basal Metabolic Rate, the minimum energy required for basic body functions
- **TDEE**: Total Daily Energy Expenditure, the total calories burned per day
- **Macronutrient_Target**: Calculated daily targets for carbohydrates, protein, and fat in grams
- **Available_Ingredients**: List of ingredients the user currently has
- **Missing_Ingredients**: Ingredients required for a recipe that the user does not have
- **Exact_Match_Recipe**: Recipe that uses only the user's available ingredients
- **Extended_Match_Recipe**: Recipe that requires some additional ingredients beyond what the user has
- **Allergy_Filter**: Component that excludes recipes containing allergens specified in the user's health profile
- **Purchase_Guide**: Information or links to help users acquire missing ingredients
- **Nutrition_Calculator**: Component that computes BMI, BMR, TDEE, and macronutrient targets
- **Image_Upload_Service**: Component that handles image file uploads and validation
- **Ingredient_Recognition_Service**: Component that uses OpenAI Vision API to recognize ingredients from images
- **Nutritional_Rationale_Generator**: Component that creates personalized rationale text explaining why a recipe is recommended
- **Meal_History**: User's past meal records and nutritional intake data
- **Recognized_Ingredients**: List of ingredients extracted from an uploaded image by the Vision API
- **Confirmed_Ingredients**: List of ingredients that the user has verified as correct after recognition

## Requirements

### Requirement 1: Ingredient-Based Recipe Search

**User Story:** As a user, I want to search for recipes based on ingredients I have, so that I can cook meals without needing to shop for additional items.

#### Acceptance Criteria

1. WHEN a user provides a list of available ingredients, THE Recipe_Recommender SHALL return recipes that can be made with those ingredients
2. WHEN searching for recipes, THE Recipe_Recommender SHALL categorize results into exact match recipes and extended match recipes
3. WHEN displaying exact match recipes, THE Recipe_Recommender SHALL only show recipes using available ingredients
4. WHEN displaying extended match recipes, THE Recipe_Recommender SHALL show recipes that require additional ingredients beyond the available set
5. THE Recipe_Recommender SHALL accept ingredient input as a list of ingredient names

### Requirement 2: Missing Ingredient Identification

**User Story:** As a user, I want to see which ingredients I'm missing for a recipe, so that I know what I need to acquire if I want to make it.

#### Acceptance Criteria

1. WHEN a recipe requires ingredients not in the available ingredients list, THE Recipe_Recommender SHALL identify and display the missing ingredients
2. WHEN displaying missing ingredients, THE Recipe_Recommender SHALL show a clear list of each missing ingredient name
3. THE Recipe_Recommender SHALL distinguish between available and missing ingredients in the recipe display

### Requirement 3: Health Profile Input

**User Story:** As a user, I want to input my health information, so that I can receive meal recommendations tailored to my nutritional needs.

#### Acceptance Criteria

1. THE Recipe_Recommender SHALL accept user input for age in years
2. THE Recipe_Recommender SHALL accept user input for gender
3. THE Recipe_Recommender SHALL accept user input for height in centimeters or inches
4. THE Recipe_Recommender SHALL accept user input for weight in kilograms or pounds
5. THE Recipe_Recommender SHALL accept user input for allergy information as a list of allergens
6. THE Recipe_Recommender SHALL accept user input for dietary goals including diet and health maintenance options
7. WHERE a user provides medical condition information, THE Recipe_Recommender SHALL accept and store this optional data

### Requirement 4: Nutritional Target Calculation

**User Story:** As a user, I want the system to calculate my nutritional targets based on my health information, so that I receive scientifically-based meal recommendations.

#### Acceptance Criteria

1. WHEN a user provides height, weight, and gender, THE Nutrition_Calculator SHALL compute the user's BMI
2. WHEN BMI is calculated, THE Nutrition_Calculator SHALL determine a target weight range based on healthy BMI standards
3. WHEN a user provides age, THE Nutrition_Calculator SHALL estimate the user's BMR
4. WHEN BMR is calculated, THE Nutrition_Calculator SHALL compute the user's TDEE
5. WHEN a user provides weight, THE Nutrition_Calculator SHALL calculate daily protein intake target in grams
6. WHEN protein intake is calculated, THE Nutrition_Calculator SHALL distribute macronutrient ratios for carbohydrates, protein, and fat
7. THE Nutrition_Calculator SHALL use gender-specific formulas for BMR calculation

### Requirement 5: Allergy Management

**User Story:** As a user with food allergies, I want the system to exclude recipes containing my allergens, so that I can safely use the meal recommendations.

#### Acceptance Criteria

1. WHEN a user specifies allergens in their health profile, THE Allergy_Filter SHALL exclude all recipes containing those allergens
2. WHEN filtering recipes by allergens, THE Allergy_Filter SHALL check all recipe ingredients against the user's allergen list
3. THE Allergy_Filter SHALL apply complete exclusion strategy for specified allergens
4. WHEN allergens are excluded, THE Recipe_Recommender SHALL suggest alternative recipes that provide similar nutritional value

### Requirement 6: Personalized Recipe Recommendation

**User Story:** As a user, I want to receive recipe recommendations that match both my available ingredients and my nutritional targets, so that I can prepare healthy meals with what I have.

#### Acceptance Criteria

1. WHEN a user has both available ingredients and a health profile, THE Recipe_Recommender SHALL return recipes matching both criteria
2. WHEN recommending recipes, THE Recipe_Recommender SHALL filter by the user's calculated macronutrient targets
3. WHEN recommending recipes, THE Recipe_Recommender SHALL consider the user's TDEE and target calorie intake
4. WHEN recommending recipes, THE Recipe_Recommender SHALL apply the user's allergy filters
5. THE Recipe_Recommender SHALL prioritize recipes that best match both ingredient availability and nutritional targets

### Requirement 7: Recipe Nutritional Information Display

**User Story:** As a user, I want to see nutritional information for recommended recipes, so that I can understand how they fit my dietary goals.

#### Acceptance Criteria

1. WHEN displaying a recipe, THE Recipe_Recommender SHALL show the recipe's calorie content
2. WHEN displaying a recipe, THE Recipe_Recommender SHALL show the recipe's macronutrient breakdown including carbohydrates, protein, and fat in grams
3. WHEN a user has a health profile, THE Recipe_Recommender SHALL show how the recipe's nutrition compares to the user's daily targets
4. THE Recipe_Recommender SHALL display nutritional information in a clear and readable format

### Requirement 8: Image Upload and Ingredient Recognition

**User Story:** As a user, I want to upload a photo of my ingredients, so that the system can automatically recognize them without manual typing.

#### Acceptance Criteria

1. WHEN a user uploads an image file, THE Recipe_Recommender SHALL accept common image formats (JPEG, PNG, WebP)
2. WHEN an image is uploaded, THE Recipe_Recommender SHALL send the image to OpenAI Vision API for ingredient recognition
3. WHEN OpenAI Vision API returns results, THE Recipe_Recommender SHALL extract ingredient names from the response
4. WHEN ingredients are recognized, THE Recipe_Recommender SHALL display the list to the user for review
5. THE Recipe_Recommender SHALL allow users to confirm correct ingredients
6. THE Recipe_Recommender SHALL allow users to remove incorrect ingredients from the recognized list
7. THE Recipe_Recommender SHALL allow users to manually add ingredients by typing in addition to recognized ingredients
8. WHEN ingredients are confirmed, THE Recipe_Recommender SHALL save the confirmed ingredients to the user's ingredient list
9. THE Recipe_Recommender SHALL validate image file size (maximum 10MB)
10. IF image recognition fails, THEN THE Recipe_Recommender SHALL display an error message and allow manual ingredient entry

### Requirement 9: Nutritional Rationale Display

**User Story:** As a user, I want to see why each recipe is recommended for me, so that I can understand how it fits my health goals.

#### Acceptance Criteria

1. WHEN displaying a recipe, THE Recipe_Recommender SHALL show a one-line rationale explaining the recommendation
2. WHEN generating rationale, THE Recipe_Recommender SHALL consider the user's health information including dietary restrictions, allergies, and health goals
3. WHEN generating rationale, THE Recipe_Recommender SHALL consider the user's meal history and nutritional records
4. WHEN generating rationale, THE Recipe_Recommender SHALL apply nutritional knowledge to explain benefits
5. THE Recipe_Recommender SHALL display rationale at the bottom of each recipe card
6. WHEN a user has protein deficiency, THE Recipe_Recommender SHALL highlight protein content in the rationale
7. WHEN a user needs blood sugar management, THE Recipe_Recommender SHALL highlight low sugar content in the rationale
8. WHEN a user needs specific vitamins or minerals, THE Recipe_Recommender SHALL highlight relevant nutritional benefits in the rationale
9. THE Recipe_Recommender SHALL generate rationale in the user's preferred language
10. WHERE no specific health concern exists, THE Recipe_Recommender SHALL provide general nutritional benefits in the rationale

### Requirement 10: Recipe Recommendation Flow with Rationale

**User Story:** As a user, I want to see recipes organized by ingredient availability with explanations, so that I can make informed cooking decisions.

#### Acceptance Criteria

1. WHEN ingredients are confirmed, THE Recipe_Recommender SHALL display recipes that can be made with ONLY the available ingredients as exact matches
2. WHEN ingredients are confirmed, THE Recipe_Recommender SHALL display recipes that require additional ingredients as extended matches
3. WHEN displaying recipes, THE Recipe_Recommender SHALL show the nutritional rationale at the bottom of each recipe card
4. WHEN displaying exact match recipes, THE Recipe_Recommender SHALL prioritize them above extended match recipes
5. WHEN displaying extended match recipes, THE Recipe_Recommender SHALL show which additional ingredients are needed
6. THE Recipe_Recommender SHALL generate personalized rationale for each recipe based on the user's health profile

### Requirement 11: Integration with Existing System

**User Story:** As a system administrator, I want the new features to integrate seamlessly with the existing Ad-hoc Cooking AI service, so that users have a consistent experience.

#### Acceptance Criteria

1. THE Recipe_Recommender SHALL integrate with the existing React frontend
2. THE Recipe_Recommender SHALL integrate with the existing Node.js/Express backend
3. THE Recipe_Recommender SHALL store health profiles and preferences in the existing MongoDB database
4. THE Recipe_Recommender SHALL utilize the existing OpenAI API integration for recipe generation and recommendations
5. WHEN new features are deployed, THE Recipe_Recommender SHALL maintain backward compatibility with existing functionality
