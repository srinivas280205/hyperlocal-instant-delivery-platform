# QuickDrop — Hyperlocal Instant Delivery Platform

A full-stack hyperlocal delivery platform like Dunzo/Porter for personal, family, and urgent local deliveries within 1–25 km.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (PWA — works on browser + installable on phone) |
| Backend | Node.js + Express |
| Database | MongoDB (free Atlas) |
| Real-time | Socket.IO (live tracking) |
| Maps | Leaflet.js + OpenStreetMap (free, no API key needed) |
| Auth | JWT |

---

## Project Structure

```
Hyperlocal Instant Delivery Platform/
├── backend/
│   ├── src/
│   │   ├── models/          User.js, Order.js
│   │   ├── routes/          auth.js, orders.js, admin.js
│   │   ├── controllers/     authController.js, orderController.js, adminController.js
│   │   ├── middleware/      auth.js (JWT)
│   │   ├── socket/          index.js (real-time)
│   │   └── utils/           pricing.js, generateToken.js
│   ├── server.js
│   └── seed.js              (demo accounts)
└── frontend/
    └── src/
        ├── pages/
        │   ├── auth/         Login.js, Register.js
        │   ├── customer/     Home, BookDelivery, TrackOrder, Orders, Profile
        │   ├── rider/        Dashboard, Orders, Earnings, Profile
        │   └── admin/        Dashboard, Users, Orders, Analytics
        ├── components/       Layout, MapPicker, LiveTrackingMap, ProtectedRoute
        ├── context/          AuthContext.js
        ├── services/         api.js (Axios)
        └── utils/            helpers.js (constants, formatters)
```

---

## Setup Instructions

### Step 1 — MongoDB Atlas (Free)

1. Go to https://cloud.mongodb.com
2. Create a free account
3. Create a free M0 cluster
4. Click "Connect" → "Connect your application"
5. Copy the connection string (looks like `mongodb+srv://...`)

### Step 2 — Backend Setup

```bash
cd backend
copy .env.example .env
```

Edit `.env`:
```
MONGODB_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/hyperlocal
JWT_SECRET=any_long_random_string_here
PORT=5000
```

Install and run:
```bash
npm install
npm run seed        # Creates demo accounts
npm run dev         # Start backend (http://localhost:5000)
```

### Step 3 — Frontend Setup

```bash
cd frontend
npm install
npm start           # Opens http://localhost:3000
```

---

## Demo Accounts (after running seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@quickdrop.com | admin123 |
| Rider | rider@quickdrop.com | rider123 |
| Customer | user@quickdrop.com | user123 |

---

## Features

### Customer App
- Register / Login
- Book delivery (3-step: locations → package → confirm)
- Interactive map to pick pickup & dropoff locations
- 10 package types (medicine, food, tea, documents, fragile, gift, grocery, electronics, household, other)
- Express / Standard delivery speed
- Real-time price estimation
- Live order tracking with map
- OTP-based secure delivery confirmation
- Order history with filters
- Rate & review rider

### Rider App
- Online/Offline toggle
- View & accept nearby delivery requests
- Step-by-step status updates (Accepted → Picked Up → On The Way → Delivered)
- Real-time location sharing
- Earnings dashboard
- Delivery history

### Admin Panel
- Dashboard with live stats (users, riders, orders, revenue)
- User management (enable/disable accounts)
- All orders with status filter & pagination
- Analytics (revenue chart, package type popularity)

### Technical Features
- PWA (installable on phone like an app)
- JWT authentication with role-based access
- Socket.IO real-time notifications
- Distance-based pricing algorithm
- Haversine formula for distance calculation
- Service Worker for offline support

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |
| PUT | /api/auth/availability | Toggle rider availability |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/orders/estimate | Get price estimate |
| POST | /api/orders | Create order |
| GET | /api/orders/my | My orders |
| GET | /api/orders/pending | Pending orders (rider) |
| PUT | /api/orders/:id/accept | Accept order (rider) |
| PUT | /api/orders/:id/status | Update status (rider) |
| POST | /api/orders/:id/verify-otp | Verify delivery OTP |
| PUT | /api/orders/:id/cancel | Cancel order |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/dashboard | Stats |
| GET | /api/admin/users | All users |
| GET | /api/admin/orders | All orders |
| GET | /api/admin/analytics | Revenue analytics |

---

## Pricing Logic

```
Base price: ₹20
Per km rate: ₹8/km
Express multiplier: 1.5x
Weight: ₹5 per extra kg

Package surcharges:
  Fragile: +₹15
  Electronics: +₹20
  Household: +₹15
  Gift: +₹10
  Food/Grocery: +₹5
```

---

## Install as Mobile App (PWA)

### On Android (Chrome):
1. Open http://localhost:3000 in Chrome
2. Tap menu (⋮) → "Add to Home screen"
3. App installs like a native app

### On iPhone (Safari):
1. Open in Safari
2. Tap Share → "Add to Home Screen"

---

## Future Enhancements
- Push notifications (FCM)
- Real payment gateway (Razorpay)
- Chat between rider and customer
- Multi-stop delivery
- AI-based rider allocation
- Fleet management for businesses
