<div align="center">

# LocoDrop

### Hyperlocal Delivery, Simplified.

LocoDrop is a full-stack same-city delivery platform that connects senders with delivery agents — featuring real-time tracking, live route visualization, smart pricing, and complete operational oversight.

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-7EBC6F?style=for-the-badge&logo=openstreetmap&logoColor=white)](https://openstreetmap.org/)

</div>

---

##Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Delivery Lifecycle](#-delivery-lifecycle)
- [Pricing Model](#-pricing-model)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Real-Time Events](#-real-time-events)
- [Security](#-security)
- [Roadmap](#-roadmap)

---

## Overview

LocoDrop enables fast, transparent, and reliable same-city package delivery through three distinct user roles:

| Role | Responsibility |
|------|---------------|
|  **Sender** | Creates delivery requests and tracks packages in real time |
|  **Agent** | Accepts and completes deliveries with live location sharing |
|  **Administrator** | Monitors platform activity, agents, and delivery outcomes |

---

##  Features

###  Sender
- **Order Creation** — Specify pickup, drop, package category, receiver details, and delivery instructions
- **Automatic Pricing** — Delivery charges calculated from route distance, no manual input needed
- **Real-Time Tracking** — Live map view with agent location, route, and order status
- **Notifications** — Instant updates on acceptance, pickup, delivery, and cancellations
- **Delivery History** — Full record of past deliveries with durations, agents, and charges
- **Ratings & Feedback** — Rate delivery agents after successful completions

###  Agent
- **Availability Toggle** — Switch between Online / Offline to control delivery visibility
- **Order Management** — Browse available orders, accept deliveries, and update statuses
- **Live Location Sharing** — Continuous location updates for sender tracking
- **Dashboard** — View active/completed deliveries, daily earnings, and performance stats

###  Administrator
- **Platform Monitoring** — Full visibility into active, pending, and completed deliveries
- **Agent Management** — View profiles, availability, ratings, and delivery history
- **Delivery Oversight** — Track pickup/drop locations, timelines, agents, and outcomes
- **System Notifications** — Real-time updates on new orders, completions, and agent activity

---

##  Delivery Lifecycle

```
1. ORDER CREATED       → Sender submits pickup & drop details
        ↓
2. AGENT DISCOVERY     → Order becomes visible to available agents
        ↓
3. ORDER ACCEPTED      → Agent claims the delivery
        ↓
4. PACKAGE PICKED UP   → Agent collects package  [Status: picked_up]
        ↓
5. IN TRANSIT          → Sender monitors live progress on map
        ↓
6. DELIVERED           → Package reaches destination  [Status: delivered]
        ↓
7. FEEDBACK            → Sender rates the delivery experience
```

---

##  Pricing Model

LocoDrop uses a simple distance-based pricing model:

| Distance | Charge |
|----------|--------|
| Up to 800m | ₹20 flat fee |
| Beyond 800m | ₹20 + ₹6 per km |

> Pricing is calculated automatically from route distance — senders never enter charges manually.

---

##  Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React + Vite | UI framework and build tooling |
| React Router | Client-side routing |
| Axios | HTTP requests |
| React Leaflet | Interactive map rendering |
| Socket.io Client | Real-time event handling |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express.js | REST API server |
| Socket.io | WebSocket communication |
| MongoDB + Mongoose | Database and ODM |
| JWT + bcrypt | Authentication and password hashing |

### Mapping & Routing
| Technology | Purpose |
|------------|---------|
| OpenStreetMap | Base map tiles |
| Leaflet | Map interaction library |
| OSRM | Route calculation engine |

---

##  Project Structure

```
LocoDrop/
│
├── client/                   # React frontend
│   └── src/
│       ├── api/              # Axios API clients
│       ├── assets/           # Static assets
│       ├── components/       # Reusable UI components
│       ├── context/          # React context providers
│       ├── hooks/            # Custom React hooks
│       ├── pages/            # Route-level page components
│       ├── styles/           # Global and component styles
│       └── utils/            # Helper utilities
│
└── server/                   # Node.js backend
    ├── controllers/          # Request handlers
    ├── middleware/            # Auth and validation middleware
    ├── models/               # Mongoose schemas
    ├── routes/               # Express route definitions
    ├── services/             # Business logic layer
    ├── socket/               # Socket.io event handlers
    ├── utils/                # Utility functions
    └── config/               # Environment configuration
```

---

##  Getting Started

### Prerequisites

- Node.js v18+
- MongoDB instance (local or Atlas)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/locodrop.git
cd locodrop
```

```bash
# Install server dependencies
cd server
npm install
```

```bash
# Install client dependencies
cd ../client
npm install
```

### Environment Setup

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Running the App

```bash
# Start the backend server
cd server
npm run dev
```

```bash
# Start the frontend (in a new terminal)
cd client
npm run dev
```

The app will be available at `http://localhost:5173`

---

##  Real-Time Events

LocoDrop uses WebSockets (Socket.io) for live synchronization across all connected users:

| Event | Triggered When |
|-------|---------------|
| `order:created` | A new delivery request is submitted |
| `order:accepted` | An agent claims an order |
| `order:picked_up` | Package is collected from sender |
| `order:delivered` | Delivery is completed |
| `location:update` | Agent shares a new GPS coordinate |
| `agent:availability` | Agent goes online or offline |
| `notification:new` | A role-specific notification is sent |

---

##  Security

- **JWT Authentication** — Stateless token-based auth with protected routes
- **Role-Based Access Control** — Senders, agents, and admins each access only their permitted features
- **Request Validation** — All incoming data is validated server-side before processing
- **Password Hashing** — bcrypt used for secure credential storage
- **Server-Side Logic** — Sensitive operations handled on the backend to prevent client-side manipulation

---


