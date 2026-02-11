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
  imageUrl: String
}, {
  timestamps: true
});

mealSchema.index({ userId: 1, date: -1 });

export default mongoose.model('Meal', mealSchema);
