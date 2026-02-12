import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  ingredients: [{
    name: { type: String, required: true },
    amount: String,
    unit: String
  }],
  steps: [{
    stepNumber: Number,
    instruction: String,
    duration: Number,
    imageUrl: String
  }],
  cookingTime: {
    type: Number,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['쉬움', '보통', '어려움'],
    default: '보통'
  },
  servings: {
    type: Number,
    default: 2
  },
  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    sodium: Number
  },
  category: {
    type: String,
    enum: ['한식', '중식', '일식', '양식', '분식', '디저트', '기타']
  },
  tags: [String],
  allergens: [String],  // For quick allergy filtering
  imageUrl: String,
  createdBy: {
    type: String,
    enum: ['ai', 'user', 'admin'],
    default: 'ai'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
recipeSchema.index({ allergens: 1 });  // Multi-key index for allergy filtering
recipeSchema.index({ 'nutrition.calories': 1 });  // Index for calorie-based queries
recipeSchema.index({ tags: 1 });  // Multi-key index for category filtering

export default mongoose.model('Recipe', recipeSchema);
