/**
 * Seed script: creates a demo restaurant for showcasing the Drift platform.
 *
 * Run: npx prisma db seed (or: cd apps/api && npx prisma db seed)
 *
 * Demo credentials:
 *   Email:    demo@driftpos.com
 *   Password: Demo123!
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const connStr = process.env.DATABASE_URL!;
const isExternal = connStr.includes('render.com') || connStr.includes('amazonaws.com');
const pool = new Pool({
  connectionString: connStr,
  ssl: isExternal ? { rejectUnauthorized: false } : false,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = 'demo@driftpos.com';
const DEMO_PASSWORD = 'Demo123!';
const DEMO_RESTAURANT_NAME = 'Drift Demo Kitchen';

async function main() {
  console.log('🌱 Seeding demo restaurant...');

  // Upsert demo user
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      name: 'Demo Owner',
      passwordHash: hashedPassword,
    },
    create: {
      email: DEMO_EMAIL,
      name: 'Demo Owner',
      passwordHash: hashedPassword,
    },
  });
  console.log('  ✓ User:', user.email);

  // Find or create demo restaurant (linked to demo user)
  let restaurant = await prisma.restaurant.findFirst({
    where: { supabaseUserId: user.id },
  });
  if (restaurant) {
    restaurant = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        name: DEMO_RESTAURANT_NAME,
        address: '123 Demo Street, San Francisco, CA 94102',
        phone: '4155550123',
        email: DEMO_EMAIL,
        timezone: 'America/Los_Angeles',
      },
    });
  } else {
    restaurant = await prisma.restaurant.create({
      data: {
        name: DEMO_RESTAURANT_NAME,
        address: '123 Demo Street, San Francisco, CA 94102',
        phone: '4155550123',
        email: DEMO_EMAIL,
        supabaseUserId: user.id,
        timezone: 'America/Los_Angeles',
      },
    });
  }
  console.log('  ✓ Restaurant:', restaurant.name);

  // Create tables (0 = Walk-in, 1-8) if they don't exist
  const existingTables = await prisma.table.count({ where: { restaurantId: restaurant.id } });
  if (existingTables === 0) {
    await prisma.table.create({
      data: { restaurantId: restaurant.id, number: 0, section: 'Walk-in' },
    });
    for (let n = 1; n <= 8; n++) {
      await prisma.table.create({
        data: { restaurantId: restaurant.id, number: n },
      });
    }
    console.log('  ✓ Tables: 9 created (Walk-in + 1-8)');
  } else {
    console.log('  ✓ Tables: already exist');
  }

  // Create menu categories and items if none exist (demo must always have a menu)
  const existingMenuItems = await prisma.menuItem.count({ where: { restaurantId: restaurant.id } });
  if (existingMenuItems === 0) {
    // Remove any orphaned categories first (e.g. from partial setup)
    await prisma.menuCategory.deleteMany({ where: { restaurantId: restaurant.id } });
    const appetizers = await prisma.menuCategory.create({
      data: { name: 'Appetizers', restaurantId: restaurant.id, sortOrder: 0 },
    });
    const mains = await prisma.menuCategory.create({
      data: { name: 'Mains', restaurantId: restaurant.id, sortOrder: 1 },
    });
    const drinks = await prisma.menuCategory.create({
      data: { name: 'Drinks', restaurantId: restaurant.id, sortOrder: 2 },
    });
    const desserts = await prisma.menuCategory.create({
      data: { name: 'Desserts', restaurantId: restaurant.id, sortOrder: 3 },
    });

    const items = [
      { categoryId: appetizers.id, name: 'Bruschetta', description: 'Toasted bread with tomato, basil, garlic', price: 9 },
      { categoryId: appetizers.id, name: 'Caesar Salad', description: 'Romaine, parmesan, croutons', price: 12 },
      { categoryId: appetizers.id, name: 'Soup of the Day', description: 'Ask your server', price: 8 },
      { categoryId: mains.id, name: 'Grilled Salmon', description: 'With seasonal vegetables', price: 24 },
      { categoryId: mains.id, name: 'Pasta Carbonara', description: 'Creamy bacon and egg', price: 18 },
      { categoryId: mains.id, name: 'Burger & Fries', description: 'Angus beef, house sauce', price: 16 },
      { categoryId: mains.id, name: 'Vegetarian Bowl', description: 'Quinoa, roasted veggies, tahini', price: 15 },
      { categoryId: drinks.id, name: 'House Coffee', description: 'Fresh brewed', price: 4 },
      { categoryId: drinks.id, name: 'Fresh Lemonade', description: 'House-made', price: 5 },
      { categoryId: drinks.id, name: 'Craft Beer', description: 'Rotating selection', price: 7 },
      { categoryId: desserts.id, name: 'Tiramisu', description: 'Classic Italian', price: 10 },
      { categoryId: desserts.id, name: 'Chocolate Cake', description: 'Warm, with ice cream', price: 9 },
    ];

    for (const item of items) {
      await prisma.menuItem.create({
        data: {
          ...item,
          restaurantId: restaurant.id,
          isAvailable: true,
        },
      });
    }
    console.log('  ✓ Menu: 4 categories, 12 items');
  } else {
    console.log('  ✓ Menu: already exists (' + existingMenuItems + ' items)');
  }

  // Create demo orders for an incredible first impression
  const existingOrders = await prisma.order.count({ where: { restaurantId: restaurant.id } });
  if (existingOrders === 0) {
    const allTables = await prisma.table.findMany({ where: { restaurantId: restaurant.id } });
    const menuItems = await prisma.menuItem.findMany({ where: { restaurantId: restaurant.id } });
    if (allTables.length > 0 && menuItems.length >= 2) {
      const guestUser = await prisma.user.upsert({
        where: { id: 'demo-guest' },
        update: {},
        create: { id: 'demo-guest', name: 'Demo Guest' },
      });
      const dinerUser = await prisma.user.upsert({
        where: { id: 'demo-diner' },
        update: {},
        create: { id: 'demo-diner', name: 'Demo Diner', email: 'diner@demo.driftpos.com' },
      });
      const walkIn = allTables.find((t) => t.number === 0) || allTables[0];
      const orders = [
        { table: walkIn, items: [menuItems[0], menuItems[1]], status: 'PENDING' as const, tip: 2 },
        { table: allTables[1] || allTables[0], items: [menuItems[2], menuItems[3], menuItems[4]], status: 'PREPARING' as const, tip: 3 },
        { table: allTables[2] || allTables[0], items: [menuItems[1], menuItems[5]], status: 'READY' as const, tip: 2 },
        { table: allTables[3] || allTables[0], items: [menuItems[0], menuItems[3]], status: 'SERVED' as const, tip: 4 },
        { table: allTables[4] || allTables[0], items: [menuItems[6], menuItems[7]], status: 'PENDING' as const, tip: 2 },
        { table: allTables[5] || allTables[0], items: [menuItems[8], menuItems[9]], status: 'PREPARING' as const, tip: 3 },
        { table: walkIn, items: [menuItems[10], menuItems[11]], status: 'READY' as const, tip: 2 },
      ];
      for (const o of orders) {
        const total = o.items.reduce((sum, i) => sum + i.price, 0);
        await prisma.order.create({
          data: {
            restaurantId: restaurant.id,
            tableId: o.table.id,
            userId: guestUser.id,
            total,
            tipAmount: o.tip,
            status: o.status,
            items: {
              create: o.items.map((item) => ({
                menuItemId: item.id,
                quantity: 1,
                price: item.price,
                userId: guestUser.id,
              })),
            },
          },
        });
      }
      // Add completed orders for analytics demo (past 7 days)
      const now = new Date();
      for (let d = 0; d < 7; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        date.setHours(12 + (d % 3), 30, 0, 0);
        const orderUser = d % 2 === 0 ? guestUser : dinerUser;
        const m1 = menuItems[d % menuItems.length];
        const m2 = menuItems[(d + 1) % menuItems.length];
        const total = (m1?.price ?? 10) + (m2?.price ?? 8);
        await prisma.order.create({
          data: {
            restaurantId: restaurant.id,
            tableId: allTables[d % allTables.length].id,
            userId: orderUser.id,
            total,
            tipAmount: Math.round(total * 0.18),
            status: 'COMPLETED',
            completedAt: date,
            createdAt: date,
            items: {
              create: [
                { menuItemId: m1.id, quantity: 1, price: m1.price, userId: orderUser.id },
                { menuItemId: m2.id, quantity: 1, price: m2.price, userId: orderUser.id },
              ],
            },
          },
        });
      }
      console.log('  ✓ Demo orders: 14 created (7 active + 7 completed for analytics)');

      // Seed loyalty data for demo
      await prisma.dinerLoyalty.upsert({
        where: { restaurantId_userId: { restaurantId: restaurant.id, userId: dinerUser.id } },
        create: {
          restaurantId: restaurant.id,
          userId: dinerUser.id,
          email: dinerUser.email ?? undefined,
          points: 142,
          tier: 'SILVER',
          lastOrderAt: new Date(),
        },
        update: { points: 142, tier: 'SILVER', lastOrderAt: new Date() },
      });
      await prisma.dinerLoyalty.upsert({
        where: { restaurantId_userId: { restaurantId: restaurant.id, userId: guestUser.id } },
        create: {
          restaurantId: restaurant.id,
          userId: guestUser.id,
          points: 68,
          tier: 'BRONZE',
          lastOrderAt: new Date(),
        },
        update: { points: 68, tier: 'BRONZE', lastOrderAt: new Date() },
      });
      console.log('  ✓ Demo loyalty: 2 members (Bronze 68 pts, Silver 142 pts)');
    }
  } else {
    console.log('  ✓ Demo orders: already exist');
    // Ensure we have some completed orders for analytics demo (past 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const completedCount = await prisma.order.count({
      where: { restaurantId: restaurant.id, status: 'COMPLETED', createdAt: { gte: weekAgo } },
    });
    if (completedCount < 5) {
      const allTables = await prisma.table.findMany({ where: { restaurantId: restaurant.id } });
      const menuItems = await prisma.menuItem.findMany({ where: { restaurantId: restaurant.id } });
      if (allTables.length > 0 && menuItems.length >= 2) {
        const guestUser = await prisma.user.upsert({
        where: { id: 'demo-guest' },
        update: {},
        create: { id: 'demo-guest', name: 'Demo Guest' },
      });
      const dinerUser = await prisma.user.upsert({
        where: { id: 'demo-diner' },
        update: {},
        create: { id: 'demo-diner', name: 'Demo Diner', email: 'diner@demo.driftpos.com' },
      });
      const now = new Date();
      for (let d = 0; d < 5; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        date.setHours(12 + (d % 3), 30, 0, 0);
        const orderUser = d % 2 === 0 ? guestUser : dinerUser;
        const m1 = menuItems[d % menuItems.length];
        const m2 = menuItems[(d + 1) % menuItems.length];
        const total = (m1?.price ?? 10) + (m2?.price ?? 8);
        await prisma.order.create({
          data: {
            restaurantId: restaurant.id,
            tableId: allTables[d % allTables.length].id,
            userId: orderUser.id,
            total,
            tipAmount: Math.round(total * 0.18),
            status: 'COMPLETED',
            completedAt: date,
            createdAt: date,
            items: {
              create: [
                { menuItemId: m1.id, quantity: 1, price: m1.price, userId: orderUser.id },
                { menuItemId: m2.id, quantity: 1, price: m2.price, userId: orderUser.id },
              ],
            },
          },
        });
      }
        console.log('  ✓ Added 5 completed orders for analytics demo');
      }
    }
  }

  // Always ensure demo loyalty data exists (for analytics demo)
  const loyaltyMembers = [
    { id: 'demo-diner', email: 'diner@demo.driftpos.com', points: 142, tier: 'SILVER' as const },
    { id: 'demo-guest', email: null, points: 68, tier: 'BRONZE' as const },
    { id: 'demo-loyalty-1', email: 'loyalty1@demo.driftpos.com', points: 320, tier: 'GOLD' as const },
    { id: 'demo-loyalty-2', email: 'loyalty2@demo.driftpos.com', points: 185, tier: 'SILVER' as const },
    { id: 'demo-loyalty-3', email: 'loyalty3@demo.driftpos.com', points: 92, tier: 'BRONZE' as const },
    { id: 'demo-loyalty-4', email: 'loyalty4@demo.driftpos.com', points: 45, tier: 'BRONZE' as const },
    { id: 'demo-loyalty-5', email: 'loyalty5@demo.driftpos.com', points: 210, tier: 'SILVER' as const },
    { id: 'demo-loyalty-6', email: 'loyalty6@demo.driftpos.com', points: 550, tier: 'GOLD' as const },
  ];
  for (const m of loyaltyMembers) {
    const u = await prisma.user.upsert({
      where: { id: m.id },
      update: {},
      create: { id: m.id, name: m.email?.split('@')[0] ?? m.id, email: m.email ?? undefined },
    });
    await prisma.dinerLoyalty.upsert({
      where: { restaurantId_userId: { restaurantId: restaurant.id, userId: u.id } },
      create: {
        restaurantId: restaurant.id,
        userId: u.id,
        email: m.email ?? undefined,
        points: m.points,
        tier: m.tier,
        lastOrderAt: new Date(),
      },
      update: { points: m.points, tier: m.tier, lastOrderAt: new Date() },
    });
  }
  console.log('  ✓ Demo loyalty: ' + loyaltyMembers.length + ' members');

  console.log('');
  console.log('✅ Demo restaurant ready!');
  console.log('');
  console.log('  Sign in at: https://driftpos.com/login (or your landing URL)');
  console.log('  Email:    ' + DEMO_EMAIL);
  console.log('  Password: ' + DEMO_PASSWORD);
  console.log('  Restaurant ID: ' + restaurant.id);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
