




# Dokonect V2 🚀

O'zbekiston uchun B2B platforma - Do'konlar va Distribyutorlar o'rtasida savdo platformasi.

## 🎯 V2 Yangiliklari

- ✅ **Analytics Dashboard** - Distribyutor va Admin uchun to'liq statistika
- ✅ **Real-time Chat** - Socket.io orqali jonli chat
- ✅ **Mahsulot Reytingi** - Sharh va baho tizimi
- ✅ **Admin Panel** - Foydalanuvchilar, mahsulotlar va buyurtmalarni boshqarish
- ✅ **Kengaytirilgan Qidiruv** - Rating, narx, kategoriya bo'yicha filter
- ✅ **PWA Support** - Mobile-friendly Progressive Web App
- ✅ **Seed Data** - 30 mahsulot, 5 distribyutor, demo ma'lumotlar

## 🛠 Tech Stack

### Backend
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- Socket.io (real-time chat)
- Redis (online status cache)
- JWT Authentication
- Cloudinary (rasm yuklash)

### Frontend
- React 18 + TypeScript
- TailwindCSS
- React Query (tanstack/react-query)
- Zustand (state management)
- Socket.io Client
- Recharts (analytics)
- Vite + PWA Plugin

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for online status)

### Backend Setup

```bash
cd backend
npm install

# .env faylni sozlang
cp .env.example .env
# DATABASE_URL, JWT_SECRET, CLOUDINARY credentials kiriting

# Prisma migration
npx prisma migrate dev
npx prisma generate

# Seed data
npm run prisma:seed

# Start server
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install

# .env faylni sozlang
cp .env.example .env
# VITE_API_URL kiriting

# Start dev server
npm run dev
```

## 🔑 Demo Accounts

### Admin
- Email: `admin@dokonect.uz`
- Password: `Password@123`

### Distribyutor
- Email: `sarvar@freshmart.uz`
- Password: `Password@123`

### Do'kon Egasi
- Email: `aziz@store.uz`
- Password: `Password@123`

## 📁 Project Structure

```
dokonect/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── sockets/
│   │   └── app.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── analytics/
│   │   │   ├── chat/
│   │   │   ├── reviews/
│   │   │   └── layout/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── distributor/
│   │   │   └── store/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## 🚀 Features

### Do'kon Egasi (Store Owner)
- Mahsulot katalogini ko'rish va qidirish
- Savatcha va buyurtma berish
- Buyurtma statusini kuzatish
- Distribyutorlar bilan chat
- Yetkazilgan mahsulotlarga sharh yozish

### Distribyutor
- Mahsulot qo'shish va boshqarish
- Buyurtmalarni qabul qilish va status o'zgartirish
- Analytics dashboard (sotuv, top mahsulotlar, top do'konlar)
- Do'konlar bilan chat
- Stok boshqaruvi

### Admin
- Barcha foydalanuvchilarni ko'rish va bloklash
- Distribyutorlarni tasdiqlash
- Mahsulotlarni deaktiv qilish
- Barcha buyurtmalarni ko'rish
- Platform statistikasi

## 🔄 API Endpoints

### Auth
- `POST /api/auth/register` - Ro'yxatdan o'tish
- `POST /api/auth/login` - Kirish
- `GET /api/auth/me` - Profil

### Products
- `GET /api/products` - Mahsulotlar ro'yxati (filters: search, category, minRating, sortBy)
- `GET /api/products/:id` - Mahsulot detali
- `POST /api/distributor/products` - Mahsulot qo'shish
- `PUT /api/distributor/products/:id` - Mahsulot yangilash

### Orders
- `POST /api/orders` - Buyurtma berish
- `GET /api/orders` - Mening buyurtmalarim
- `PATCH /api/distributor/orders/:id/status` - Status o'zgartirish

### Chat
- `GET /api/chat/rooms` - Chat xonalari
- `POST /api/chat/rooms` - Yangi chat yaratish
- `GET /api/chat/rooms/:roomId/messages` - Xabarlar

### Reviews
- `POST /api/reviews` - Sharh qo'shish
- `GET /api/reviews/product/:productId` - Mahsulot sharhlari

### Analytics
- `GET /api/analytics/distributor/overview` - Umumiy statistika
- `GET /api/analytics/distributor/sales` - Sotuv grafigi
- `GET /api/analytics/admin/overview` - Admin statistika

### Admin
- `GET /api/admin/users` - Foydalanuvchilar
- `PATCH /api/admin/users/:id/block` - Bloklash
- `PATCH /api/admin/distributors/:id/verify` - Tasdiqlash

## 🔌 Socket.io Events

### Client → Server
- `join_room` - Chat xonasiga qo'shilish
- `send_message` - Xabar yuborish
- `typing` - Yozayotganini ko'rsatish

### Server → Client
- `new_message` - Yangi xabar
- `user_typing` - Foydalanuvchi yozmoqda
- `online_status` - Online holat

## 📊 Database Schema

### Main Models
- **User** - Foydalanuvchilar (role: STORE_OWNER | DISTRIBUTOR | ADMIN)
- **StoreOwner** - Do'kon egalari
- **Distributor** - Distribyutorlar
- **Product** - Mahsulotlar
- **Order** - Buyurtmalar
- **Review** - Sharhlar
- **ChatRoom** - Chat xonalari
- **Message** - Xabarlar
- **Notification** - Bildirishnomalar

## 🎨 UI Components

- **StatsCard** - Statistika kartochkasi
- **SalesChart** - Sotuv grafigi (Recharts)
- **TopProductsChart** - Top mahsulotlar grafigi
- **ChatSidebar** - Chat sidebar
- **ChatWindow** - Chat oynasi
- **StarRating** - Yulduzcha reytingi
- **ReviewCard** - Sharh kartochkasi

## 🔐 Security

- JWT token authentication
- Password hashing (bcrypt)
- Role-based access control
- Input validation (Zod)
- SQL injection protection (Prisma)

## 📱 PWA Features

- Offline support
- Install prompt
- Service worker caching
- Network-first strategy for products

## 🚀 Deployment

### Backend (Railway)
```bash
# Railway CLI
railway login
railway init
railway add postgresql
railway add redis
railway up
```

### Frontend (Vercel)
```bash
# Vercel CLI
vercel login
vercel --prod
```

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
REDIS_URL=redis://...
CLIENT_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file

## 👨‍💻 Author

Dokonect Team

---

**Dokonect V2** - O'zbekiston B2B platformasi 🇺🇿
