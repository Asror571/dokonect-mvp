# 🚀 DOKONECT - Distributor Management System

**Modern B2B platform for distributors and retail shops in Uzbekistan**

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Version](https://img.shields.io/badge/Version-1.0.0%20MVP-blue)
![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🎯 Overview

Dokonect is a comprehensive B2B platform that connects distributors with retail shops, enabling efficient order management, inventory tracking, credit (nasiya) management, and real-time communication.

### Key Benefits

- 📦 **Product Management** - Complete catalog with variants, pricing, and stock tracking
- 📋 **Order Processing** - Streamlined order workflow from creation to delivery
- 💰 **Credit System (Nasiya)** - Built-in debt tracking and payment management
- 💬 **Real-time Chat** - WebSocket-based messaging between distributors and shops
- 📊 **Analytics** - Comprehensive dashboard with sales insights
- 🚚 **Delivery Tracking** - Driver assignment and delivery status monitoring

---

## ✨ Features

### For Distributors

#### 1. Product Management
- ✅ Create, edit, delete products
- ✅ SKU management
- ✅ Multiple product variants (color, size, model)
- ✅ Bulk pricing rules
- ✅ Category and brand organization
- ✅ Image upload (multiple images per product)
- ✅ Stock tracking across warehouses
- ✅ Low stock alerts

#### 2. Order Management
- ✅ View all orders with filtering
- ✅ Accept/reject orders
- ✅ Assign drivers
- ✅ Track order status in real-time
- ✅ Order history and analytics
- ✅ Internal notes for orders

#### 3. Client Management
- ✅ Client approval workflow
- ✅ Client tiers (Bronze, Silver, Gold, VIP)
- ✅ Order history per client
- ✅ Debt tracking per client
- ✅ Loyalty points system
- ✅ Custom pricing per client

#### 4. Nasiya/Credit System
- ✅ Automatic debt creation on credit orders
- ✅ Payment recording
- ✅ Overdue detection
- ✅ Payment history
- ✅ Debt summary and statistics
- ✅ Multiple payment tracking

#### 5. Real-time Chat
- ✅ WebSocket-based messaging
- ✅ Chat rooms with clients
- ✅ Read receipts
- ✅ Typing indicators
- ✅ Online/offline status
- ✅ File and image sharing

#### 6. Dashboard & Analytics
- ✅ Today's sales statistics
- ✅ Active orders count
- ✅ Sales trend charts
- ✅ Top products
- ✅ Low stock alerts
- ✅ Quick actions

#### 7. Inventory Management
- ✅ Multi-warehouse support
- ✅ Stock adjustments
- ✅ Stock transfer between warehouses
- ✅ Stock history logs
- ✅ Minimum threshold alerts

#### 8. Delivery Management
- ✅ Driver management
- ✅ Driver assignment to orders
- ✅ Delivery status tracking
- ✅ Proof of delivery
- ✅ Driver performance stats

---

## 🛠 Tech Stack

### Backend
- **Runtime:** Node.js v22+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (jsonwebtoken)
- **WebSocket:** Socket.IO
- **Password Hashing:** bcrypt
- **Validation:** Zod
- **File Upload:** Multer
- **Image Storage:** Cloudinary (optional)

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite 8
- **Language:** TypeScript
- **Styling:** TailwindCSS 4
- **State Management:** Zustand
- **Data Fetching:** React Query (TanStack Query)
- **Routing:** React Router v7
- **WebSocket:** Socket.IO Client
- **Forms:** React Hook Form
- **Icons:** Lucide React
- **Charts:** Recharts
- **Notifications:** React Hot Toast

### Database
- **PostgreSQL** with Prisma ORM
- **Automated migrations**
- **Seed data for testing**

---

## 🚀 Quick Start

### Prerequisites

```bash
# Required
- Node.js v18+ (v22 recommended)
- PostgreSQL 14+
- npm or yarn

# Optional
- Redis (for caching)
- Cloudinary account (for image storage)
```

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/yourusername/dokonect.git
cd dokonect
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgresql://user:password@localhost:5432/dokonect

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run prisma:seed

# Start development server
npm run dev
```

Backend will run on `http://localhost:5000`

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Create .env file
cp .env.example .env

# Edit .env
# VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3001`

### Test Accounts

After seeding, you can use these accounts:

**Distributor:**
- Phone: `+998901234567`
- Password: `123456`

**Client/Shop:**
- Phone: `+998901111111`
- Password: `123456`

---

## 📁 Project Structure

```
dokonect/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Business logic
│   │   │   ├── distributor/  # Distributor-specific controllers
│   │   │   ├── auth.controller.ts
│   │   │   ├── order.controller.ts
│   │   │   └── ...
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── services/         # Reusable services
│   │   ├── sockets/          # WebSocket handlers
│   │   │   ├── chat.socket.ts
│   │   │   └── order.socket.ts
│   │   ├── prisma/           # Prisma client
│   │   └── app.ts            # Express app
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   ├── migrations/       # Database migrations
│   │   └── seed.ts           # Seed data
│   ├── uploads/              # File uploads
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/            # Page components
│   │   │   ├── distributor/  # Distributor pages
│   │   │   ├── client/       # Client pages
│   │   │   └── auth/         # Auth pages
│   │   ├── components/       # Reusable components
│   │   │   ├── ui/           # UI components
│   │   │   ├── dashboard/    # Dashboard components
│   │   │   ├── order/        # Order components
│   │   │   └── ...
│   │   ├── api/              # API calls
│   │   ├── hooks/            # Custom hooks
│   │   ├── store/            # State management (Zustand)
│   │   ├── lib/              # Utilities
│   │   └── App.tsx
│   └── package.json
│
├── test-api.sh               # API testing script
├── test-websocket.js         # WebSocket testing
├── MVP_TEST_REPORT.md        # Complete test results
├── MANUAL_TEST_GUIDE.md      # Manual testing guide
├── DEPLOYMENT_READY.md       # Deployment instructions
└── README.md                 # This file
```

---

## 📚 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

### Main Endpoints

#### Authentication
```http
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login
POST   /api/auth/refresh           # Refresh token
```

#### Products (Distributor)
```http
POST   /api/distributor/products              # Create product
GET    /api/distributor/products              # Get all products
GET    /api/distributor/products/:id          # Get product
PUT    /api/distributor/products/:id          # Update product
DELETE /api/distributor/products/:id          # Delete product
```

#### Orders (Distributor)
```http
GET    /api/distributor/orders                # Get all orders
GET    /api/distributor/orders/:id            # Get order details
POST   /api/distributor/orders/:id/accept     # Accept order
POST   /api/distributor/orders/:id/reject     # Reject order
PUT    /api/distributor/orders/:id/status     # Update status
```

#### Clients (Distributor)
```http
GET    /api/distributor/clients               # Get all clients
GET    /api/distributor/clients/:id           # Get client details
GET    /api/distributor/clients/pending       # Get pending approvals
POST   /api/distributor/clients/pending/:id/approve  # Approve client
```

#### Debts
```http
GET    /api/debts/distributor                 # Get all debts
POST   /api/debts/:id/payment                 # Record payment
GET    /api/debts/distributor/summary         # Get summary
```

#### Chat
```http
GET    /api/chat/rooms                        # Get chat rooms
POST   /api/chat/rooms                        # Create room
GET    /api/chat/rooms/:id/messages           # Get messages
POST   /api/chat/rooms/:id/messages           # Send message
```

For complete API documentation, see `API_DOCUMENTATION.md` (can be generated with Swagger)

---

## 🧪 Testing

### Automated API Tests

```bash
# Run API tests
./test-api.sh

# Expected output:
# ✅ All tests passed
# - Auth System: Working
# - Products Module: Working
# - Orders Module: Working
# - Clients Module: Working
# - Debts System: Working
# - Chat System: Working
# - Dashboard: Working
```

### Manual Testing

See `MANUAL_TEST_GUIDE.md` for complete manual testing scenarios.

### Test Results

See `MVP_TEST_REPORT.md` for detailed test results.

---

## 🚀 Deployment

### Environment Variables

**Backend (.env)**
```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/dokonect
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend-domain.com
```

**Frontend (.env)**
```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com
```

### Deployment Steps

#### 1. Database
```bash
# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npm run prisma:seed
```

#### 2. Backend
```bash
# Build
npm run build

# Start with PM2
pm2 start npm --name "dokonect-api" -- start
```

#### 3. Frontend
```bash
# Build
npm run build

# Deploy dist/ folder to Vercel/Netlify/etc
```

### Recommended Hosting

- **Backend:** Railway, Heroku, DigitalOcean
- **Frontend:** Vercel, Netlify
- **Database:** Railway PostgreSQL, Supabase, AWS RDS

For detailed deployment instructions, see `DEPLOYMENT_READY.md`

---

## 📊 Database Schema

### Main Tables

- **users** - User accounts (all roles)
- **distributors** - Distributor profiles
- **clients** - Client/Shop profiles
- **products** - Product catalog
- **orders** - Orders
- **order_items** - Order line items
- **debts** - Debt/Nasiya records
- **chat_rooms** - Chat rooms
- **messages** - Chat messages
- **warehouses** - Warehouses
- **inventory** - Stock levels
- **deliveries** - Delivery records

See `backend/prisma/schema.prisma` for complete schema.

---

## 🔒 Security

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Role-based access control
- ✅ Input validation (Zod)
- ✅ SQL injection protection (Prisma)
- ✅ CORS configured
- ✅ Environment variables for secrets

---

## 📈 Performance

- ✅ Database indexes optimized
- ✅ Prisma query optimization
- ✅ React Query caching
- ✅ Lazy loading components
- ✅ WebSocket connection pooling
- ✅ Efficient state management

---

## 🎯 Roadmap

### Phase 1 - MVP ✅ (Completed)
- [x] Authentication system
- [x] Product management
- [x] Order management
- [x] Client management
- [x] Nasiya/Debt system
- [x] Real-time chat
- [x] Dashboard & analytics
- [x] Delivery tracking

### Phase 2 - Advanced Features
- [ ] Multi-distributor marketplace
- [ ] Advanced analytics
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Payment gateway integration
- [ ] SMS notifications

### Phase 3 - AI Features
- [ ] AI product recommendations
- [ ] Risk scoring for credit
- [ ] Route optimization
- [ ] Demand forecasting

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Team

- **Backend Developer** - Node.js, Express, PostgreSQL
- **Frontend Developer** - React, TypeScript, TailwindCSS
- **DevOps** - Deployment, CI/CD
- **Product Manager** - Requirements, Testing

---

## 📞 Support

For support, email support@dokonect.uz or join our Telegram channel.

---

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by B2B platforms worldwide
- Designed for Uzbekistan market

---

## 📊 Status

**Current Version:** 1.0.0 MVP  
**Status:** ✅ Production Ready  
**Last Updated:** April 8, 2026

---

**Built with ❤️ for Uzbekistan's B2B market**

🚀 **Ready to revolutionize distributor-shop relationships!**
