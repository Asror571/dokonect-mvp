import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Full Seeding started...');

  const hash = await bcrypt.hash('123456', 10);

  // 1. Admin
  await prisma.user.upsert({
    where: { phone: '+998900000000' },
    update: { password: hash },
    create: { 
      phone: '+998900000000', 
      email: 'admin@dokonect.uz', 
      name: 'Global Admin', 
      password: hash, 
      role: Role.ADMIN, 
      status: UserStatus.ACTIVE 
    },
  });

  // 2. Distributor
  const distUser = await prisma.user.upsert({
    where: { phone: '+998901234567' },
    update: { password: hash },
    create: { 
      phone: '+998901234567', 
      email: 'dist@dokonect.uz', 
      name: 'Sarvar Distribyutor', 
      password: hash, 
      role: Role.DISTRIBUTOR,
      status: UserStatus.ACTIVE
    },
  });

  const dist = await prisma.distributor.upsert({
    where: { userId: distUser.id },
    update: { companyName: 'FreshMart Distribution' },
    create: {
      userId: distUser.id,
      companyName: 'FreshMart Distribution',
      address: 'Toshkent, Chilonzor',
      phone: '+998901234567',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=freshmart',
      isVerified: true,
    }
  });

  // 3. Category
  const cat = await prisma.category.upsert({
    where: { distributorId_slug: { distributorId: dist.id, slug: 'ichimliklar' } },
    update: {},
    create: {
      distributorId: dist.id,
      name: 'Ichimliklar',
      slug: 'ichimliklar',
    }
  });

  // 4. Product
  await prisma.product.upsert({
    where: { sku: 'COCA-1.5' },
    update: {},
    create: {
      distributorId: dist.id,
      categoryId: cat.id,
      name: 'Coca-Cola 1.5L',
      sku: 'COCA-1.5',
      wholesalePrice: 9500,
      unit: 'dona',
      status: 'ACTIVE',
    }
  });

  // 5. Client (Store Owner)
  const clientUser = await prisma.user.upsert({
    where: { phone: '+998901234500' },
    update: { password: hash },
    create: { 
      phone: '+998901234500', 
      email: 'aziz@store.uz', 
      name: 'Aziz Toshpulotov', 
      password: hash, 
      role: Role.CLIENT,
      status: UserStatus.ACTIVE
    },
  });

  await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: { storeName: 'Aziz Market' },
    create: {
      userId: clientUser.id,
      storeName: 'Aziz Market',
    }
  });

  // 6. Driver
  const driverUser = await prisma.user.upsert({
    where: { phone: '+998901234577' },
    update: { password: hash },
    create: { 
      phone: '+998901234577', 
      name: 'Ali Haydovchi', 
      password: hash, 
      role: Role.DRIVER,
      status: UserStatus.ACTIVE
    },
  });

  await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: { vehicleType: 'Damas' },
    create: {
      userId: driverUser.id,
      vehicleType: 'Damas',
      vehicleNumber: '01 A 777 AA',
      licenseNumber: 'AA1234567',
      status: 'ACTIVE'
    }
  });

  console.log('✅ All test accounts seeded with password: 123456');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
