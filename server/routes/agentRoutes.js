import express from 'express';
import AgentProfile from '../models/AgentProfile.js';
import Order from '../models/Order.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { validateRequest,validateObjectIdParam } from '../middleware/validationMiddleware.js';
import { toGeoPoint } from '../utils/geo.js';
import { isValidObjectId } from '../utils/objectId.js';
import { isValidLatitude, isValidLongitude, isValidPhone } from '../utils/validators.js';

const router = express.Router();
const ACTIVE_DELIVERY_STATUSES = ['accepted', 'picked_up'];

// PUT /api/agents/location  (agent — update location, broadcast to active order room)
router.put('/location', protect, requireRole('agent'), validateRequest([
  (req) => {
    const errors = [];
    if (!isValidLatitude(req.body.lat)) {
      errors.push({ field: 'lat', message: 'lat must be a number between -90 and 90' });
    }
    if (!isValidLongitude(req.body.lng)) {
      errors.push({ field: 'lng', message: 'lng must be a number between -180 and 180' });
    }
    if (req.body.orderId && !isValidObjectId(req.body.orderId)) {
      errors.push({ field: 'orderId', message: 'orderId must be a valid ObjectId' });
    }
    return errors;
  },
]), async (req, res) => {
  try {
    const { lat, lng, orderId } = req.body;
    const nextLocation = { lat: Number(lat), lng: Number(lng) };

    const profile = await AgentProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ message: 'Agent profile not found' });

    let activeOrder = null;
    if (orderId) {
      activeOrder = await Order.findOne({
        _id: orderId,
        agent: req.user.id,
        status: { $in: ACTIVE_DELIVERY_STATUSES },
      }).select('_id status agent');

      if (!activeOrder) {
        return res.status(403).json({
          message: 'Cannot broadcast location for an order that is not assigned and active for this agent',
        });
      }
    } else {
      activeOrder = await Order.findOne({
        agent: req.user.id,
        status: { $in: ACTIVE_DELIVERY_STATUSES },
      }).select('_id status agent');
    }

    profile.currentLocation = nextLocation;
    profile.location = toGeoPoint(nextLocation);
    profile.lastSeen = new Date();
    await profile.save();

    if (activeOrder) {
      const io = req.app.get('io');
      if (io) {
        io.to(`order:${activeOrder._id}`).emit('agent:location', {
          orderId: activeOrder._id,
          lat: nextLocation.lat,
          lng: nextLocation.lng,
        });
      }
    }

    res.json({
      message: 'Location updated',
      currentLocation: profile.currentLocation,
      activeOrderId: activeOrder?._id || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/agents/toggle-online  (agent)
router.put('/toggle-online', protect, requireRole('agent'), async (req, res) => {
  try {
    const profile = await AgentProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ message: 'Agent profile not found' });

    profile.isOnline = !profile.isOnline;
    profile.lastSeen = new Date();
    await profile.save();

    const io = req.app.get('io');
    if (io) io.to('admin').emit('agent:toggle', { agentId: req.user.id, isOnline: profile.isOnline });

    res.json({ isOnline: profile.isOnline });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/agents  (admin — all agents with their profiles)
router.get('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const profiles = await AgentProfile.find().populate('user', 'name email phone createdAt');
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/agents/my-profile  (agent — own profile)
router.get('/my-profile', protect, requireRole('agent'), async (req, res) => {
  try {
    const profile = await AgentProfile.findOne({ user: req.user.id }).populate('user', 'name email phone');
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // Calculate Active Deliveries (status in accepted, picked_up)
    const activeDeliveries = await Order.countDocuments({
      agent: req.user.id,
      status: { $in: ['accepted', 'picked_up'] }
    });

    // Calculate Completed Deliveries (status is delivered)
    const completedDeliveries = await Order.countDocuments({
      agent: req.user.id,
      status: 'delivered'
    });

    // Calculate Today's Deliveries (status is delivered, completed today)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaysDeliveries = await Order.countDocuments({
      agent: req.user.id,
      status: 'delivered',
      deliveredAt: { $gte: startOfToday }
    });

    // Calculate Today's Earnings
    const todaysOrders = await Order.find({
      agent: req.user.id,
      status: 'delivered',
      deliveredAt: { $gte: startOfToday }
    }, 'price');
    const todayEarnings = todaysOrders.reduce((sum, o) => sum + (o.price || 0), 0);

    const profileObj = profile.toObject();
    profileObj.stats = {
      active: activeDeliveries,
      completed: completedDeliveries,
      today: todaysDeliveries,
      todayEarnings: todayEarnings
    };

    res.json(profileObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/agents/my-profile  (agent — update own profile information/phone)
router.put('/my-profile', protect, requireRole('agent'), validateRequest([
  (req) => {
    const errors = [];
    if (req.body.phone && !isValidPhone(req.body.phone)) {
      errors.push({ field: 'phone', message: 'phone number format is invalid' });
    }
    if (req.body.vehicleType && !['bike', 'cycle', 'walk'].includes(req.body.vehicleType)) {
      errors.push({ field: 'vehicleType', message: 'vehicleType must be one of: bike, cycle, walk' });
    }
    return errors;
  }
]), async (req, res) => {
  try {
    const { phone, vehicleType } = req.body;
    
    // Update User model fields (phone number)
    if (phone !== undefined) {
      await import('../models/User.js').then(async ({ default: User }) => {
        await User.findByIdAndUpdate(req.user.id, { phone: phone.trim() });
      });
    }

    // Update AgentProfile fields (vehicleType)
    const profile = await AgentProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ message: 'Agent profile not found' });

    if (vehicleType !== undefined) {
      profile.vehicleType = vehicleType;
      await profile.save();
    }

    // Retrieve fresh profile with stats
    const activeDeliveries = await Order.countDocuments({
      agent: req.user.id,
      status: { $in: ['accepted', 'picked_up'] }
    });

    const completedDeliveries = await Order.countDocuments({
      agent: req.user.id,
      status: 'delivered'
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaysDeliveries = await Order.countDocuments({
      agent: req.user.id,
      status: 'delivered',
      updatedAt: { $gte: startOfToday }
    });

    const freshProfile = await AgentProfile.findOne({ user: req.user.id }).populate('user', 'name email phone');
    const profileObj = freshProfile.toObject();
    profileObj.stats = {
      active: activeDeliveries,
      completed: completedDeliveries,
      today: todaysDeliveries
    };

    // Emit socket profile update to admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('agent:profile_update', {
        agentId: req.user.id,
        vehicleType: profileObj.vehicleType,
        phone: profileObj.user?.phone
      });
    }

    res.json(profileObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/agents/:id  (admin — get specific agent profile by user ID)
router.get('/:id', protect, requireRole('admin'), validateObjectIdParam('id'), async (req, res) => {
  try {
    const profile = await AgentProfile.findOne({ user: req.params.id }).populate('user', 'name email phone createdAt');
    if (!profile) return res.status(404).json({ message: 'Agent profile not found' });

    // Calculate stats dynamically for the specific agent
    const activeDeliveries = await Order.countDocuments({
      agent: req.params.id,
      status: { $in: ['accepted', 'picked_up'] }
    });

    const completedDeliveries = await Order.countDocuments({
      agent: req.params.id,
      status: 'delivered'
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaysDeliveries = await Order.countDocuments({
      agent: req.params.id,
      status: 'delivered',
      updatedAt: { $gte: startOfToday }
    });

    const profileObj = profile.toObject();
    profileObj.stats = {
      active: activeDeliveries,
      completed: completedDeliveries,
      today: todaysDeliveries
    };

    res.json(profileObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
