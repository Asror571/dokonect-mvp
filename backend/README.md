# Dokonect Backend

B2B marketplace — do'kon egalari va distribyutorlarni bog'laydigan platforma.

## Ishga tushirish

```bash
cd backend
npm install
```

`.env` faylini sozlang (`.env.example` asosida):
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your_secret"
JWT_EXPIRES_IN="7d"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

```bash
# DB migratsiya
npx prisma migrate dev --name init

# Dev server
npm run dev
```

## API Endpointlar

### Auth
| Method | URL | Tavsif |
|--------|-----|--------|
| POST | /api/auth/register | Ro'yxatdan o'tish |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Joriy foydalanuvchi |

### Mahsulotlar (Store Owner)
| Method | URL | Tavsif |
|--------|-----|--------|
| GET | /api/products | Barcha mahsulotlar (search, category, page) |
| GET | /api/products/categories | Kategoriyalar |
| GET | /api/products/:id | Bitta mahsulot |

### Mahsulotlar (Distribyutor)
| Method | URL | Tavsif |
|--------|-----|--------|
| GET | /api/distributor/products | O'z mahsulotlari |
| POST | /api/distributor/products | Yangi mahsulot (multipart/form-data) |
| PUT | /api/distributor/products/:id | Tahrirlash |
| DELETE | /api/distributor/products/:id | O'chirish (soft delete) |
| PATCH | /api/distributor/products/:id/stock | Stok yangilash |

### Buyurtmalar (Store Owner)
| Method | URL | Tavsif |
|--------|-----|--------|
| POST | /api/orders | Buyurtma berish |
| GET | /api/orders | O'z buyurtmalari |
| GET | /api/orders/:id | Buyurtma tafsiloti |

### Buyurtmalar (Distribyutor)
| Method | URL | Tavsif |
|--------|-----|--------|
| GET | /api/distributor/orders | Kelib tushgan buyurtmalar |
| GET | /api/distributor/orders/:id | Buyurtma tafsiloti |
| PATCH | /api/distributor/orders/:id/status | Status o'zgartirish |

### Profil
| Method | URL | Tavsif |
|--------|-----|--------|
| GET | /api/profile | Profil ma'lumotlari |
| PUT | /api/profile | Profilni yangilash |
