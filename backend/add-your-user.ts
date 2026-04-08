import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  // Update existing distributor or create new one with your phone
  const distributorUser = await prisma.user.upsert({
    where: { phone: '+998903333333' },
    update: {
      password: hashedPassword,
      role: 'DISTRIBUTOR',
      subRole: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
    create: {
      name: 'Asrorbek (Distributor)',
      phone: '+998903333333',
      email: 'asrorbek@dokonect.uz',
      password: hashedPassword,
      role: 'DISTRIBUTOR',
      subRole: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('✅ User created/updated:', distributorUser);

  // Check if distributor profile exists
  let distributor = await prisma.distributor.findUnique({
    where: { userId: distributorUser.id }
  });

  if (!distributor) {
    distributor = await prisma.distributor.create({
      data: {
        userId: distributorUser.id,
        companyName: 'Dokonect Distribution',
        slug: 'dokonect-dist',
        address: 'Tashkent, Uzbekistan',
        phone: '+998903333333',
        workingHours: '09:00-18:00',
        description: 'Leading B2B distributor platform',
        isVerified: true,
        rating: 5.0,
      },
    });
    console.log('✅ Distributor profile created:', distributor);
  } else {
    console.log('✅ Distributor profile already exists:', distributor);
  }

  console.log('\n🎉 Done! You can now login with:');
  console.log('Phone: +998903333333');
  console.log('Password: 123456');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
