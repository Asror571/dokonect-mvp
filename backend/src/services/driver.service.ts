import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export class DriverService {
  // DRV-01: Create driver
  async createDriver(data: any) {
    const { name, phone, vehicleType, vehicleNumber, licenseNumber, zones, ...rest } = data;

    // Check if phone exists
    const existing = await prisma.user.findUnique({
      where: { phone }
    });

    if (existing) throw new Error('Telefon raqam allaqachon mavjud');

    // Generate password
    const password = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and driver
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        role: 'DRIVER',
        driver: {
          create: {
            vehicleType,
            vehicleNumber,
            licenseNumber,
            ...rest
          }
        }
      },
      include: { driver: true }
    });

    // Assign zones
    if (zones && zones.length > 0) {
      await Promise.all(
        zones.map((zoneId: string) =>
          prisma.driverZone.create({
            data: {
              driverId: user.driver!.id,
              zoneId
            }
          })
        )
      );
    }

    // TODO: Send SMS with login credentials
    console.log(`Driver created: ${phone} / ${password}`);

    return { ...user, tempPassword: password };
  }

  // DRV-01: List drivers
  async listDrivers(filters: any) {
    const { status, zoneId, search } = filters;

    const where: any = {};

    if (status) where.status = status;
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } }
        ]
      };
    }

    if (zoneId) {
      where.zones = {
        some: { zoneId }
      };
    }

    return prisma.driver.findMany({
      where,
      include: {
        user: { select: { name: true, phone: true, avatar: true } },
        zones: {
          include: { zone: true }
        },
        orders: {
          where: {
            status: { in: ['ASSIGNED', 'IN_TRANSIT'] }
          },
          select: { id: true }
        }
      }
    });
  }

  // DRV-01: Get driver details
  async getDriverById(id: string) {
    return prisma.driver.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, phone: true, email: true, avatar: true } },
        zones: {
          include: { zone: true }
        },
        orders: {
          include: {
            client: {
              include: { user: { select: { name: true } } }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
  }

  // DRV-01: Update driver
  async updateDriver(id: string, data: any) {
    const { zones, ...driverData } = data;

    const driver = await prisma.driver.update({
      where: { id },
      data: driverData
    });

    // Update zones if provided
    if (zones) {
      await prisma.driverZone.deleteMany({ where: { driverId: id } });
      await Promise.all(
        zones.map((zoneId: string) =>
          prisma.driverZone.create({
            data: { driverId: id, zoneId }
          })
        )
      );
    }

    return this.getDriverById(id);
  }

  // DRV-01: Deactivate driver
  async deactivateDriver(id: string) {
    return prisma.driver.update({
      where: { id },
      data: { status: 'INACTIVE' }
    });
  }

  // DRV-04: Get driver statistics
  async getDriverStats(driverId: string, period?: string) {
    const where: any = { driverId };

    if (period) {
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      where.createdAt = { gte: startDate };
    }

    const [total, delivered, cancelled] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: { ...where, status: 'DELIVERED' } }),
      prisma.order.count({ where: { ...where, status: 'CANCELLED' } })
    ]);

    const successRate = total > 0 ? (delivered / total) * 100 : 0;

    // Calculate average delivery time
    const deliveredOrders = await prisma.order.findMany({
      where: { ...where, status: 'DELIVERED' },
      include: {
        statusHistory: {
          where: {
            status: { in: ['ASSIGNED', 'DELIVERED'] }
          },
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    let totalTime = 0;
    let count = 0;

    deliveredOrders.forEach(order => {
      const assigned = order.statusHistory.find(h => h.status === 'ASSIGNED');
      const delivered = order.statusHistory.find(h => h.status === 'DELIVERED');

      if (assigned && delivered) {
        const diff = delivered.timestamp.getTime() - assigned.timestamp.getTime();
        totalTime += diff;
        count++;
      }
    });

    const avgDeliveryTime = count > 0 ? Math.round(totalTime / count / 60000) : 0; // minutes

    return {
      total,
      delivered,
      cancelled,
      successRate: Math.round(successRate),
      avgDeliveryTime
    };
  }

  // DRV-03: Zone management
  async createZone(data: any) {
    return prisma.zone.create({ data });
  }

  async listZones() {
    return prisma.zone.findMany({
      include: {
        drivers: {
          include: {
            driver: {
              include: {
                user: { select: { name: true } }
              }
            }
          }
        }
      }
    });
  }

  async updateZone(id: string, data: any) {
    return prisma.zone.update({
      where: { id },
      data
    });
  }

  async deleteZone(id: string) {
    return prisma.zone.delete({ where: { id } });
  }
}
