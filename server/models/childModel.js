import mongoose from 'mongoose';

const NapTimeSchema = new mongoose.Schema(
  {
    start: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, 'start must be in HH:MM format'],
    },
    end: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, 'end must be in HH:MM format'],
    },
  },
  { _id: false }
);

const ChildSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['girl', 'boy', 'other'],
    },
    swimmingExperience: {
      type: String,
      enum: ['none', 'some', 'intermediate'],
      required: true,
    },
    napTimes: {
      type: [NapTimeSchema],
      validate: {
        validator: (arr) => arr.length <= 3,
        message: 'A child can have at most 3 nap times',
      },
      default: [],
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    allergies: {
      type: String,
      default: '',
    },
    medicalConditions: {
      type: String,
      default: '',
    },
    fears: {
      type: String,
      default: '',
    },
    additionalInfo: {
      type: String,
      default: '',
    },
    consentStatus: {
      type: String,
      enum: ['pending', 'signed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Child', ChildSchema);