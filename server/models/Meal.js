import mongoose from 'mongoose';

const mealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  },
  recipeName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  mealType: {
    type: String,
    enum: ['아침', '점심', '저녁', '간식'],
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  notes: String,
  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  imageUrl: String,
  preferenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Preference'
  },
  wasRecommended: {
    type: Boolean,
    default: false
  },
  recommendationScore: {
    type: Number
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
mealSchema.index({ userId: 1, date: -1 });
mealSchema.index({ updatedAt: -1 });

export default mongoose.model('Meal', mealSchema);
