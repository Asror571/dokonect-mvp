import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing driver query...');
    
    const drivers = await prisma.driver.findMany({
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });
    
    console.log('✅ Found drivers:', drivers.length);
    console.log(JSON.stringify(drivers, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
