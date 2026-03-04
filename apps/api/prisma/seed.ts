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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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

  // Create tables (1-8) if they don't exist
  const existingTables = await prisma.table.count({ where: { restaurantId: restaurant.id } });
  if (existingTables === 0) {
    for (let n = 1; n <= 8; n++) {
      await prisma.table.create({
        data: { restaurantId: restaurant.id, number: n },
      });
    }
    console.log('  ✓ Tables: 8 created');
  } else {
    console.log('  ✓ Tables: already exist');
  }

  // Create menu categories and items if none exist
  const existingCategories = await prisma.menuCategory.count({ where: { restaurantId: restaurant.id } });
  if (existingCategories === 0) {
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
    console.log('  ✓ Menu: already exists');
  }

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
