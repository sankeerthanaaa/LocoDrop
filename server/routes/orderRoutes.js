import express from 'express';
import Order, { ORDER_STATUSES } from '../models/Order.js';
import User from '../models/User.js';
import AgentProfile from '../models/AgentProfile.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { validateObjectIdParam, validateRequest } from '../middleware/validationMiddleware.js';
import { createNotification } from '../services/notificationService.js';
import { toGeoPoint } from '../utils/geo.js';
import { isNonEmptyString, isValidPrice, isValidLatitude, isValidLongitude } from '../utils/validators.js';
import { isAddressInServiceArea } from '../config/serviceAreas.js';
import { calculateDeliveryFee } from '../utils/calculateDeliveryFee.js';

const router = express.Router();
const AGENT_STATUS_UPDATES = ['picked_up', 'delivered'];



const emitToRoom = (req, room, event, payload) => {
  const io = req.app.get('io');
  if (io) io.to(room).emit(event, payload);
};

const idToString = (value) => {
  if (!value) return null;
  if (value._id) return value._id.toString();
  return value.toString();
};

const canAccessOrder = (user, order) => {
  if (user.role === 'admin') return true;
  if (user.role === 'sender') return idToString(order.sender) === user.id;
  if (user.role === 'agent') return idToString(order.agent) === user.id;
  return false;
};

const nextAgentStatusByCurrentStatus = {
  accepted: 'picked_up',
  picked_up: 'delivered',
};

