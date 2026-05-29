import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { USER_ROLES } from '../models/User.js';
import AgentProfile from '../models/AgentProfile.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import {
  normalizeEmail,
  normalizePhone,
  isValidAlphaName,
  isValidEmail,
  isValidPhone,
  validatePasswordStrength,
} from '../utils/validators.js';

const router = express.Router();
const PUBLIC_REGISTRATION_ROLES = ['sender', 'agent'];

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', validateRequest([
  (req) => {
    const { name, email, password, role, phone } = req.body;
    const errors = [];

    if (!name) errors.push({ field: 'name', message: 'Name is required' });
    else if (!isValidAlphaName(name)) {
      errors.push({ field: 'name', message: 'Name must contain only alphabetic characters and spaces' });
    }

    if (!email) errors.push({ field: 'email', message: 'Email is required' });
    else if (!isValidEmail(email)) errors.push({ field: 'email', message: 'Valid email is required' });

    if (!password) errors.push({ field: 'password', message: 'Password is required' });
    else {
      validatePasswordStrength(password).forEach((message) =>
        errors.push({ field: 'password', message })
      );
    }

    const requestedRole = role || 'sender';
    if (!USER_ROLES.includes(requestedRole)) errors.push({ field: 'role', message: 'Invalid role' });
    else if (!PUBLIC_REGISTRATION_ROLES.includes(requestedRole)) {
      errors.push({ field: 'role', message: 'Admin users cannot be created through public registration' });
    }

    if (!isValidPhone(phone)) {
      errors.push({ field: 'phone', message: 'Phone number must be 10 to 15 digits and may start with +' });
    }

    return errors;
  },
]), async (req, res) => {
  try {
    const { name, email, password, role, phone, vehicleType } = req.body;
    const cleanEmail = normalizeEmail(email);
    const requestedRole = role || 'sender';

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashed,
      role: requestedRole,
      phone: normalizePhone(phone),
    });

    // Auto-create AgentProfile for agents
    if (user.role === 'agent') {
      await AgentProfile.create({ user: user._id, vehicleType: vehicleType || 'bike' });
    }

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', validateRequest([
  (req) => {
    const errors = [];
    if (!req.body.email) errors.push({ field: 'email', message: 'Email is required' });
    else if (!isValidEmail(req.body.email)) errors.push({ field: 'email', message: 'Valid email is required' });
    if (!req.body.password) errors.push({ field: 'password', message: 'Password is required' });
    return errors;
  },
]), async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = normalizeEmail(email);

    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (!USER_ROLES.includes(user.role)) {
      return res.status(403).json({ message: 'User role is invalid' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
