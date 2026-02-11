import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['채소', '과일', '육류', '해산물', '유제품', '곡물', '조미료', '기타'],
    default: '기타'
  },
  quantity: String,
  unit: String,
  expiryDate: Date,
  addedDate: {
    type: Date,
    default: Date.now
  },
  purchaseLink: String
}, {
  timestamps: true
});

ingredientSchema.index({ userId: 1, name: 1 });

export default mongoose.model('Ingredient', ingredientSchema);
