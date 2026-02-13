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
  isPremium: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  // Polar.sh 구독 관련 필드
  isPro: {
    type: Boolean,
    default: false
  },
  proExpiresAt: {
    type: Date,
    default: null
  },
  polarCustomerId: {
    type: String,
    default: null
  },
  polarSubscriptionId: {
    type: String,
    default: null
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
    dislikedIngredients: [String]
  }
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);
