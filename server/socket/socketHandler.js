import AgentProfile from '../models/AgentProfile.js';
import Order from '../models/Order.js';
import { toGeoPoint } from '../utils/geo.js';
import { isValidObjectId } from '../utils/objectId.js';
import { isValidLatitude, isValidLongitude } from '../utils/validators.js';

const ACTIVE_DELIVERY_STATUSES = ['accepted', 'picked_up'];

const idToString = (value) => {
  if (!value) return null;
  if (value._id) return value._id.toString();
  return value.toString();
};

const canJoinOrderRoom = (user, order) => {
  if (user.role === 'admin') return true;
  if (user.role === 'sender') return idToString(order.sender) === user.id;
  if (user.role === 'agent') return idToString(order.agent) === user.id;
  return false;
};

const emitSocketError = (socket, message, code) => {
  socket.emit('socket:error', {
    message,
    ...(code ? { code } : {}),
  });
};

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    const user = socket.user || socket.handshake.auth?.user;
    if (!user?.id || !user?.role) {
      socket.disconnect(true);
      return;
    }

    socket.join(`user:${user.id}`);
    if (user.role === 'admin') socket.join('admin');

    console.log(`Socket connected: ${user.name} (${user.role}) [${socket.id}]`);

    socket.on('join:order', async ({ orderId } = {}) => {
      try {
        if (!isValidObjectId(orderId)) {
          return emitSocketError(socket, 'orderId must be a valid ObjectId', 'INVALID_ORDER_ID');
        }

        const order = await Order.findById(orderId).select('sender agent status');
        if (!order) return emitSocketError(socket, 'Order not found', 'ORDER_NOT_FOUND');
        if (!canJoinOrderRoom(user, order)) {
          return emitSocketError(socket, 'You are not allowed to join this order room', 'ORDER_ROOM_FORBIDDEN');
        }

        socket.join(`order:${orderId}`);
        socket.emit('joined:order', { orderId });
        console.log(`Order room joined: ${user.name} -> order:${orderId}`);
      } catch (err) {
        console.error('Socket join:order error:', err);
        emitSocketError(socket, 'Unable to join order room', 'ORDER_JOIN_FAILED');
      }
    });

    socket.on('join:agents', async () => {
      try {
        if (user.role !== 'agent') {
          return emitSocketError(socket, 'Only agents can join the agents room', 'AGENTS_ROOM_FORBIDDEN');
        }

        const profile = await AgentProfile.findOneAndUpdate(
          { user: user.id },
          { isOnline: true, lastSeen: new Date() },
          { new: true }
        );

        if (!profile) return emitSocketError(socket, 'Agent profile not found', 'AGENT_PROFILE_NOT_FOUND');

        socket.join('agents');
        socket.emit('joined:agents', { isOnline: profile.isOnline });
        io.to('admin').emit('agent:toggle', { agentId: user.id, isOnline: true });
        console.log(`Agents room joined: ${user.name} [${socket.id}]`);
      } catch (err) {
        console.error('Socket join:agents error:', err);
        emitSocketError(socket, 'Unable to join agents room', 'AGENTS_JOIN_FAILED');
      }
    });

    socket.on('update:location', async ({ orderId, lat, lng } = {}) => {
      try {
        if (user.role !== 'agent') {
          return emitSocketError(socket, 'Only agents can update delivery location', 'LOCATION_FORBIDDEN');
        }
        if (!isValidObjectId(orderId)) {
          return emitSocketError(socket, 'orderId must be a valid ObjectId', 'INVALID_ORDER_ID');
        }
        if (!isValidLatitude(lat) || !isValidLongitude(lng)) {
          return emitSocketError(socket, 'lat/lng must be valid coordinates', 'INVALID_COORDS');
        }

        const order = await Order.findOne({
          _id: orderId,
          agent: user.id,
          status: { $in: ACTIVE_DELIVERY_STATUSES },
        }).select('_id agent status');

        if (!order) {
          return emitSocketError(socket, 'Cannot broadcast location for this order', 'LOCATION_ORDER_FORBIDDEN');
        }

        const nextLocation = { lat: Number(lat), lng: Number(lng) };
        await AgentProfile.findOneAndUpdate(
          { user: user.id },
          {
            currentLocation: nextLocation,
            location: toGeoPoint(nextLocation),
            isOnline: true,
            lastSeen: new Date(),
          }
        );

        io.to(`order:${order._id}`).emit('agent:location', {
          orderId: order._id,
          lat: nextLocation.lat,
          lng: nextLocation.lng,
        });
      } catch (err) {
        console.error('Socket update:location error:', err);
        emitSocketError(socket, 'Unable to update location', 'LOCATION_UPDATE_FAILED');
      }
    });

    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${user.name} [${socket.id}]`);

      if (user.role !== 'agent') return;

      try {
        const remainingSockets = await io.in(`user:${user.id}`).fetchSockets();
        if (remainingSockets.length === 0) {
          const profile = await AgentProfile.findOneAndUpdate(
            { user: user.id },
            { isOnline: false, lastSeen: new Date() },
            { new: true }
          );

          if (profile) {
            io.to('admin').emit('agent:toggle', { agentId: user.id, isOnline: false });
          }
        }
      } catch (err) {
        console.error('Socket disconnect cleanup error:', err);
      }
    });
  });
};

export default socketHandler;
