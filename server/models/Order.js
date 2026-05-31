import mongoose from 'mongoose';

export const ORDER_STATUSES = ['posted', 'accepted', 'picked_up', 'delivered', 'cancelled'];

const coordSchema = new mongoose.Schema(
  { lat: { type: Number }, lng: { type: Number } },
  { _id: false }
);

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

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    sender:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    agent:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    pickupAddress: { type: String, required: true },
    dropAddress:   { type: String, required: true },
    pickupCoords:  { type: coordSchema, default: () => ({}) },
    dropCoords:    { type: coordSchema, default: () => ({}) },
    pickupLocation: { type: pointSchema, default: null },
    dropLocation:   { type: pointSchema, default: null },
    description:   { type: String, default: '' },
    category: {
      type: String,
      required: true,
      enum: ['Groceries', 'Documents', 'Electronics', 'Food', 'Medicine', 'Other'],
      default: 'Other'
    },
    price:         { type: Number, required: true },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'posted',
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    rating: { type: Number, default: null },
    acceptedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    pickupFlatNumber: { type: String, default: '' },
    pickupLandmark: { type: String, default: '' },
    dropFlatNumber: { type: String, default: '' },
    dropLandmark: { type: String, default: '' },
    deliveryInstructions: { type: String, default: '' },
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ sender: 1, createdAt: -1 });
orderSchema.index({ agent: 1, status: 1 });
orderSchema.index({ pickupLocation: '2dsphere' });
orderSchema.index({ dropLocation: '2dsphere' });

const Order = mongoose.model('Order', orderSchema);
export default Order;
