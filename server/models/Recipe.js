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
  imageUrl: String,
  createdBy: {
    type: String,
    enum: ['ai', 'user', 'admin'],
    default: 'ai'
  }
}, {
  timestamps: true
});

export default mongoose.model('Recipe', recipeSchema);
