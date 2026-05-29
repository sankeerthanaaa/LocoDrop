import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message:   { type: String, required: true },
    type:      { type: String, enum: ['order', 'system'], default: 'order' },
    orderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    isRead:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ orderId: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
