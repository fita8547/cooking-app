import mongoose from 'mongoose';

const onboardingStatusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  isComplete: {
    type: Boolean,
    default: false
  },
  healthInfoProvided: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('OnboardingStatus', onboardingStatusSchema);
