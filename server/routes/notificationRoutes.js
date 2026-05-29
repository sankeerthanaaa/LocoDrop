import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateObjectIdParam } from '../middleware/validationMiddleware.js';

const router = express.Router();

// GET /api/notifications/unread-count  (any authenticated user)
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
    res.json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/notifications  (any authenticated user)
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/notifications/:id/read  (mark one as read)
router.put('/:id/read', protect, validateObjectIdParam('id'), async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/notifications/read-all  (mark all as read)
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
