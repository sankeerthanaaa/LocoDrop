import mongoose from 'mongoose';

export const isValidObjectId = (value) =>
  typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
