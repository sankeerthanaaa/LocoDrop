import Notification from '../models/Notification.js';

export const createNotification = async (req, { recipient, message, type = 'order', orderId = null }) => {
  const notification = await Notification.create({
    recipient,
    message,
    type,
    orderId,
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${recipient.toString()}`).emit('notification:new', notification);
  }

  return notification;
};
