import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    classDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
    cancelledAt: {
      type: Date,
    },
    lessonCost: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

BookingSchema.index(
  { child: 1, class: 1, classDate: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'confirmed' },
  }
);

export default mongoose.model('Booking', BookingSchema);