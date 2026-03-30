import mongoose from 'mongoose';

export const PACKS = {
  trial: { name: 'Trial lesson', lessons: 1, price: 95 },
  single: { name: 'Single lesson', lessons: 1, price: 120 },
  '4pack': { name: '4-lesson pack', lessons: 4, price: 440 },
  '8pack': { name: '8-lesson pack', lessons: 8, price: 800 },
};

export const PACK_VALIDITY_DAYS = {
  trial: 28,
  single: 28,
  '4pack': 56,
  '8pack': 112,
};

const PurchaseSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pack: {
      type: String,
      enum: Object.keys(PACKS),
      required: true,
    },
    packName: {
      type: String,
      required: true,
    },
    lessonsAdded: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    paymentReference: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['completed', 'refunded'],
      default: 'completed',
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Purchase', PurchaseSchema);