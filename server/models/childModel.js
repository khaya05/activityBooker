import mongoose from "mongoose";

const ChildSchema = new mongoose.Schema(
  {
    name: String,
    lastName: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['girl', 'boy', 'other']
    },
    swimmingExperience: {
      type: String,
      enum: ['beginner', 'some experience', 'intermediate']
    },
    // napTimes: not sure how to do this, max 3 times
    parent: {
      type: mongoose.Types.ObjectId,
      ref: 'User'
    },
    allergies: String,
    medicalConditions: String,
    fears: String,
    additionalInfo: String,
    consentStatus: {
      type: String,
      enum: ['pending', 'signed']
    }
  }, { timestamps: true }

)