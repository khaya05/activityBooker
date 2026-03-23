import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      trim: true, 
    },
    ageGroup: {
      type: String,
      required: true,
      trim: true, 
    },
    dayOfWeek: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    startTime: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, 'startTime must be in HH:MM format'], 
    },
    duration: {
      type: Number,
      required: true,
      default: 30,  // minutes
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      default: 4,
    },
    price: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,  // admin can deactivate without deleting
    },
  },
  { timestamps: true }
);

export default mongoose.model('Class', ClassSchema);