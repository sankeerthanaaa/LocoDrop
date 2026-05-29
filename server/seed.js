/**
 * Seed script — run with: node seed.js
 * Creates demo admin, sender, agent + 3 posted orders in Hyderabad
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import User from './models/User.js';
import Order from './models/Order.js';
import AgentProfile from './models/AgentProfile.js';
import Notification from './models/Notification.js';
import { toGeoPoint } from './utils/geo.js';

await mongoose.connect(process.env.MONGO_URI);
console.log('✅ Connected to MongoDB');

const seedEmails = ['admin@locodrop.com', 'sender@locodrop.com', 'agent@locodrop.com'];
const fullReset = process.env.SEED_RESET === 'true';

if (fullReset) {
  await Promise.all([
    Notification.deleteMany({}),
    AgentProfile.deleteMany({}),
    Order.deleteMany({}),
    User.deleteMany({}),
  ]);
  console.log('Full database reset complete');
} else {
  const existingSeedUsers = await User.find({ email: { $in: seedEmails } }).select('_id');
  const seedUserIds = existingSeedUsers.map((user) => user._id);
  const seedOrderIds = await Order.find({
    $or: [{ sender: { $in: seedUserIds } }, { agent: { $in: seedUserIds } }],
  }).distinct('_id');

  await Promise.all([
    Notification.deleteMany({
      $or: [{ recipient: { $in: seedUserIds } }, { orderId: { $in: seedOrderIds } }],
    }),
    AgentProfile.deleteMany({ user: { $in: seedUserIds } }),
    Order.deleteMany({ _id: { $in: seedOrderIds } }),
    User.deleteMany({ email: { $in: seedEmails } }),
  ]);
  console.log('Cleared previous demo seed records only');
}

const hash = (pw) => bcrypt.hash(pw, 12);

// Create users
const [admin, sender, agent] = await Promise.all([
  User.create({ name: 'Admin User',    email: 'admin@locodrop.com',  password: await hash('admin123'),  role: 'admin' }),
  User.create({ name: 'Priya Sharma',  email: 'sender@locodrop.com', password: await hash('sender123'), role: 'sender', phone: '9876543210' }),
  User.create({ name: 'Ravi Kumar',    email: 'agent@locodrop.com',  password: await hash('agent123'),  role: 'agent',  phone: '9123456780' }),
]);
console.log('👥 Users created');

await AgentProfile.create({
  user: agent._id,
  vehicleType: 'bike',
  isOnline: true,
  currentLocation: { lat: 17.385, lng: 78.486 },
  location: toGeoPoint({ lat: 17.385, lng: 78.486 }),
  lastSeen: new Date(),
  totalDeliveries: 12,
  rating: 4.8,
});
console.log('🛵 Agent profile created');

// 3 demo orders near Hyderabad
const orders = [
  {
    sender: sender._id,
    pickupAddress: 'Banjara Hills, Road No. 12, Hyderabad',
    dropAddress:   'Jubilee Hills, Check Post, Hyderabad',
    pickupCoords:  { lat: 17.4126, lng: 78.4520 },
    dropCoords:    { lat: 17.4317, lng: 78.4074 },
    description:   'Birthday cake — handle with care',
    price:         80,
    status:        'posted',
    pickupLocation: toGeoPoint({ lat: 17.4126, lng: 78.4520 }),
    dropLocation:   toGeoPoint({ lat: 17.4317, lng: 78.4074 }),
    statusHistory: [{ status: 'posted', actor: sender._id }],
  },
  {
    sender: sender._id,
    pickupAddress: 'Madhapur, Hi-Tech City, Hyderabad',
    dropAddress:   'Gachibowli, DLF Cybercity, Hyderabad',
    pickupCoords:  { lat: 17.4486, lng: 78.3694 },
    dropCoords:    { lat: 17.4401, lng: 78.3489 },
    description:   'USB-C laptop charger (urgent)',
    price:         60,
    status:        'posted',
    pickupLocation: toGeoPoint({ lat: 17.4486, lng: 78.3694 }),
    dropLocation:   toGeoPoint({ lat: 17.4401, lng: 78.3489 }),
    statusHistory: [{ status: 'posted', actor: sender._id }],
  },
  {
    sender: sender._id,
    pickupAddress: 'Ameerpet Metro Station, Hyderabad',
    dropAddress:   'SR Nagar, Hyderabad',
    pickupCoords:  { lat: 17.4376, lng: 78.4483 },
    dropCoords:    { lat: 17.4453, lng: 78.4343 },
    description:   'Documents envelope',
    price:         45,
    status:        'posted',
    pickupLocation: toGeoPoint({ lat: 17.4376, lng: 78.4483 }),
    dropLocation:   toGeoPoint({ lat: 17.4453, lng: 78.4343 }),
    statusHistory: [{ status: 'posted', actor: sender._id }],
  },
];

await Order.insertMany(orders);
console.log('📦 3 demo orders created');

console.log('\n🎉 Seed complete! Demo credentials:');
console.log('   Admin  → admin@locodrop.com  / admin123');
console.log('   Sender → sender@locodrop.com / sender123');
console.log('   Agent  → agent@locodrop.com  / agent123\n');

await mongoose.disconnect();
process.exit(0);
