import mongoose from 'mongoose';

export const USER_ROLES = ['sender', 'agent', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role:     { type: String, enum: USER_ROLES, default: 'sender' },
    phone:    { type: String, default: '' },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, createdAt: -1 });

const User = mongoose.model('User', userSchema);
export default User;
