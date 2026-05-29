import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import { validateEnv } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import socketHandler from './socket/socketHandler.js';
import User, { USER_ROLES } from './models/User.js';
import { isValidObjectId } from './utils/objectId.js';

import authRoutes         from './routes/authRoutes.js';
import orderRoutes        from './routes/orderRoutes.js';
import agentRoutes        from './routes/agentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// ── Connect DB ────────────────────────────────────────────────
validateEnv();
await connectDB();

// ── Express app ──────────────────────────────────────────────
const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts, please try again later' },
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/agents',        agentRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', version: '1.0.0' }));

app.use(notFound);
app.use(errorHandler);

// ── HTTP + Socket.io ──────────────────────────────────────────
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Socket.io JWT middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));

  if (!process.env.JWT_SECRET) return next(new Error('JWT secret is not configured'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id || !isValidObjectId(decoded.id)) {
      return next(new Error('Invalid token payload'));
    }

    const user = await User.findById(decoded.id).select('name email role');
    if (!user) return next(new Error('User no longer exists'));
    if (!USER_ROLES.includes(user.role)) return next(new Error('Invalid user role'));

    socket.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    socket.handshake.auth.user = socket.user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) return next(new Error('Token has expired'));
    next(new Error('Invalid token'));
  }
});

// Attach io to app so routes can emit events via req.app.get('io')
app.set('io', io);

// Register all socket event handlers
socketHandler(io);

// ── Start server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 LocoDrop server running on http://localhost:${PORT}`);
});
