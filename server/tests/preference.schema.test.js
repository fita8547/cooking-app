import { describe, test, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import mongoose from 'mongoose';
import Preference from '../models/Preference.js';
import User from '../models/User.js';
import Recipe from '../models/Recipe.js';
import Meal from '../models/Meal.js';
import PreferenceService from '../services/PreferenceService.js';

/**
 * Feature: personalized-recommendation-enhancement
 * Property 3: Preference data schema completeness
 * 
 * For any stored preference record, it must contain all required fields:
 * userId, recipeId (or mealId), ratingType, ratingValue, ingredients array,
 * cuisineType, difficulty, cookingTime, context object, and timestamp.
 * 
 * Validates: Requirements 1.5, 2.1
 */

// Test data generators (arbitraries)
const arbitraryRatingType = () => fc.constantFrom('like', 'dislike', 'star');

const arbitraryRatingValue = (ratingType) => {
  if (ratingType === 'like') return fc.constant(1);
  if (ratingType === 'dislike') return fc.constant(-1);
  return fc.integer({ min: 1, max: 5 });
};

const arbitraryMealType = () => fc.constantFrom('아침', '점심', '저녁', '간식');

const arbitraryTimeOfDay = () => fc.constantFrom('morning', 'afternoon', 'evening');

const arbitraryDifficulty = () => fc.constantFrom('쉬움', '보통', '어려움');

const arbitraryIngredients = () => fc.array(
  fc.constantFrom('토마토', '양파', '마늘', '당근', '감자', '고기', '생선', '계란', '치즈', '우유'),
  { minLength: 1, maxLength: 8 }
);

const arbitraryCuisineType = () => fc.constantFrom('한식', '중식', '일식', '양식', '이탈리안', '멕시칸');

const arbitraryContext = () => fc.record({
  mealType: arbitraryMealType(),
  dayOfWeek: fc.integer({ min: 0, max: 6 }),
  timeOfDay: arbitraryTimeOfDay()
});

describe('Preference Schema Property Tests', () => {
  let testUser;
  let testRecipe;
  let testMeal;

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'hashedpassword123',
      healthProfile: {
        allergies: [],
        diseases: []
      }
    });

    // Create test recipe
    testRecipe = await Recipe.create({
      name: 'Test Recipe',
      ingredients: ['토마토', '양파', '마늘'],
      cuisineType: '한식',
      difficulty: '보통',
      cookingTime: 30,
      instructions: 'Test instructions',
      userId: testUser._id
    });

    // Create test meal
    testMeal = await Meal.create({
      userId: testUser._id,
      recipeName: 'Test Meal',
      recipeId: testRecipe._id,
      mealType: '점심',
      date: new Date(),
      ingredients: ['토마토', '양파']
    });
  });

  test('Property 3: Preference data schema completeness - all required fields present', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryRatingType(),
        arbitraryIngredients(),
        arbitraryCuisineType(),
        arbitraryDifficulty(),
        fc.integer({ min: 10, max: 120 }),
        arbitraryContext(),
        async (ratingType, ingredients, cuisineType, difficulty, cookingTime, context) => {
          // Generate appropriate rating value based on type
          const ratingValue = ratingType === 'like' ? 1 : 
                             ratingType === 'dislike' ? -1 : 
                             fc.sample(fc.integer({ min: 1, max: 5 }), 1)[0];

          // Create preference using PreferenceService
          const preference = await PreferenceService.rateRecipe(
            testUser._id.toString(),
            testRecipe._id.toString(),
            ratingType,
            ratingValue,
            context
          );

          // Retrieve the stored preference directly from database
          const storedPreference = await Preference.findById(preference._id);

          // Assert all required fields are present
          expect(storedPreference).toBeDefined();
          expect(storedPreference.userId).toBeDefined();
          expect(storedPreference.userId.toString()).toBe(testUser._id.toString());
          
          // Either recipeId or mealId must be present
          expect(
            storedPreference.recipeId || storedPreference.mealId
          ).toBeTruthy();
          
          // Rating fields
          expect(storedPreference.ratingType).toBeDefined();
          expect(['like', 'dislike', 'star']).toContain(storedPreference.ratingType);
          expect(storedPreference.ratingValue).toBeDefined();
          expect(typeof storedPreference.ratingValue).toBe('number');
          
          // Recipe detail fields
          expect(storedPreference.ingredients).toBeDefined();
          expect(Array.isArray(storedPreference.ingredients)).toBe(true);
          expect(storedPreference.cuisineType).toBeDefined();
          expect(storedPreference.difficulty).toBeDefined();
          expect(storedPreference.cookingTime).toBeDefined();
          expect(typeof storedPreference.cookingTime).toBe('number');
          
          // Context object
          expect(storedPreference.context).toBeDefined();
          expect(typeof storedPreference.context).toBe('object');
          expect(storedPreference.context.mealType).toBeDefined();
          expect(storedPreference.context.dayOfWeek).toBeDefined();
          expect(typeof storedPreference.context.dayOfWeek).toBe('number');
          expect(storedPreference.context.dayOfWeek).toBeGreaterThanOrEqual(0);
          expect(storedPreference.context.dayOfWeek).toBeLessThanOrEqual(6);
          expect(storedPreference.context.timeOfDay).toBeDefined();
          
          // Timestamps (automatically added by Mongoose)
          expect(storedPreference.createdAt).toBeDefined();
          expect(storedPreference.createdAt).toBeInstanceOf(Date);
          expect(storedPreference.updatedAt).toBeDefined();
          expect(storedPreference.updatedAt).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Preference data schema completeness - meal-based preference', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryRatingType(),
        arbitraryContext(),
        async (ratingType, context) => {
          const ratingValue = ratingType === 'like' ? 1 : 
                             ratingType === 'dislike' ? -1 : 
                             fc.sample(fc.integer({ min: 1, max: 5 }), 1)[0];

          // Create preference for a meal (not a recipe)
          const preference = await PreferenceService.rateRecipe(
            testUser._id.toString(),
            null, // No recipeId
            ratingType,
            ratingValue,
            { ...context, mealId: testMeal._id.toString() }
          );

          const storedPreference = await Preference.findById(preference._id);

          // Assert all required fields are present
          expect(storedPreference).toBeDefined();
          expect(storedPreference.userId).toBeDefined();
          expect(storedPreference.mealId).toBeDefined();
          expect(storedPreference.mealId.toString()).toBe(testMeal._id.toString());
          
          // All other required fields
          expect(storedPreference.ratingType).toBeDefined();
          expect(storedPreference.ratingValue).toBeDefined();
          expect(storedPreference.ingredients).toBeDefined();
          expect(Array.isArray(storedPreference.ingredients)).toBe(true);
          expect(storedPreference.cuisineType).toBeDefined();
          expect(storedPreference.difficulty).toBeDefined();
          expect(storedPreference.cookingTime).toBeDefined();
          expect(storedPreference.context).toBeDefined();
          expect(storedPreference.createdAt).toBeDefined();
          expect(storedPreference.updatedAt).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 3: Preference data schema completeness - rating value validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryRatingType(),
        arbitraryContext(),
        async (ratingType, context) => {
          const ratingValue = ratingType === 'like' ? 1 : 
                             ratingType === 'dislike' ? -1 : 
                             fc.sample(fc.integer({ min: 1, max: 5 }), 1)[0];

          const preference = await PreferenceService.rateRecipe(
            testUser._id.toString(),
            testRecipe._id.toString(),
            ratingType,
            ratingValue,
            context
          );

          const storedPreference = await Preference.findById(preference._id);

          // Validate rating value matches rating type constraints
          if (storedPreference.ratingType === 'like') {
            expect(storedPreference.ratingValue).toBe(1);
          } else if (storedPreference.ratingType === 'dislike') {
            expect(storedPreference.ratingValue).toBe(-1);
          } else if (storedPreference.ratingType === 'star') {
            expect(storedPreference.ratingValue).toBeGreaterThanOrEqual(1);
            expect(storedPreference.ratingValue).toBeLessThanOrEqual(5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
