import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Dokonect V3 database...');

  // Clear existing data
  await prisma.orderStatusHistory.deleteMany();
  await prisma.deliveryRating.deleteMany();
  await prisma.driverEarning.deleteMany();
  await prisma.driverLocation.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.stockLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.client.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.distributor.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      phone: '+998901234567',
      email: 'admin@dokonect.uz',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // Create Distributors
  const distributor1 = await prisma.user.create({
    data: {
      name: 'Tashkent Warehouse',
      phone: '+998901234568',
      email: 'warehouse1@dokonect.uz',
      password: hashedPassword,
      role: 'DISTRIBUTOR',
      status: 'ACTIVE',
      distributor: {
        create: {
          warehouseName: 'Tashkent Central Warehouse',
          address: 'Amir Temur Street 15, Tashkent',
          workingHours: '08:00-20:00',
          isVerified: true,
        },
      },
    },
    include: { distributor: true },
  });

  const distributor2 = await prisma.user.create({
    data: {
      name: 'Samarkand Warehouse',
      phone: '+998901234569',
      email: 'warehouse2@dokonect.uz',
      password: hashedPassword,
      role: 'DISTRIBUTOR',
      status: 'ACTIVE',
      distributor: {
        create: {
          warehouseName: 'Samarkand Distribution Center',
          address: 'Registan Square 5, Samarkand',
          workingHours: '09:00-18:00',
          isVerified: true,
        },
      },
    },
    include: { distributor: true },
  });

  // Create Drivers
  const driver1 = await prisma.user.create({
    data: {
      name: 'Aziz Karimov',
      phone: '+998901234570',
      password: hashedPassword,
      role: 'DRIVER',
      status: 'ACTIVE',
      avatar: 'https://i.pravatar.cc/150?img=12',
      driver: {
        create: {
          vehicleType: 'Sedan',
          vehicleNumber: '01 A 123 BC',
          licenseNumber: 'DL123456',
          rating: 4.8,
          totalDeliveries: 156,
          isOnline: true,
        },
      },
    },
    include: { driver: true },
  });

  const driver2 = await prisma.user.create({
    data: {
      name: 'Bobur Aliyev',
      phone: '+998901234571',
      password: hashedPassword,
      role: 'DRIVER',
      status: 'ACTIVE',
      avatar: 'https://i.pravatar.cc/150?img=33',
      driver: {
        create: {
          vehicleType: 'Van',
          vehicleNumber: '01 B 456 DE',
          licenseNumber: 'DL789012',
          rating: 4.9,
          totalDeliveries: 203,
          isOnline: true,
        },
      },
    },
    include: { driver: true },
  });

  // Create Clients
  const client1 = await prisma.user.create({
    data: {
      name: 'Dilshod Rahimov',
      phone: '+998901234572',
      email: 'dilshod@example.uz',
      password: hashedPassword,
      role: 'CLIENT',
      status: 'ACTIVE',
      client: {
        create: {
          addresses: [
            {
              street: 'Mustaqillik Avenue 45, Apt 12',
              city: 'Tashkent',
              district: 'Yunusabad',
              isDefault: true,
            },
          ],
          loyaltyPoints: 150,
          tier: 'SILVER',
        },
      },
    },
    include: { client: true },
  });

  const client2 = await prisma.user.create({
    data: {
      name: 'Malika Tursunova',
      phone: '+998901234573',
      email: 'malika@example.uz',
      password: hashedPassword,
      role: 'CLIENT',
      status: 'ACTIVE',
      client: {
        create: {
          addresses: [
            {
              street: 'Buyuk Ipak Yuli 78',
              city: 'Tashkent',
              district: 'Mirzo Ulugbek',
              isDefault: true,
            },
          ],
          loyaltyPoints: 320,
          tier: 'GOLD',
        },
      },
    },
    include: { client: true },
  });

  // Create Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        distributorId: distributor1.distributor!.id,
        name: 'Premium Rice 5kg',
        sku: 'RICE-5KG-001',
        description: 'High quality basmati rice',
        price: 45000,
        unit: 'bag',
        stockQty: 150,
        minStock: 20,
        category: 'Grains',
        photo: 'https://images.unsplash.com/photo-1586201375761-83865001e31c',
      },
    }),
    prisma.product.create({
      data: {
        distributorId: distributor1.distributor!.id,
        name: 'Sunflower Oil 1L',
        sku: 'OIL-1L-001',
        description: 'Pure sunflower cooking oil',
        price: 18000,
        unit: 'bottle',
        stockQty: 8,
        minStock: 15,
        category: 'Oils',
        photo: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5',
      },
    }),
    prisma.product.create({
      data: {
        distributorId: distributor1.distributor!.id,
        name: 'Sugar 1kg',
        sku: 'SUGAR-1KG-001',
        description: 'White refined sugar',
        price: 12000,
        unit: 'pack',
        stockQty: 200,
        minStock: 30,
        category: 'Sweeteners',
      },
    }),
    prisma.product.create({
      data: {
        distributorId: distributor2.distributor!.id,
        name: 'Flour 2kg',
        sku: 'FLOUR-2KG-001',
        description: 'All-purpose wheat flour',
        price: 15000,
        unit: 'bag',
        stockQty: 120,
        minStock: 25,
        category: 'Grains',
      },
    }),
  ]);

  // Create Orders
  const order1 = await prisma.order.create({
    data: {
      clientId: client1.client!.id,
      distributorId: distributor1.distributor!.id,
      driverId: driver1.driver!.id,
      status: 'IN_TRANSIT',
      totalAmount: 126000,
      deliveryAddress: {
        street: 'Mustaqillik Avenue 45, Apt 12',
        city: 'Tashkent',
        district: 'Yunusabad',
      },
      deliveryTimeSlot: '14:00-16:00',
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 2,
            unitPrice: 45000,
          },
          {
            productId: products[1].id,
            quantity: 2,
            unitPrice: 18000,
          },
        ],
      },
      statusHistory: {
        create: [
          { status: 'PENDING', timestamp: new Date(Date.now() - 3600000) },
          { status: 'ACCEPTED', timestamp: new Date(Date.now() - 3000000) },
          { status: 'PICKED_UP', timestamp: new Date(Date.now() - 1800000) },
          { status: 'IN_TRANSIT', timestamp: new Date(Date.now() - 600000) },
        ],
      },
    },
  });

  await prisma.delivery.create({
    data: {
      orderId: order1.id,
      driverId: driver1.driver!.id,
      pickupTime: new Date(Date.now() - 1800000),
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('Admin: admin@dokonect.uz / password123');
  console.log('Distributor: warehouse1@dokonect.uz / password123');
  console.log('Driver: +998901234570 / password123');
  console.log('Client: dilshod@example.uz / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
