import mongoose from "mongoose";

const UserSchema = mongoose.Schema({
  name: String,
  lastName: String,
  email: String,
  role: {
    type: String,
    enum: ['parent', 'admin', 'instructor'],
    default: 'parent'
  },
  // not sure how to do this
  children: [],
  lessons: Number,
  phoneNumber: String,
  password: String
})

export default mongoose.model('User', UserSchema)