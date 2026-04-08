import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting distributor seed...');

  // Create Distributor User
  const hashedPassword = await bcrypt.hash('123456', 10);

  const distributorUser = await prisma.user.upsert({
    where: { phone: '+998903333333' },
    update: {},
    create: {
      name: 'Distributor Admin',
      phone: '+998903333333',
      email: 'distributor@test.com',
      password: hashedPassword,
      role: 'DISTRIBUTOR',
      subRole: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Distributor user created:', distributorUser.phone);

  // Create Distributor Profile
  const distributor = await prisma.distributor.upsert({
    where: { userId: distributorUser.id },
    update: {},
    create: {
      userId: distributorUser.id,
      companyName: 'Test Distribution Company',
      slug: 'test-distribution',
      address: 'Tashkent, Yunusabad',
      phone: '+998903333333',
      workingHours: '09:00-18:00',
      description: 'Leading B2B distributor in Uzbekistan',
      isVerified: true,
      rating: 4.8,
    },
  });

  console.log('✅ Distributor profile created:', distributor.companyName);

  // Create Warehouse
  const warehouse = await prisma.warehouse.create({
    data: {
      distributorId: distributor.id,
      name: 'Main Warehouse',
      address: 'Tashkent, Sergeli',
      region: 'Tashkent',
      isActive: true,
    },
  });

  console.log('✅ Warehouse created:', warehouse.name);

  // Create Categories
  const electronics = await prisma.category.upsert({
    where: { 
      distributorId_slug: {
        distributorId: distributor.id,
        slug: 'electronics'
      }
    },
    update: {},
    create: {
      distributorId: distributor.id,
      name: 'Electronics',
      slug: 'electronics',
      order: 1,
    },
  });

  const food = await prisma.category.upsert({
    where: { 
      distributorId_slug: {
        distributorId: distributor.id,
        slug: 'food-beverages'
      }
    },
    update: {},
    create: {
      distributorId: distributor.id,
      name: 'Food & Beverages',
      slug: 'food-beverages',
      order: 2,
    },
  });

  const household = await prisma.category.upsert({
    where: { 
      distributorId_slug: {
        distributorId: distributor.id,
        slug: 'household'
      }
    },
    update: {},
    create: {
      distributorId: distributor.id,
      name: 'Household Items',
      slug: 'household',
      order: 3,
    },
  });

  const categories = [electronics, food, household];

  console.log('✅ Categories created:', categories.length);

  // Create Brands
  const samsung = await prisma.brand.upsert({
    where: {
      distributorId_slug: {
        distributorId: distributor.id,
        slug: 'samsung'
      }
    },
    update: {},
    create: {
      distributorId: distributor.id,
      name: 'Samsung',
      slug: 'samsung',
    },
  });

  const cocaCola = await prisma.brand.upsert({
    where: {
      distributorId_slug: {
        distributorId: distributor.id,
        slug: 'coca-cola'
      }
    },
    update: {},
    create: {
      distributorId: distributor.id,
      name: 'Coca-Cola',
      slug: 'coca-cola',
    },
  });

  const brands = [samsung, cocaCola];

  console.log('✅ Brands created:', brands.length);

  // Create Products
  const phone = await prisma.product.upsert({
    where: { sku: 'SAMSUNG-A54-001' },
    update: {},
    create: {
      distributorId: distributor.id,
      name: 'Samsung Galaxy A54',
      sku: 'SAMSUNG-A54-001',
      description: 'Latest Samsung smartphone with amazing features',
      wholesalePrice: 3500000,
      retailPrice: 4000000,
      costPrice: 3000000,
      categoryId: categories[0].id,
      brandId: brands[0].id,
      status: 'ACTIVE',
      unit: 'pcs',
    },
  });

  const cola = await prisma.product.upsert({
    where: { sku: 'COLA-1.5L-001' },
    update: {},
    create: {
      distributorId: distributor.id,
      name: 'Coca-Cola 1.5L',
      sku: 'COLA-1.5L-001',
      description: 'Refreshing Coca-Cola drink',
      wholesalePrice: 8000,
      retailPrice: 10000,
      costPrice: 6000,
      categoryId: categories[1].id,
      brandId: brands[1].id,
      status: 'ACTIVE',
      unit: 'bottle',
    },
  });

  const detergent = await prisma.product.upsert({
    where: { sku: 'DETERGENT-3KG-001' },
    update: {},
    create: {
      distributorId: distributor.id,
      name: 'Laundry Detergent 3kg',
      sku: 'DETERGENT-3KG-001',
      description: 'Powerful cleaning detergent',
      wholesalePrice: 45000,
      retailPrice: 55000,
      costPrice: 35000,
      categoryId: categories[2].id,
      status: 'ACTIVE',
      unit: 'box',
    },
  });

  const products = [phone, cola, detergent];

  console.log('✅ Products created:', products.length);

  // Create Inventory
  for (const product of products) {
    await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: 100,
        reserved: 0,
        minThreshold: 10,
      },
    });
  }

  console.log('✅ Inventory created for all products');

  // Create Product Variants for Samsung phone
  const variantBlack = await prisma.productVariant.upsert({
    where: { skuVariant: 'SAMSUNG-A54-BLACK-128GB' },
    update: {},
    create: {
      productId: products[0].id,
      color: 'Black',
      size: '128GB',
      skuVariant: 'SAMSUNG-A54-BLACK-128GB',
    },
  });

  const variantWhite = await prisma.productVariant.upsert({
    where: { skuVariant: 'SAMSUNG-A54-WHITE-256GB' },
    update: {},
    create: {
      productId: products[0].id,
      color: 'White',
      size: '256GB',
      skuVariant: 'SAMSUNG-A54-WHITE-256GB',
      priceOverride: 3800000,
    },
  });

  const variants = [variantBlack, variantWhite];

  console.log('✅ Product variants created:', variants.length);

  // Create inventory for variants
  for (const variant of variants) {
    await prisma.inventory.create({
      data: {
        productId: products[0].id,
        variantId: variant.id,
        warehouseId: warehouse.id,
        quantity: 50,
        reserved: 0,
        minThreshold: 5,
      },
    });
  }

  console.log('✅ Variant inventory created');

  // Create Bulk Rules
  await prisma.bulkRule.create({
    data: {
      productId: products[1].id, // Coca-Cola
      minQuantity: 10,
      maxQuantity: 49,
      discountType: 'PERCENT',
      discountValue: 5,
    },
  });

  await prisma.bulkRule.create({
    data: {
      productId: products[1].id,
      minQuantity: 50,
      discountType: 'PERCENT',
      discountValue: 10,
    },
  });

  console.log('✅ Bulk rules created');

  // Create Promo Code
  await prisma.promoCode.upsert({
    where: { code: 'YANGI10' },
    update: {},
    create: {
      distributorId: distributor.id,
      code: 'YANGI10',
      discountType: 'PERCENT',
      discountValue: 10,
      minOrderAmount: 100000,
      maxUses: 100,
      usesPerClient: 1,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  console.log('✅ Promo code created');

  // Create Client User for testing
  const clientUser = await prisma.user.upsert({
    where: { phone: '+998901111111' },
    update: {},
    create: {
      name: 'Test Store Owner',
      phone: '+998901111111',
      email: 'store@test.com',
      password: hashedPassword,
      role: 'CLIENT',
      status: 'ACTIVE',
    },
  });

  const client = await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      userId: clientUser.id,
      storeName: 'Test Retail Store',
      region: 'Tashkent',
    },
  });

  console.log('✅ Test client created:', client.storeName);

  // Create Driver User
  const driverUser = await prisma.user.upsert({
    where: { phone: '+998902222222' },
    update: {},
    create: {
      name: 'Test Driver',
      phone: '+998902222222',
      password: hashedPassword,
      role: 'DRIVER',
      status: 'ACTIVE',
    },
  });

  const driver = await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: {
      userId: driverUser.id,
      vehicleType: 'Van',
      vehicleNumber: '01A123BC',
      licenseNumber: 'DL123456',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Test driver created:', driver.vehicleNumber);

  // Create Zone
  const zone = await prisma.zone.create({
    data: {
      name: 'Tashkent Center',
      region: 'Tashkent',
    },
  });

  await prisma.driverZone.create({
    data: {
      driverId: driver.id,
      zoneId: zone.id,
    },
  });

  console.log('✅ Zone and driver assignment created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('Distributor: +998903333333 / 123456');
  console.log('Client: +998901111111 / 123456');
  console.log('Driver: +998902222222 / 123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
