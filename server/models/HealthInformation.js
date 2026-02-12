import mongoose from 'mongoose';

const healthInformationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Basic health information
  age: Number,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  height: Number,  // stored in cm
  weight: Number,  // stored in kg
  dietaryRestrictions: [{
    id: String,
    name: String,
    nameKo: String
  }],
  allergies: [{
    id: String,
    name: String,
    nameKo: String,
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe']
    }
  }],
  healthGoals: [{
    id: String,
    name: String,
    nameKo: String
  }],
  dietaryGoal: {
    type: String,
    enum: ['weight_loss', 'weight_gain', 'maintenance', 'muscle_gain']
  },
  medicalConditions: [String],
  // Calculated metrics
  calculatedMetrics: {
    bmi: Number,
    bmr: Number,
    tdee: Number,
    targetWeightRange: {
      min: Number,
      max: Number
    },
    macronutrientTargets: {
      calories: Number,
      protein: Number,   // grams
      carbs: Number,     // grams
      fat: Number        // grams
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
healthInformationSchema.index({ userId: 1 }, { unique: true });
healthInformationSchema.index({ updatedAt: -1 });

export default mongoose.model('HealthInformation', healthInformationSchema);
