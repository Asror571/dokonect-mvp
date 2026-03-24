import { PrismaClient, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding started...');

  const hash = await bcrypt.hash('Password@123', 10);

  // ─── Admin ───────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@dokonect.uz' },
    update: {},
    create: { email: 'admin@dokonect.uz', password: hash, role: 'ADMIN', isVerified: true },
  });
  console.log('✅ Admin created:', adminUser.email);

  // ─── Distributors ────────────────────────────────────────────────────────
  const distData = [
    {
      email: 'sarvar@freshmart.uz', companyName: 'FreshMart Distribution',
      address: 'Toshkent, Yunusobod t.', phone: '+998901234567',
      logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=freshmart',
      description: 'Oziq-ovqat va ichimliklar yetakchi distribyutori', isVerified: true,
    },
    {
      email: 'jasur@snackplus.uz', companyName: 'SnackPlus Wholesale',
      address: 'Toshkent, Chilonzor t.', phone: '+998901234568',
      logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=snackplus',
      description: 'Chiplar va shirinliklar distribyutori', isVerified: true,
    },
    {
      email: 'nodira@cleanlife.uz', companyName: 'CleanLife Supply',
      address: 'Samarqand sh.', phone: '+998901234569',
      logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=cleanlife',
      description: 'Uy-rozgor va gigiyena mahsulotlari', isVerified: true,
    },
    {
      email: 'bobur@dairyking.uz', companyName: 'DairyKing Distribution',
      address: 'Toshkent, Mirzo Ulugbek t.', phone: '+998901234570',
      logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=dairyking',
      description: 'Sut mahsulotlari va sovuq ichimliklar', isVerified: false,
    },
    {
      email: 'zulfiya@breadhouse.uz', companyName: 'BreadHouse Wholesale',
      address: 'Toshkent, Shayxontohur t.', phone: '+998901234571',
      logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=breadhouse',
      description: 'Non va pishiriq mahsulotlari', isVerified: true,
    },
  ];

  const distributors: Record<string, string> = {};
  for (const d of distData) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: { email: d.email, password: hash, role: 'DISTRIBUTOR' },
    });
    const dist = await prisma.distributor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id, companyName: d.companyName, address: d.address,
        phone: d.phone, logoUrl: d.logoUrl, description: d.description, isVerified: d.isVerified,
      },
    });
    distributors[d.companyName] = dist.id;
    console.log('✅ Distributor:', d.companyName);
  }

  // ─── Products ────────────────────────────────────────────────────────────
  const products = [
    // FreshMart
    { name: 'Coca-Cola 0.5L',   category: 'Ichimliklar', price: 8500,  unit: 'dona',  stock: 240, avgRating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400', dist: 'FreshMart Distribution' },
    { name: 'Pepsi 1L',         category: 'Ichimliklar', price: 10000, unit: 'dona',  stock: 180, avgRating: 4.5, imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400', dist: 'FreshMart Distribution' },
    { name: 'Sprite 0.5L',      category: 'Ichimliklar', price: 8000,  unit: 'dona',  stock: 200, avgRating: 4.4, imageUrl: 'https://images.unsplash.com/photo-1625772452859-1c03d884f3d5?w=400', dist: 'FreshMart Distribution' },
    { name: 'Aqua 1.5L',        category: 'Ichimliklar', price: 5000,  unit: 'dona',  stock: 500, avgRating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1616118132534-381148898bb4?w=400', dist: 'FreshMart Distribution' },
    { name: 'Shakar 1 kg',      category: 'Oziq-ovqat',  price: 15000, unit: 'kg',    stock: 300, avgRating: 4.7, imageUrl: 'https://images.unsplash.com/photo-1559181567-c3190bfbf827?w=400', dist: 'FreshMart Distribution' },
    { name: 'Un Navbahor 2kg',  category: 'Oziq-ovqat',  price: 18000, unit: 'paket', stock: 150, avgRating: 4.6, imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400', dist: 'FreshMart Distribution' },
    // SnackPlus
    { name: "Lay's Classic 75g",     category: 'Chiplar',      price: 9500,  unit: 'dona', stock: 350, avgRating: 4.7, imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400', dist: 'SnackPlus Wholesale' },
    { name: 'Pringles Original 165g', category: 'Chiplar',      price: 28000, unit: 'dona', stock: 120, avgRating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400', dist: 'SnackPlus Wholesale' },
    { name: 'Kit Kat 2 fingers',      category: 'Shirinliklar', price: 7000,  unit: 'dona', stock: 400, avgRating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400', dist: 'SnackPlus Wholesale' },
    { name: 'Snickers 50g',           category: 'Shirinliklar', price: 8500,  unit: 'dona', stock: 380, avgRating: 4.6, imageUrl: 'https://images.unsplash.com/photo-1582456891045-34c399ae5b2b?w=400', dist: 'SnackPlus Wholesale' },
    { name: 'Orbit Spearmint',        category: 'Shirinliklar', price: 6500,  unit: 'dona', stock: 600, avgRating: 4.3, imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400', dist: 'SnackPlus Wholesale' },
    { name: 'Twix 50g',               category: 'Shirinliklar', price: 8000,  unit: 'dona', stock: 320, avgRating: 4.5, imageUrl: 'https://images.unsplash.com/photo-1562850065-70b24e8ecfbb?w=400', dist: 'SnackPlus Wholesale' },
    { name: 'Bounty 57g',             category: 'Shirinliklar', price: 8500,  unit: 'dona', stock: 290, avgRating: 4.4, imageUrl: 'https://images.unsplash.com/photo-1575377427642-087cf684f29d?w=400', dist: 'SnackPlus Wholesale' },
    // CleanLife
    { name: 'Ariel 450g',             category: 'Gigiyena', price: 32000, unit: 'dona',  stock: 200, avgRating: 4.7, imageUrl: 'https://images.unsplash.com/photo-1585827552800-8e7a53cd1a44?w=400', dist: 'CleanLife Supply' },
    { name: 'Fairy Original 500ml',   category: 'Gigiyena', price: 24000, unit: 'dona',  stock: 180, avgRating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400', dist: 'CleanLife Supply' },
    { name: 'Domestos 750ml',         category: 'Gigiyena', price: 19000, unit: 'dona',  stock: 160, avgRating: 4.5, imageUrl: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400', dist: 'CleanLife Supply' },
    { name: 'Head Shoulders 200ml',   category: 'Shampun',  price: 35000, unit: 'dona',  stock: 140, avgRating: 4.6, imageUrl: 'https://images.unsplash.com/photo-1597354984706-fac992d9306a?w=400', dist: 'CleanLife Supply' },
    { name: 'Colgate 75ml',           category: 'Gigiyena', price: 14000, unit: 'dona',  stock: 320, avgRating: 4.7, imageUrl: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400', dist: 'CleanLife Supply' },
    { name: 'Pampers S3 54 dona',     category: 'Bolalar',  price: 89000, unit: 'paket', stock: 80,  avgRating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400', dist: 'CleanLife Supply' },
    { name: 'Kleenex Tissues 100ta',  category: 'Gigiyena', price: 12000, unit: 'paket', stock: 250, avgRating: 4.6, imageUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=400', dist: 'CleanLife Supply' },
    // DairyKing
    { name: 'Toshkent suti 1L',   category: 'Sut mahsulotlari', price: 12000, unit: 'dona', stock: 100, avgRating: 4.5, imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400', dist: 'DairyKing Distribution' },
    { name: 'Activia yogurt 290g', category: 'Sut mahsulotlari', price: 16000, unit: 'dona', stock: 80,  avgRating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400', dist: 'DairyKing Distribution' },
    { name: 'Kraft pishloq 200g',  category: 'Sut mahsulotlari', price: 38000, unit: 'dona', stock: 60,  avgRating: 4.6, imageUrl: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400', dist: 'DairyKing Distribution' },
    { name: 'Qaymoq 20% 400g',    category: 'Sut mahsulotlari', price: 20000, unit: 'dona', stock: 90,  avgRating: 4.7, imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400', dist: 'DairyKing Distribution' },
    // BreadHouse
    { name: 'Oq non katta',     category: 'Non',     price: 6000,  unit: 'dona',  stock: 200, avgRating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=400', dist: 'BreadHouse Wholesale' },
    { name: 'Lavash 5ta',       category: 'Non',     price: 8000,  unit: 'paket', stock: 150, avgRating: 4.7, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', dist: 'BreadHouse Wholesale' },
    { name: 'Croissant 6ta',    category: 'Pishiriq', price: 22000, unit: 'paket', stock: 80,  avgRating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400', dist: 'BreadHouse Wholesale' },
    { name: 'Oreo 95g',         category: 'Pishiriq', price: 11000, unit: 'dona',  stock: 300, avgRating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', dist: 'BreadHouse Wholesale' },
    { name: 'Digestive 400g',   category: 'Pishiriq', price: 24000, unit: 'paket', stock: 120, avgRating: 4.5, imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400', dist: 'BreadHouse Wholesale' },
    { name: 'Baranki 500g',     category: 'Non',     price: 13000, unit: 'paket', stock: 100, avgRating: 4.3, imageUrl: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400', dist: 'BreadHouse Wholesale' },
  ];

  const productIds: string[] = [];
  for (const p of products) {
    const distId = distributors[p.dist];
    if (!distId) { console.warn('Distributor not found:', p.dist); continue; }
    const product = await prisma.product.create({
      data: {
        distributorId: distId, name: p.name, category: p.category,
        price: p.price, unit: p.unit, stock: p.stock,
        avgRating: p.avgRating, imageUrl: p.imageUrl,
      },
    });
    productIds.push(product.id);
  }
  console.log(`✅ ${productIds.length} products created`);

  // ─── Store Owners ────────────────────────────────────────────────────────
  const storeData = [
    { email: 'aziz@store.uz',    storeName: 'Aziz Dokon',         address: 'Toshkent, Olmazor t.' },
    { email: 'malika@store.uz',  storeName: 'Malika Mini Market', address: 'Toshkent, Yakkasaroy t.' },
    { email: 'ulugbek@store.uz', storeName: 'Ulugbek Produkti',   address: 'Samarqand' },
    { email: 'dilnoza@store.uz', storeName: 'Dil Market',         address: 'Toshkent, Yunusobod t.' },
    { email: 'sherzod@store.uz', storeName: 'Sherzod 24/7',       address: 'Toshkent, Chilonzor t.' },
  ];

  const storeOwnerIds: string[] = [];
  for (const s of storeData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { email: s.email, password: hash, role: 'STORE_OWNER' },
    });
    const store = await prisma.storeOwner.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, storeName: s.storeName, address: s.address, phone: '+998901234500' },
    });
    storeOwnerIds.push(store.id);
    console.log('✅ Store owner:', s.storeName);
  }

  // ─── Orders ──────────────────────────────────────────────────────────────
  const distIds = Object.values(distributors);
  const orderStatuses: { status: OrderStatus; amount: number }[] = [
    { status: 'DELIVERED',  amount: 85000 },
    { status: 'DELIVERING', amount: 124000 },
    { status: 'CONFIRMED',  amount: 67500 },
    { status: 'PENDING',    amount: 210000 },
    { status: 'PENDING',    amount: 45000 },
    { status: 'DELIVERED',  amount: 156000 },
    { status: 'CANCELLED',  amount: 33000 },
    { status: 'CONFIRMED',  amount: 98000 },
    { status: 'DELIVERING', amount: 175000 },
    { status: 'DELIVERED',  amount: 220000 },
  ];

  const orderIds: string[] = [];
  for (let i = 0; i < orderStatuses.length; i++) {
    const { status, amount } = orderStatuses[i];
    const storeOwnerId = storeOwnerIds[i % storeOwnerIds.length];
    const distributorId = distIds[i % distIds.length];
    const productId = productIds[i % productIds.length];

    const order = await prisma.order.create({
      data: {
        storeOwnerId, distributorId, status,
        totalAmount: amount,
        address: 'Toshkent sh.',
        items: { create: [{ productId, quantity: 2, price: amount / 2 }] },
      },
    });
    orderIds.push(order.id);

    // Create chat room for each order
    await prisma.chatRoom.upsert({
      where: { storeOwnerId_distributorId: { storeOwnerId, distributorId } },
      create: { storeOwnerId, distributorId },
      update: {},
    });
  }
  console.log(`✅ ${orderIds.length} orders created`);

  // ─── Reviews ─────────────────────────────────────────────────────────────
  const reviewData = [
    { rating: 5, comment: 'Juda yaxshi mahsulot, sifati alo!' },
    { rating: 4, comment: 'Yaxshi, lekin narxi biroz qimmat' },
    { rating: 5, comment: 'Har doim yangi, tavsiya etaman' },
    { rating: 3, comment: 'Ortacha sifat, yaxshilash mumkin' },
    { rating: 5, comment: 'Tez yetkazib berishdi, rahmat!' },
    { rating: 4, comment: 'Mahsulot yaxshi, lekin qadoqlash yaxshilansin' },
    { rating: 5, comment: 'Ajoyib! Doim shu yerdan olamiz' },
    { rating: 4, comment: 'Sifat yaxshi, narxga mos' },
    { rating: 2, comment: 'Muddati otgan edi, ehtiyot boling' },
    { rating: 5, comment: 'Eng yaxshi distribyutor!' },
    { rating: 4, comment: 'Yaxshi mahsulot, stok kop bolsin' },
    { rating: 5, comment: 'Sifat va narx muvozanati zor' },
    { rating: 3, comment: 'Oddiy mahsulot, farqi yoq' },
    { rating: 5, comment: 'Bolalarga yoqadi, doim sotib olamiz' },
    { rating: 4, comment: 'Yaxshi, takrorlayman' },
  ];

  // Only DELIVERED orders can have reviews
  const deliveredOrders = await prisma.order.findMany({
    where: { status: 'DELIVERED' },
    include: { items: true },
  });

  let reviewCount = 0;
  for (let i = 0; i < Math.min(reviewData.length, deliveredOrders.length * 2); i++) {
    const order = deliveredOrders[i % deliveredOrders.length];
    const item  = order.items[0];
    if (!item) continue;

    try {
      await prisma.review.create({
        data: {
          productId:    item.productId,
          storeOwnerId: order.storeOwnerId,
          rating:       reviewData[i].rating,
          comment:      reviewData[i].comment,
        },
      });
      reviewCount++;
    } catch {
      // Skip duplicate
    }
  }
  console.log(`✅ ${reviewCount} reviews created`);

  // ─── Chat Messages ────────────────────────────────────────────────────────
  const chatRooms = await prisma.chatRoom.findMany({
    include: {
      storeOwner: { include: { user: true } },
      distributor: { include: { user: true } },
    },
    take: 5,
  });

  const chatMessages = [
    ['Salom! Coca-Cola dan 50 ta bor-mi?', 'store'],
    ['Ha, bor. Narxi 8500 somdan', 'dist'],
    ['Stok qachon yangilanadi?', 'store'],
    ['Har dushanba yangi tovar keladi', 'dist'],
  ];

  for (let i = 0; i < Math.min(chatRooms.length, 5); i++) {
    const room = chatRooms[i];
    const msgs = chatMessages.slice(i % 2 === 0 ? 0 : 2);
    for (const [content, sender] of msgs) {
      const senderId = sender === 'store' ? room.storeOwner.user.id : room.distributor.user.id;
      await prisma.message.create({
        data: { chatRoomId: room.id, senderId, content: content as string },
      });
    }
  }
  console.log('✅ Chat messages created');

  console.log('\n🎉 Seed completed!');
  console.log('📧 Admin: admin@dokonect.uz / Password@123');
  console.log('📧 Distributor: sarvar@freshmart.uz / Password@123');
  console.log('📧 Store owner: aziz@store.uz / Password@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
