import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: {
      type: [Number],
      validate: {
        validator: (coords) =>
          Array.isArray(coords) &&
          coords.length === 2 &&
          coords.every((coord) => Number.isFinite(coord)),
        message: 'GeoJSON point coordinates must be [lng, lat]',
      },
    },
  },
  { _id: false }
);

const agentProfileSchema = new mongoose.Schema(
  {
    user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    vehicleType:     { type: String, enum: ['bike', 'cycle', 'walk'], default: 'bike' },
    isOnline:        { type: Boolean, default: false },
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    location:        { type: pointSchema, default: null },
    lastSeen:        { type: Date, default: null },
    totalDeliveries: { type: Number, default: 0 },
    rating:          { type: Number, default: 5.0 },
  },
  { timestamps: true }
);

agentProfileSchema.index({ isOnline: 1, updatedAt: -1 });
agentProfileSchema.index({ location: '2dsphere' });

const AgentProfile = mongoose.model('AgentProfile', agentProfileSchema);
export default AgentProfile;
