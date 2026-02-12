import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationCode: String,
  emailVerificationExpires: Date,
  healthProfile: {
    age: Number,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    height: Number,
    weight: Number,
    allergies: [String],
    diseases: [String],
    goal: { type: String, enum: ['다이어트', '건강유지', '체중증가', '근육증가'] },
    bmr: Number,
    targetCalories: Number
  },
  preferences: {
    favoriteRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
    dislikedIngredients: [String],
    ingredientAffinities: [{
      ingredient: String,
      score: {
        type: Number,
        min: -1.0,
        max: 1.0
      },
      confidence: {
        type: Number,
        min: 0.0,
        max: 1.0
      },
      lastUpdated: Date
    }],
    cuisinePreferences: [{
      cuisine: String,
      score: Number,
      count: Number
    }],
    cookingPatterns: {
      preferredDifficulty: String,
      averageCookingTime: Number,
      preferredMealTimes: {
        breakfast: [String],
        lunch: [String],
        dinner: [String],
        snack: [String]
      },
      weekdayVsWeekend: {
        weekday: {
          avgTime: Number,
          difficulty: String
        },
        weekend: {
          avgTime: Number,
          difficulty: String
        }
      }
    },
    recommendationMetrics: {
      totalRecommendations: {
        type: Number,
        default: 0
      },
      acceptedRecommendations: {
        type: Number,
        default: 0
      },
      acceptanceRate: {
        type: Number,
        default: 0
      },
      lastCalculated: Date
    }
  }
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);