// POST /api/orders/estimate  (sender)
router.post('/estimate', protect, requireRole('sender'), validateRequest([
  (req) => {
    const errors = [];
    if (!isNonEmptyString(req.body.pickupAddress)) {
      errors.push({ field: 'pickupAddress', message: 'pickupAddress is required' });
    }
    if (!isNonEmptyString(req.body.dropAddress)) {
      errors.push({ field: 'dropAddress', message: 'dropAddress is required' });
    }

    // Pickup Coordinates Validation
    const pickupCoords = req.body.pickupCoords;
    if (!pickupCoords) {
      errors.push({ field: 'pickupCoords', message: 'pickupCoords is required' });
    } else {
      if (!isValidLatitude(pickupCoords.lat)) {
        errors.push({ field: 'pickupCoords.lat', message: 'pickupCoords.lat must be a valid latitude between -90 and 90' });
      }
      if (!isValidLongitude(pickupCoords.lng)) {
        errors.push({ field: 'pickupCoords.lng', message: 'pickupCoords.lng must be a valid longitude between -180 and 180' });
      }
    }

    // Drop Coordinates Validation
    const dropCoords = req.body.dropCoords;
    if (!dropCoords) {
      errors.push({ field: 'dropCoords', message: 'dropCoords is required' });
    } else {
      if (!isValidLatitude(dropCoords.lat)) {
        errors.push({ field: 'dropCoords.lat', message: 'dropCoords.lat must be a valid latitude between -90 and 90' });
      }
      if (!isValidLongitude(dropCoords.lng)) {
        errors.push({ field: 'dropCoords.lng', message: 'dropCoords.lng must be a valid longitude between -180 and 180' });
      }
    }

    return errors;
  },
]), async (req, res) => {
  try {
    const { pickupAddress, dropAddress, pickupCoords, dropCoords } = req.body;

    const isPickupAllowed = isAddressInServiceArea(pickupAddress);
    const isDropAllowed = isAddressInServiceArea(dropAddress);

    if (!isPickupAllowed || !isDropAllowed) {
      return res.status(200).json({
        serviceAvailable: false,
        message: 'Service not available in this area yet.'
      });
    }

    const pricing = await calculateDeliveryFee(pickupCoords, dropCoords);
    res.json({
      serviceAvailable: true,
      ...pricing
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/orders  (sender)
router.post('/', protect, requireRole('sender'), validateRequest([
  (req) => {
    const errors = [];
    if (!isNonEmptyString(req.body.pickupAddress)) {
      errors.push({ field: 'pickupAddress', message: 'pickupAddress is required' });
    }
    if (!isNonEmptyString(req.body.dropAddress)) {
      errors.push({ field: 'dropAddress', message: 'dropAddress is required' });
    }

    // Pickup Coordinates Validation
    const pickupCoords = req.body.pickupCoords;
    if (!pickupCoords) {
      errors.push({ field: 'pickupCoords', message: 'pickupCoords is required' });
    } else {
      if (!isValidLatitude(pickupCoords.lat)) {
        errors.push({ field: 'pickupCoords.lat', message: 'pickupCoords.lat must be a valid latitude between -90 and 90' });
      }
      if (!isValidLongitude(pickupCoords.lng)) {
        errors.push({ field: 'pickupCoords.lng', message: 'pickupCoords.lng must be a valid longitude between -180 and 180' });
      }
    }

    // Drop Coordinates Validation
    const dropCoords = req.body.dropCoords;
    if (!dropCoords) {
      errors.push({ field: 'dropCoords', message: 'dropCoords is required' });
    } else {
      if (!isValidLatitude(dropCoords.lat)) {
        errors.push({ field: 'dropCoords.lat', message: 'dropCoords.lat must be a valid latitude between -90 and 90' });
      }
      if (!isValidLongitude(dropCoords.lng)) {
        errors.push({ field: 'dropCoords.lng', message: 'dropCoords.lng must be a valid longitude between -180 and 180' });
      }
    }

    if (req.body.pickupFlatNumber && req.body.pickupFlatNumber.length > 100) {
      errors.push({ field: 'pickupFlatNumber', message: 'Pickup flat number must be 100 characters or less' });
    }
    if (req.body.pickupLandmark && req.body.pickupLandmark.length > 150) {
      errors.push({ field: 'pickupLandmark', message: 'Pickup landmark must be 150 characters or less' });
    }
    if (req.body.dropFlatNumber && req.body.dropFlatNumber.length > 100) {
      errors.push({ field: 'dropFlatNumber', message: 'Drop flat number must be 100 characters or less' });
    }
    if (req.body.dropLandmark && req.body.dropLandmark.length > 150) {
      errors.push({ field: 'dropLandmark', message: 'Drop landmark must be 150 characters or less' });
    }
    if (req.body.deliveryInstructions && req.body.deliveryInstructions.length > 300) {
      errors.push({ field: 'deliveryInstructions', message: 'Delivery instructions must be 300 characters or less' });
    }
    if (!isNonEmptyString(req.body.category)) {
      errors.push({ field: 'category', message: 'category is required' });
    } else if (!['Groceries', 'Documents', 'Electronics', 'Food', 'Medicine', 'Other'].includes(req.body.category)) {
      errors.push({ field: 'category', message: 'category must be one of: Groceries, Documents, Electronics, Food, Medicine, Other' });
    }

    return errors;
  },
]), async (req, res) => {
  try {
    const { 
      pickupAddress, 
      dropAddress, 
      pickupCoords, 
      dropCoords, 
      description, 
      category,
      pickupFlatNumber,
      pickupLandmark,
      dropFlatNumber,
      dropLandmark,
      deliveryInstructions
    } = req.body;

    const isPickupAllowed = isAddressInServiceArea(pickupAddress);
    const isDropAllowed = isAddressInServiceArea(dropAddress);

    if (!isPickupAllowed || !isDropAllowed) {
      return res.status(400).json({ message: 'Service not available in this area yet.' });
    }

    const parsedPickupCoords = {
      lat: Number(pickupCoords.lat),
      lng: Number(pickupCoords.lng)
    };
    
    const parsedDropCoords = {
      lat: Number(dropCoords.lat),
      lng: Number(dropCoords.lng)
    };

    const pricing = await calculateDeliveryFee(parsedPickupCoords, parsedDropCoords);

    const order = await Order.create({
      sender: req.user.id,
      pickupAddress: pickupAddress.trim(),
      dropAddress: dropAddress.trim(),
      pickupCoords: parsedPickupCoords,
      dropCoords: parsedDropCoords,
      pickupLocation: toGeoPoint(parsedPickupCoords),
      dropLocation: toGeoPoint(parsedDropCoords),
      description,
      category,
      pickupFlatNumber: pickupFlatNumber ? pickupFlatNumber.trim() : '',
      pickupLandmark: pickupLandmark ? pickupLandmark.trim() : '',
      dropFlatNumber: dropFlatNumber ? dropFlatNumber.trim() : '',
      dropLandmark: dropLandmark ? dropLandmark.trim() : '',
      deliveryInstructions: deliveryInstructions ? deliveryInstructions.trim() : '',
      price: pricing.deliveryFee, // Set directly by backend calculator
      statusHistory: [{ status: 'posted', actor: req.user.id }],
    });
    await order.populate('sender', 'name email phone');

    // Broadcast to all online agents + admin
    emitToRoom(req, 'agents', 'new:order', order);
    emitToRoom(req, 'admin', 'new:order', order);

    // Simple unassigned escalation system (MVP only - 5 minutes)
    setTimeout(async () => {
      try {
        const freshOrder = await Order.findById(order._id);
        if (freshOrder && freshOrder.status === 'posted' && !freshOrder.agent) {
          const io = req.app.get('io');
          if (io) {
            io.to('agents').emit('order:escalated', freshOrder);
            io.to('admin').emit('order:escalated', freshOrder);
            console.log(`Order #${freshOrder._id} escalated after 5 minutes unassigned.`);
          }
        }
      } catch (err) {
        console.error('Unassigned order escalation timer error:', err);
      }
    }, 5 * 60 * 1000);

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders  (admin — all orders)
router.get('/', protect, requireRole('admin'), validateRequest([
  (req) =>
    req.query.status && !ORDER_STATUSES.includes(req.query.status)
      ? { field: 'status', message: `status must be one of: ${ORDER_STATUSES.join(', ')}` }
      : null,
]), async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const orders = await Order.find(filter)
      .populate('sender', 'name email')
      .populate('agent', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/my  (sender — own orders)
router.get('/my', protect, requireRole('sender'), async (req, res) => {
  try {
    const orders = await Order.find({ sender: req.user.id })
      .populate('agent', 'name phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/nearby  (agent — all posted orders)
router.get('/nearby', protect, requireRole('agent'), async (req, res) => {
  try {
    const orders = await Order.find({ status: 'posted' })
      .populate('sender', 'name phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/agent-active  (agent — their current active order)
router.get('/agent-active', protect, requireRole('agent'), async (req, res) => {
  try {
    const order = await Order.findOne({
      agent: req.user.id,
      status: { $in: ['accepted', 'picked_up'] },
    })
      .populate('sender', 'name phone')
      .populate('agent', 'name phone');
    res.json(order || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/:id  (any authenticated user)
router.get('/:id', protect, validateObjectIdParam('id'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('sender', 'name email phone')
      .populate('agent', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!canAccessOrder(req.user, order)) {
      return res.status(403).json({ message: 'You are not allowed to access this order' });
    }

    const orderObj = order.toObject();
    if (order.agent) {
      const profile = await AgentProfile.findOne({ user: order.agent._id });
      if (profile) {
        orderObj.agent.profile = {
          rating: profile.rating,
          vehicleType: profile.vehicleType,
          totalDeliveries: profile.totalDeliveries,
          createdAt: profile.createdAt,
          isOnline: profile.isOnline,
        };
        if (profile.currentLocation) {
          orderObj.agent.currentLocation = profile.currentLocation;
        }
      }
    }

    res.json(orderObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/accept  (agent — atomic to prevent double-accept)
router.put('/:id/accept', protect, requireRole('agent'), validateObjectIdParam('id'), async (req, res) => {
  try {
    const agent = await User.findOne({ _id: req.user.id, role: 'agent' });
    if (!agent) return res.status(403).json({ message: 'Only valid agent users can accept orders' });

    const profile = await AgentProfile.findOne({ user: req.user.id });
    if (!profile || !profile.isOnline) {
      return res.status(400).json({ message: 'You must be online before accepting orders.' });
    }

    const activeOrder = await Order.findOne({
      agent: req.user.id,
      status: { $in: ['accepted', 'picked_up'] },
    }).select('_id status');
    if (activeOrder) {
      return res.status(409).json({
        message: 'Agent already has an active order',
        activeOrderId: activeOrder._id,
        activeOrderStatus: activeOrder.status,
      });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, status: 'posted', agent: null },
      {
        status: 'accepted',
        agent: req.user.id,
        acceptedAt: new Date(),
        $push: { statusHistory: { status: 'accepted', actor: req.user.id } },
      },
      { new: true }
    )
      .populate('sender', 'name email phone')
      .populate('agent', 'name email phone');

    if (!order) return res.status(400).json({ message: 'Order already taken or not found' });

    await createNotification(req, {
      recipient: order.sender._id,
      message: `Your order has been accepted by ${order.agent.name}`,
      orderId: order._id,
    });

    emitToRoom(req, `order:${order._id}`, 'order:accepted', {
      orderId: order._id,
      agentId: req.user.id,
      agentName: order.agent.name,
    });
    emitToRoom(req, 'agents', 'order:taken', { orderId: order._id });
    emitToRoom(req, 'admin', 'order:accepted', { orderId: order._id, agentName: order.agent.name, agentId: req.user.id });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/status  (agent — picked_up or delivered)
router.put('/:id/status', protect, requireRole('agent'), validateObjectIdParam('id'), validateRequest([
  (req) =>
    AGENT_STATUS_UPDATES.includes(req.body.status)
      ? null
      : { field: 'status', message: `status must be one of: ${AGENT_STATUS_UPDATES.join(', ')}` },
]), async (req, res) => {
  try {
    const { status } = req.body;

    const existingOrder = await Order.findOne({ _id: req.params.id, agent: req.user.id });
    if (!existingOrder) return res.status(404).json({ message: 'Order not found or unauthorized' });

    const expectedNextStatus = nextAgentStatusByCurrentStatus[existingOrder.status];
    if (expectedNextStatus !== status) {
      return res.status(409).json({
        message: `Invalid status transition from ${existingOrder.status} to ${status}`,
        currentStatus: existingOrder.status,
        allowedNextStatus: expectedNextStatus || null,
      });
    }

    const updateFields = {
      status,
      $push: { statusHistory: { status, actor: req.user.id } },
    };

    if (status === 'picked_up') {
      updateFields.pickedUpAt = new Date();
    } else if (status === 'delivered') {
      updateFields.deliveredAt = new Date();
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, agent: req.user.id, status: existingOrder.status },
      updateFields,
      { new: true }
    ).populate('sender', 'name email');

    if (!order) return res.status(409).json({ message: 'Order status changed before this update could complete' });

    if (status === 'picked_up') {
      await createNotification(req, {
        recipient: order.sender._id,
        message: 'Your order has been picked up',
        orderId: order._id,
      });
    }

    if (status === 'delivered') {
      // Increment totalDeliveries
      await AgentProfile.findOneAndUpdate({ user: req.user.id }, { $inc: { totalDeliveries: 1 } });

      await createNotification(req, {
        recipient: order.sender._id,
        message: 'Your order has been delivered',
        orderId: order._id,
      });

      // Emit updated stats to the agent socket room
      const io = req.app.get('io');
      if (io) {
        const activeDeliveries = await Order.countDocuments({ agent: req.user.id, status: { $in: ['accepted', 'picked_up'] } });
        const completedDeliveries = await Order.countDocuments({ agent: req.user.id, status: 'delivered' });
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todaysDeliveries = await Order.countDocuments({ agent: req.user.id, status: 'delivered', deliveredAt: { $gte: startOfToday } });
        const todaysOrders = await Order.find({ agent: req.user.id, status: 'delivered', deliveredAt: { $gte: startOfToday } }, 'price');
        const todayEarnings = todaysOrders.reduce((sum, o) => sum + (o.price || 0), 0);
        
        io.to(`user:${req.user.id}`).emit('agent:stats', {
          active: activeDeliveries,
          completed: completedDeliveries,
          today: todaysDeliveries,
          todayEarnings: todayEarnings
        });
      }
    }

    const payload = { 
      orderId: order._id, 
      status, 
      agentId: req.user.id,
      timestamp: new Date() 
    };
    emitToRoom(req, `order:${order._id}`, 'order:status', payload);
    emitToRoom(req, 'admin', 'order:status', payload);

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/cancel  (sender — only if posted)
router.put('/:id/cancel', protect, requireRole('sender'), validateObjectIdParam('id'), async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, sender: req.user.id, status: 'posted' },
      { status: 'cancelled', $push: { statusHistory: { status: 'cancelled', actor: req.user.id } } },
      { new: true }
    );
    if (!order) return res.status(400).json({ message: 'Cannot cancel: order not found or already in progress' });

    await createNotification(req, {
      recipient: order.sender,
      message: 'Your order has been cancelled',
      orderId: order._id,
    });

    const payload = { orderId: order._id };
    emitToRoom(req, `order:${order._id}`, 'order:cancelled', payload);
    emitToRoom(req, 'agents', 'order:cancelled', payload);
    emitToRoom(req, 'admin', 'order:cancelled', payload);

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/override  (admin — override any status)
router.put('/:id/override', protect, requireRole('admin'), validateObjectIdParam('id'), validateRequest([
  (req) =>
    ORDER_STATUSES.includes(req.body.status)
      ? null
      : { field: 'status', message: `status must be one of: ${ORDER_STATUSES.join(', ')}` },
]), async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, $push: { statusHistory: { status, actor: req.user.id, note: 'admin override' } } },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await createNotification(req, {
      recipient: order.sender,
      message: `Admin updated your order status to ${status}`,
      orderId: order._id,
    });

    if (order.agent) {
      await createNotification(req, {
        recipient: order.agent,
        message: `Admin updated an assigned order status to ${status}`,
        orderId: order._id,
      });
    }

    emitToRoom(req, `order:${order._id}`, 'order:status', { orderId: order._id, status, timestamp: new Date() });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/rate  (sender — rate a delivered delivery)
router.put('/:id/rate', protect, requireRole('sender'), validateObjectIdParam('id'), validateRequest([
  (req) => {
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { field: 'rating', message: 'Rating must be an integer between 1 and 5' };
    }
    return null;
  }
]), async (req, res) => {
  try {
    const { rating } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the sender of this order can submit a rating' });
    }
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Only delivered orders can be rated' });
    }
    if (order.rating !== null) {
      return res.status(400).json({ message: 'This delivery has already been rated' });
    }

    // Save rating on the order
    order.rating = rating;
    await order.save();

    // Recalculate agent's average rating dynamically
    if (order.agent) {
      const ratedOrders = await Order.find({
        agent: order.agent,
        status: 'delivered',
        rating: { $ne: null }
      });

      const totalRating = ratedOrders.reduce((sum, o) => sum + o.rating, 0);
      const averageRating = ratedOrders.length > 0 ? parseFloat((totalRating / ratedOrders.length).toFixed(1)) : 5.0;

      await AgentProfile.findOneAndUpdate(
        { user: order.agent },
        { rating: averageRating }
      );

      // Create notification for the agent
      await createNotification(req, {
        recipient: order.agent,
        message: `You received a ${rating}-star rating for order #${order._id.toString().slice(-6).toUpperCase()}`,
        orderId: order._id
      });

      // Emits rating update to admins
      emitToRoom(req, 'admin', 'agent:rating', { agentId: order.agent, rating: averageRating });
    }

    await order.populate('sender', 'name email phone');
    await order.populate('agent', 'name email phone');
    
    const orderObj = order.toObject();
    
    if (order.agent) {
      const profile = await AgentProfile.findOne({ user: order.agent._id });
      if (profile) {
        orderObj.agent.profile = {
          rating: profile.rating,
          vehicleType: profile.vehicleType,
          totalDeliveries: profile.totalDeliveries,
          createdAt: profile.createdAt,
          isOnline: profile.isOnline,
        };
        if (profile.currentLocation) {
          orderObj.agent.currentLocation = profile.currentLocation;
        }
      }
    }

    res.json(orderObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/add-fee (sender)
router.put('/:id/add-fee', protect, requireRole('sender'), validateObjectIdParam('id'), validateRequest([
  (req) => {
    const errors = [];
    const fee = Number(req.body.fee);
    if (isNaN(fee) || fee <= 0) {
      errors.push({ field: 'fee', message: 'Fee must be a positive number' });
    }
    return errors;
  }
]), async (req, res) => {
  try {
    const { fee } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the sender of this order can add a fee' });
    }
    if (order.status !== 'posted') {
      return res.status(400).json({ message: 'Fees can only be added to pending orders' });
    }

    order.price += Number(fee);
    await order.save();

    // Broadcast updated price to agents, admin, and the order's specific room
    emitToRoom(req, 'agents', 'order:price_updated', { orderId: order._id, price: order.price });
    emitToRoom(req, 'admin', 'order:price_updated', { orderId: order._id, price: order.price });
    emitToRoom(req, `order:${order._id}`, 'order:price_updated', { orderId: order._id, price: order.price });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
