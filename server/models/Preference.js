import mongoose from 'mongoose';

const preferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  },
  mealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meal'
  },
  ratingType: {
    type: String,
    enum: ['like', 'dislike', 'star'],
    required: true
  },
  ratingValue: {
    type: Number,
    required: true,
    validate: {
      validator: function(value) {
        if (this.ratingType === 'star') {
          return value >= 1 && value <= 5;
        } else if (this.ratingType === 'like') {
          return value === 1;
        } else if (this.ratingType === 'dislike') {
          return value === -1;
        }
        return false;
      },
      message: 'Rating value must be 1-5 for star ratings, 1 for like, or -1 for dislike'
    }
  },
  ingredients: [{
    type: String
  }],
  cuisineType: {
    type: String
  },
  difficulty: {
    type: String,
    enum: ['쉬움', '보통', '어려움']
  },
  cookingTime: {
    type: Number
  },
  context: {
    mealType: {
      type: String,
      enum: ['아침', '점심', '저녁', '간식']
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6
    },
    timeOfDay: {
      type: String,
      enum: ['morning', 'afternoon', 'evening']
    }
  }
}, {
  timestamps: true
});

// Add indexes for efficient querying
preferenceSchema.index({ userId: 1, createdAt: -1 });
preferenceSchema.index({ userId: 1, ratingType: 1 });

// Referential integrity validation
preferenceSchema.pre('save', async function(next) {
  // Ensure at least one of recipeId or mealId is provided
  if (!this.recipeId && !this.mealId) {
    return next(new Error('Either recipeId or mealId must be provided'));
  }
  
  // Validate userId exists
  const User = mongoose.model('User');
  const userExists = await User.exists({ _id: this.userId });
  if (!userExists) {
    return next(new Error('Referenced user does not exist'));
  }
  
  // Validate recipeId if provided
  if (this.recipeId) {
    const Recipe = mongoose.model('Recipe');
    const recipeExists = await Recipe.exists({ _id: this.recipeId });
    if (!recipeExists) {
      return next(new Error('Referenced recipe does not exist'));
    }
  }
  
  // Validate mealId if provided
  if (this.mealId) {
    const Meal = mongoose.model('Meal');
    const mealExists = await Meal.exists({ _id: this.mealId });
    if (!mealExists) {
      return next(new Error('Referenced meal does not exist'));
    }
  }
  
  next();
});

export default mongoose.model('Preference', preferenceSchema);
