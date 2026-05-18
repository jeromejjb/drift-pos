import './env';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createPoolFromDatabaseUrl, databaseHostIsLocal } from './lib/pgPool';
import QRCode from 'qrcode';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';
import stripeRouter from './routes/stripe';
import p2pRouter from './routes/p2p';
import createAuthRouter from './routes/auth';
import { createAuthMiddleware } from './routes/middleware';
import path from 'path';
import fs from 'fs';



console.log('API DATABASE_URL (startup):', process.env.DATABASE_URL);

const app = express();
const httpServer = createServer(app);

// Environment validation
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET!;
if (process.env.NODE_ENV === 'production' && JWT_SECRET.length < 32) {
  console.warn('SECURITY: JWT_SECRET should be at least 32 characters in production. Use: openssl rand -base64 32');
}

// CORS must run before rate limiter so 429 responses include CORS headers (browser would otherwise block them)
const allowedOriginPatterns = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https:\/\/drift-[a-z0-9-]+\.onrender\.com$/,
  /^https:\/\/[a-z0-9-]+\.driftpos\.com$/,
  /^https:\/\/driftpos\.com$/,
  /^https:\/\/www\.driftpos\.com$/,
];
const extraOrigins = (process.env.CORS_EXTRA_ORIGINS || '')
  .split(',')
  .map((o: string) => o.trim())
  .filter(Boolean);
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://drift-diner.onrender.com',
  'https://drift-restaurant.onrender.com',
  'https://drift-landing.onrender.com',
  'https://api.driftpos.com',
  'https://www.driftpos.com',
  'https://driftpos.com',
  'https://restaurant.driftpos.com',
  'https://app.driftpos.com',
  ...extraOrigins,
];
const isOriginAllowed = (origin: string | undefined) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return allowedOriginPatterns.some(p => p.test(origin));
};

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Rate limiting (after CORS so 429 still has CORS headers)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 500,
  message: { error: 'Too many requests', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { error: 'Too many failed attempts', code: 'AUTH_RATE_LIMITED' },
});

app.use('/api', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/change-password', authLimiter);

// Database — TLS + sslmode for any remote host; keepAlive/timeouts for hosted Postgres (Render, etc.)
const pool = createPoolFromDatabaseUrl();
console.log(
  '[db]',
  databaseHostIsLocal(process.env.DATABASE_URL)
    ? 'Using local Postgres (no TLS to pool).'
    : 'Using remote Postgres (TLS + sslmode=require on connection string).'
);

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Socket.io
const io = new Server(httpServer, {
  cors: { origin: (o) => !o || isOriginAllowed(o), credentials: true, methods: ['GET', 'POST'] },
  pingTimeout: 60000,
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://*.stripe.com"],
      scriptSrc: ["'self'", "https://*.stripe.com", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:", "https://*.stripe.com"],
      connectSrc: ["'self'", "https://*.onrender.com", "https://*.driftpos.com", "https://driftpos.com", "https://*.stripe.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:", "blob:"],
      frameSrc: ["'self'", "https://*.stripe.com", "https://js.stripe.com"],
      childSrc: ["'self'", "https://*.stripe.com"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
}));

// Stripe webhook MUST get raw body for signature verification
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
// Skip express.json for webhook so it doesn't overwrite raw body
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') return next();
  express.json({ limit: '10mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Minimal logging
morgan.token('body', (req: any) => {
  if (!req.body) return '';
  const sanitized = { ...req.body };
  ['password', 'currentPassword', 'newPassword', 'token', 'secret', 'cardNumber', 'cvv'].forEach(field => {
    if (sanitized[field]) sanitized[field] = '[REDACTED]';
  });
  return JSON.stringify(sanitized);
});

app.use(morgan(':method :url :status - :response-time ms'));

// Drift root
app.get('/', (req, res) => {
  const ascii = `
    ╔══════════════════════════════════════╗
    ║           DRIFT POS                  ║
    ║     ───────  ✦  ───────              ║
    ║        flow · pay · grow             ║
    ╚══════════════════════════════════════╝

  built on the great lakes · driftpos.com
  `;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(ascii);
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Drift API operational', timestamp: new Date().toISOString() });
});

app.get('/api/integration/p2p', (_req, res) => {
  res.status(410).json({
    error: 'This integration path is no longer used.',
    code: 'GONE',
    see: 'GET /api/integration',
  });
});

// Public integration metadata (no secrets).
app.get('/api/integration', (_req, res) => {
  res.json({
    version: '1',
    product: 'Drift POS',
    flows: {
      restaurantOnboarding:
        'Landing signup → Restaurant onboarding → Stripe Connect until charges and payouts are enabled',
      dinerTableCheckout:
        'Table QR → order → card checkout with PaymentIntent to the restaurant connected account',
    },
    endpoints: {
      health: 'GET /api/test',
      register: 'POST /api/auth/register',
      stripeCreateConnectedAccount: 'POST /api/stripe/create-account',
      orderPaymentIntent: 'POST /api/stripe/order/:orderId/create-payment-intent',
    },
    notes: {
      cors: 'Optional comma-separated browser origins in CORS_EXTRA_ORIGINS on the API.',
      stripeReturn:
        'Set RESTAURANT_URL or RESTAURANT_ONBOARDING_BASE_URL on the API so Stripe hosted onboarding refresh/return URLs open the restaurant app.',
    },
  });
});

// Stripe + diner routes
app.use('/api', stripeRouter);
// P2P + diner routes (Supabase auth).
// P2P endpoints inside this router now return P2P_DISABLED; diner endpoints remain active.
app.use('/api', p2pRouter);

// Auth (JWT for restaurant/landing): register, login, verify, change-password, send-sms
const authenticateToken = createAuthMiddleware(JWT_SECRET);
app.use('/api', createAuthRouter(authenticateToken));

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', database: 'connected', uptime: process.uptime() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// Restaurant endpoints
app.get('/api/restaurants/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, name: true, email: true, phone: true, address: true, logo: true, timezone: true, stripeAccount: true }
    });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found', code: 'NOT_FOUND' });
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch restaurant', code: 'SERVER_ERROR' });
  }
});

app.patch('/api/restaurants/:restaurantId', authenticateToken, async (req: any, res) => {
  try {
    const { restaurantId } = req.params;
    if (restaurantId !== req.user.restaurantId) {
      return res.status(403).json({ error: 'Unauthorized', code: 'FORBIDDEN' });
    }

    const { name, address, phone } = req.body;
    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { name, address, phone },
      select: { id: true, name: true, address: true, phone: true, email: true, logo: true, timezone: true }
    });
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update restaurant', code: 'SERVER_ERROR' });
  }
});

// Test tables for Dine tab (no QR needed) — returns first N tables from DB
app.get('/api/test-tables', async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      take: 10,
      orderBy: { number: 'asc' },
      include: { restaurant: { select: { name: true } } }
    });
    res.json(tables.map((t) => ({ id: t.id, number: t.number, restaurantName: t.restaurant.name })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch test tables', code: 'SERVER_ERROR' });
  }
});

app.get('/api/table/:tableId/restaurant', async (req, res) => {
  try {
    const { tableId } = req.params;
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { restaurant: { include: { tables: true } } }
    });
    if (!table) return res.status(404).json({ error: 'Table not found', code: 'NOT_FOUND' });
    res.json(table.restaurant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch restaurant', code: 'SERVER_ERROR' });
  }
});

// Table endpoints
app.get('/api/restaurant/:restaurantId/tables', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tables = await prisma.table.findMany({
      where: { restaurantId },
      orderBy: { number: 'asc' }
    });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tables', code: 'SERVER_ERROR' });
  }
});

app.post('/api/tables/:tableId/generate-qr', async (req, res) => {
  try {
    const { tableId } = req.params;
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { restaurant: true }
    });
    if (!table) return res.status(404).json({ error: 'Table not found', code: 'NOT_FOUND' });

    const baseUrl = process.env.DINER_URL || 'https://drift-diner.onrender.com';
    const url = `${baseUrl}/table/${tableId}`;
    
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    await prisma.table.update({ where: { id: tableId }, data: { qrCode: url } });

    res.json({ tableId: table.id, tableNumber: table.number, qrCode: qrDataUrl, url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code', code: 'SERVER_ERROR' });
  }
});

app.post('/api/restaurants/:restaurantId/tables/generate-qrs', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { tables: requestedTables } = req.body;
    
    // Validate we have tables to generate
    if (!requestedTables || !Array.isArray(requestedTables) || requestedTables.length === 0) {
      return res.status(400).json({ error: 'No tables provided', code: 'NO_TABLES' });
    }

    console.log(`🎯 Generating QR codes for ${requestedTables.length} tables for restaurant ${restaurantId}`);
    console.log('Requested tables:', requestedTables.map(t => ({ number: t.number, id: t.id })));

    const baseUrl = process.env.DINER_URL || 'https://app.driftpos.com';
    const qrCodes = [];

    // First, get ALL tables for this restaurant from the database
    const dbTables = await prisma.table.findMany({
      where: { restaurantId },
      orderBy: { number: 'asc' }
    });

    console.log(`📋 Found ${dbTables.length} tables in database:`, dbTables.map(t => ({ number: t.number, id: t.id })));

    // Match by table NUMBER; create missing tables so onboarding table count can exceed signup default
    for (const requestedTable of requestedTables) {
      let dbTable = dbTables.find(t => t.number === requestedTable.number);
      if (!dbTable) {
        dbTable = await prisma.table.create({
          data: { restaurantId, number: requestedTable.number }
        });
        dbTables.push(dbTable);
        console.log(`➕ Created table ${dbTable.number} for restaurant ${restaurantId}`);
      }

      const url = `${baseUrl}/table/${dbTable.id}`;
      const qrDataUrl = await QRCode.toDataURL(url, { 
        width: 400, 
        margin: 2, 
        color: { dark: '#000000', light: '#ffffff' } 
      });
      
      // Update the table with QR code URL
      await prisma.table.update({ 
        where: { id: dbTable.id }, 
        data: { qrCode: url } 
      });
      
      qrCodes.push({ 
        tableId: dbTable.id, 
        tableNumber: dbTable.number, 
        qrCode: qrDataUrl, 
        url 
      });
      
      console.log(`✅ Generated QR code for table ${dbTable.number} (ID: ${dbTable.id})`);
    }

    console.log(`✅ Successfully generated ${qrCodes.length} QR codes`);
    res.json({ tables: qrCodes });
    
  } catch (error) {
    console.error('❌ QR generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR codes', code: 'SERVER_ERROR' });
  }
});

app.get('/api/table/:tableId/qrcode', async (req, res) => {
  try {
    const { tableId } = req.params;
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { restaurant: true }
    });
    if (!table) return res.status(404).json({ error: 'Table not found', code: 'NOT_FOUND' });

    const baseUrl = process.env.DINER_URL || 'https://drift-diner.onrender.com';
    const url = `${baseUrl}/table/${tableId}`;
    const qrDataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2, color: { dark: '#000000', light: '#ffffff' } });

    res.json({ tableId: table.id, tableNumber: table.number, restaurantName: table.restaurant.name, qrCode: qrDataUrl, url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code', code: 'SERVER_ERROR' });
  }
});

app.get('/api/tables/:tableId/qrcode/download', async (req, res) => {
  try {
    const { tableId } = req.params;
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { restaurant: true }
    });
    if (!table) return res.status(404).json({ error: 'Table not found', code: 'NOT_FOUND' });

    const baseUrl = process.env.DINER_URL || 'https://drift-diner.onrender.com';
    const url = `${baseUrl}/table/${tableId}`;
    const qrBuffer = await QRCode.toBuffer(url, { width: 400, margin: 2, color: { dark: '#000000', light: '#ffffff' } });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename=table-${table.number}.png`);
    res.send(qrBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to download QR code', code: 'SERVER_ERROR' });
  }
});

// Menu endpoints
app.get('/api/restaurant/:restaurantId/menu', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId },
      include: { items: { where: { isAvailable: true }, orderBy: { name: 'asc' } } },
      orderBy: { sortOrder: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu', code: 'SERVER_ERROR' });
  }
});

/** Bulk import menu during onboarding. Requires auth. */
app.post('/api/restaurants/:restaurantId/menu/bulk', authenticateToken, async (req: any, res) => {
  try {
    const { restaurantId } = req.params;
    if (restaurantId !== req.user.restaurantId) {
      return res.status(403).json({ error: 'Unauthorized', code: 'FORBIDDEN' });
    }
    const { categories: inputCategories } = req.body;
    if (!inputCategories || !Array.isArray(inputCategories)) {
      return res.status(400).json({ error: 'categories array required', code: 'MISSING_FIELDS' });
    }
    let sortOrder = 0;
    for (const cat of inputCategories) {
      const name = (cat.name || '').trim();
      if (!name) continue;
      const category = await prisma.menuCategory.create({
        data: { name, restaurantId, sortOrder: sortOrder++ }
      });
      const items = Array.isArray(cat.items) ? cat.items : [];
      for (const item of items) {
        const itemName = (item.name || '').trim();
        if (!itemName) continue;
        const price = parseFloat(item.price);
        if (isNaN(price) || price < 0) continue;
        await prisma.menuItem.create({
          data: {
            name: itemName,
            description: (item.description || '').trim() || null,
            price,
            categoryId: category.id,
            restaurantId,
            isAvailable: true
          }
        });
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Bulk menu import error:', error);
    res.status(500).json({ error: 'Failed to import menu', code: 'SERVER_ERROR' });
  }
});

app.post('/api/menu/items', authenticateToken, async (req: any, res) => {
  try {
    const { name, description, price, categoryId, isAvailable } = req.body;
    const restaurantId = req.user.restaurantId;

    if (!name || !price || !categoryId) {
      return res.status(400).json({ error: 'Missing required fields', code: 'MISSING_FIELDS' });
    }

    const category = await prisma.menuCategory.findFirst({ where: { id: categoryId, restaurantId } });
    if (!category) return res.status(404).json({ error: 'Category not found', code: 'NOT_FOUND' });

    const menuItem = await prisma.menuItem.create({
      data: { name, description, price: parseFloat(price), categoryId, restaurantId, isAvailable: isAvailable ?? true }
    });

    res.status(201).json(menuItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create menu item', code: 'SERVER_ERROR' });
  }
});

app.patch('/api/menu/items/:itemId', authenticateToken, async (req: any, res) => {
  try {
    const { itemId } = req.params;
    const { name, description, price, isAvailable } = req.body;

    const existing = await prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId: req.user.restaurantId }
    });
    if (!existing) return res.status(404).json({ error: 'Menu item not found', code: 'NOT_FOUND' });

    const menuItem = await prisma.menuItem.update({
      where: { id: itemId },
      data: { name, description, price: price ? parseFloat(price) : undefined, isAvailable }
    });

    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu item', code: 'SERVER_ERROR' });
  }
});

app.delete('/api/menu/items/:itemId', authenticateToken, async (req: any, res) => {
  try {
    const { itemId } = req.params;

    const existing = await prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId: req.user.restaurantId }
    });
    if (!existing) return res.status(404).json({ error: 'Menu item not found', code: 'NOT_FOUND' });

    await prisma.menuItem.delete({ where: { id: itemId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu item', code: 'SERVER_ERROR' });
  }
});

app.post('/api/menu/categories', authenticateToken, async (req: any, res) => {
  try {
    const { name } = req.body;
    const restaurantId = req.user.restaurantId;

    const lastCategory = await prisma.menuCategory.findFirst({
      where: { restaurantId },
      orderBy: { sortOrder: 'desc' }
    });

    const category = await prisma.menuCategory.create({
      data: { name, restaurantId, sortOrder: (lastCategory?.sortOrder || 0) + 1 }
    });

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category', code: 'SERVER_ERROR' });
  }
});

// Order endpoints (require auth; restaurant staff only)
app.get('/api/restaurant/:restaurantId/orders', authenticateToken, async (req: any, res) => {
  try {
    const { restaurantId } = req.params;
    if (restaurantId !== req.user.restaurantId) {
      return res.status(403).json({ error: 'Unauthorized', code: 'FORBIDDEN' });
    }
    const orders = await prisma.order.findMany({
      where: { restaurantId },
      include: { items: { include: { menuItem: true } }, table: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const formattedOrders = orders.map(order => ({
      id: order.id,
      tableNumber: order.table.number,
      items: order.items.map(item => ({ name: item.menuItem.name, quantity: item.quantity, price: item.price })),
      status: order.status.toLowerCase(),
      total: order.total,
      createdAt: order.createdAt
    }));

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders', code: 'SERVER_ERROR' });
  }
});

app.get('/api/restaurant/:restaurantId/stats', authenticateToken, async (req: any, res) => {
  try {
    const { restaurantId } = req.params;
    if (restaurantId !== req.user.restaurantId) {
      return res.status(403).json({ error: 'Unauthorized', code: 'FORBIDDEN' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = await prisma.order.findMany({
      where: { restaurantId, createdAt: { gte: today, lt: tomorrow } }
    });

    const activeOrders = await prisma.order.groupBy({
      by: ['status'],
      where: { restaurantId, status: { in: ['PENDING', 'PREPARING', 'READY'] } },
      _count: true
    });

    res.json({
      total: todayOrders.length,
      pending: activeOrders.find(o => o.status === 'PENDING')?._count || 0,
      preparing: activeOrders.find(o => o.status === 'PREPARING')?._count || 0,
      ready: activeOrders.find(o => o.status === 'READY')?._count || 0,
      revenue: todayOrders.reduce((sum, order) => sum + order.total, 0)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats', code: 'SERVER_ERROR' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { restaurantId, tableId, userId, items, total, tip } = req.body;

    if (!restaurantId || !userId || !items || !total) {
      return res.status(400).json({ error: 'Missing required fields', code: 'MISSING_FIELDS' });
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found', code: 'NOT_FOUND' });

    let table;
    if (tableId) {
      table = await prisma.table.findUnique({ where: { id: tableId } });
      if (!table) return res.status(404).json({ error: 'Table not found', code: 'NOT_FOUND' });
    } else {
      // Walk-in / Quick Order: use table 0 (create if needed)
      table = await prisma.table.findFirst({ where: { restaurantId, number: 0 } });
      if (!table) {
        table = await prisma.table.create({
          data: { restaurantId, number: 0, section: 'Walk-in' }
        });
      }
    }

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, name: 'Guest User' }
    });

    const orderItemsWithPrice: Array<{ menuItemId: string; quantity: number; price: number }> = [];
    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (!menuItem) return res.status(404).json({ error: `Menu item not found: ${item.menuItemId}`, code: 'NOT_FOUND' });
      orderItemsWithPrice.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price ?? menuItem.price
      });
    }

    const order = await prisma.order.create({
      data: {
        restaurantId,
        tableId: table.id,
        userId: user.id,
        total,
        tipAmount: tip || 0,
        status: 'PENDING',
        items: { create: orderItemsWithPrice.map((item: any) => ({ menuItemId: item.menuItemId, quantity: item.quantity, price: item.price, userId: user.id })) }
      },
      include: { items: { include: { menuItem: true } }, table: true }
    });

    io.to(`restaurant:${restaurantId}`).emit('order-updated', order);
    res.json(order);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(500).json({ error: 'Database error', code: error.code });
    }
    res.status(500).json({ error: 'Failed to create order', code: 'SERVER_ERROR' });
  }
});

app.get('/api/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { menuItem: true } },
        restaurant: { select: { name: true } },
        table: { select: { number: true } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found', code: 'NOT_FOUND' });
    res.json({
      id: order.id,
      total: order.total,
      tipAmount: order.tipAmount,
      status: order.status,
      createdAt: order.createdAt,
      restaurantName: order.restaurant.name,
      tableNumber: order.table?.number ?? 0,
      items: order.items.map((i) => ({ name: i.menuItem.name, quantity: i.quantity, price: i.price })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order', code: 'SERVER_ERROR' });
  }
});

app.patch('/api/order/:orderId/status', authenticateToken, async (req: any, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status?.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid status', code: 'INVALID_STATUS' });
    }

    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) return res.status(404).json({ error: 'Order not found', code: 'NOT_FOUND' });
    if (existing.restaurantId !== req.user.restaurantId) {
      return res.status(403).json({ error: 'Unauthorized', code: 'FORBIDDEN' });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: status.toUpperCase() },
      include: { restaurant: true }
    });

    io.to(`restaurant:${order.restaurantId}`).emit('order-updated', order);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order', code: 'SERVER_ERROR' });
  }
});

// Demo scheduling
app.post('/api/demo/schedule', async (req, res) => {
  try {
    const { name, email, phone, restaurant, role, teamSize, date, time, message } = req.body;

    if (!name || !email || !restaurant || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields', code: 'MISSING_FIELDS' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format', code: 'INVALID_EMAIL' });
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({ error: 'Date must be in the future', code: 'INVALID_DATE' });
    }

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const existingRequest = await prisma.demoRequest.findFirst({
      where: { email: email.toLowerCase(), createdAt: { gte: oneDayAgo } }
    });

    if (existingRequest) {
      return res.status(429).json({ error: 'Request already submitted recently', code: 'RATE_LIMITED' });
    }

    const demoRequest = await prisma.demoRequest.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        restaurantName: restaurant.trim(),
        role: role || null,
        teamSize: teamSize || null,
        preferredDate: selectedDate,
        preferredTime: time,
        message: message?.trim() || null,
        status: 'PENDING'
      }
    });

    res.status(201).json({ success: true, message: 'Demo scheduled', id: demoRequest.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule demo', code: 'SERVER_ERROR' });
  }
});

// Restaurant analytics (for owners/staff)
app.get('/api/restaurant/:restaurantId/analytics', authenticateToken, async (req: any, res) => {
  try {
    const { restaurantId } = req.params;
    if (restaurantId !== req.user.restaurantId) {
      return res.status(403).json({ error: 'Unauthorized', code: 'FORBIDDEN' });
    }
    const { period = '7d' } = req.query; // 7d, 14d, 30d, 90d
    const daysMap: Record<string, number> = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 };
    const days = daysMap[period as string] ?? 7;

    const now = new Date();
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - days);
    start.setUTCHours(0, 0, 0, 0);
    const prevStart = new Date(start);
    prevStart.setUTCDate(prevStart.getUTCDate() - days);

    const [orders, prevOrders, loyaltyCountResult, loyaltyByTierResult] = await Promise.all([
      prisma.order.findMany({
        where: { restaurantId, createdAt: { gte: start, lte: now }, status: { not: 'CANCELLED' } },
        include: { items: { include: { menuItem: true } } },
      }),
      prisma.order.findMany({
        where: { restaurantId, createdAt: { gte: prevStart, lt: start }, status: { not: 'CANCELLED' } },
      }),
      prisma.dinerLoyalty.count({ where: { restaurantId } }).catch(() => 0),
      prisma.dinerLoyalty.groupBy({
        by: ['tier'],
        where: { restaurantId },
        _count: true,
      }).catch(() => []),
    ]);
    const loyaltyCount = typeof loyaltyCountResult === 'number' ? loyaltyCountResult : 0;
    const loyaltyByTier: Record<string, number> = {};
    if (Array.isArray(loyaltyByTierResult)) {
      for (const r of loyaltyByTierResult) {
        loyaltyByTier[r.tier] = r._count;
      }
    }

    const revenue = orders.reduce((s, o) => s + o.total + (o.tipAmount ?? 0), 0);
    const prevRevenue = prevOrders.reduce((s, o) => s + o.total + (o.tipAmount ?? 0), 0);
    const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : (revenue > 0 ? 100 : 0);
    const orderCount = orders.length;
    const prevOrderCount = prevOrders.length;
    const orderChange = prevOrderCount > 0 ? ((orderCount - prevOrderCount) / prevOrderCount) * 100 : (orderCount > 0 ? 100 : 0);
    const avgCheck = orderCount > 0 ? revenue / orderCount : 0;
    const prevAvgCheck = prevOrderCount > 0 ? prevRevenue / prevOrderCount : 0;
    const avgCheckChange = prevAvgCheck > 0 ? ((avgCheck - prevAvgCheck) / prevAvgCheck) * 100 : (avgCheck > 0 ? 100 : 0);

    const toDateKey = (d: Date) => d.toISOString().slice(0, 10);
    const byDate = new Map<string, { date: string; revenue: number; orders: number }>();
    // Include every UTC day from start through today (orders use lte: now, so today can have data)
    const endOfRange = new Date(now);
    endOfRange.setUTCHours(0, 0, 0, 0);
    const startOfRange = new Date(start);
    const numDays = Math.round((endOfRange.getTime() - startOfRange.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    for (let d = 0; d < numDays; d++) {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + d);
      const key = toDateKey(date);
      byDate.set(key, { date: key, revenue: 0, orders: 0 });
    }
    for (const o of orders) {
      const key = toDateKey(new Date(o.createdAt));
      const cur = byDate.get(key);
      if (cur) {
        cur.revenue += o.total + (o.tipAmount ?? 0);
        cur.orders += 1;
      }
    }

    const itemRevenue = new Map<string, { name: string; revenue: number; count: number }>();
    for (const order of orders) {
      for (const oi of order.items) {
        const id = oi.menuItemId;
        const rev = (oi.price ?? 0) * (oi.quantity ?? 1);
        const qty = oi.quantity ?? 1;
        const cur = itemRevenue.get(id);
        if (cur) {
          cur.revenue += rev;
          cur.count += qty;
        } else {
          itemRevenue.set(id, { name: oi.menuItem?.name ?? 'Unknown', revenue: rev, count: qty });
        }
      }
    }
    const topItemsFormatted = Array.from(itemRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(({ name, revenue, count }) => ({ name, revenue, orders: count }));

    const byDaySorted = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      period: `${days}d`,
      revenue: { current: revenue, previous: prevRevenue, changePercent: revenueChange },
      orders: { current: orderCount, previous: prevOrderCount, changePercent: orderChange },
      avgCheck: { current: avgCheck, previous: prevAvgCheck, changePercent: avgCheckChange },
      byDay: byDaySorted,
      topItems: topItemsFormatted,
      loyaltyMembers: loyaltyCount,
      loyaltyByTier: { BRONZE: loyaltyByTier.BRONZE ?? 0, SILVER: loyaltyByTier.SILVER ?? 0, GOLD: loyaltyByTier.GOLD ?? 0 },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics', code: 'SERVER_ERROR' });
  }
});

app.get('/api/demo/requests', authenticateToken, async (req: any, res) => {
  try {
    const { status, limit = '50', page = '1' } = req.query;
    const pageSize = Math.min(parseInt(limit as string), 100);
    const pageNumber = Math.max(parseInt(page as string), 1);
    const skip = (pageNumber - 1) * pageSize;

    const where: any = {};
    if (status) where.status = status;

    const [totalCount, requests] = await Promise.all([
      prisma.demoRequest.count({ where }),
      prisma.demoRequest.findMany({ where, orderBy: { createdAt: 'desc' }, take: pageSize, skip })
    ]);

    res.json({ data: requests, pagination: { total: totalCount, page: pageNumber, limit: pageSize, totalPages: Math.ceil(totalCount / pageSize) } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch demo requests', code: 'SERVER_ERROR' });
  }
});

app.get('/api/demo/stats', authenticateToken, async (req: any, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [total, todayCount, weekCount, monthCount, statusCounts] = await Promise.all([
      prisma.demoRequest.count(),
      prisma.demoRequest.count({ where: { createdAt: { gte: today } } }),
      prisma.demoRequest.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.demoRequest.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.demoRequest.groupBy({ by: ['status'], _count: true })
    ]);

    const byStatus = statusCounts.reduce((acc: any, curr) => { acc[curr.status] = curr._count; return acc; }, {});

    res.json({
      total,
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
      byStatus: {
        pending: byStatus.PENDING || 0,
        contacted: byStatus.CONTACTED || 0,
        completed: byStatus.COMPLETED || 0,
        cancelled: byStatus.CANCELLED || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats', code: 'SERVER_ERROR' });
  }
});

// Socket.io
io.on('connection', (socket) => {
  socket.on('join-table', (tableId) => socket.join(`table:${tableId}`));
  socket.on('join-restaurant', (restaurantId) => socket.join(`restaurant:${restaurantId}`));
});

app.set('io', io);

// User endpoints
app.get('/api/users/:userId', authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.params;
    if (userId !== req.user.userId) return res.status(403).json({ error: 'Unauthorized', code: 'FORBIDDEN' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user', code: 'SERVER_ERROR' });
  }
});

app.patch('/api/users/:userId', authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone } = req.body;

    if (userId !== req.user.userId) return res.status(403).json({ error: 'Unauthorized', code: 'FORBIDDEN' });

    if (email && email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) return res.status(409).json({ error: 'Email already in use', code: 'EMAIL_EXISTS' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, email, phone },
      select: { id: true, name: true, email: true, phone: true }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user', code: 'SERVER_ERROR' });
  }
});

// ============================================
// STATIC FILE SERVING AND CLIENT-SIDE ROUTING
// ============================================

const landingBuildPath = path.join(__dirname, '../../landing/dist');
console.log('📁 Serving static files from:', landingBuildPath);

// Check if build exists
if (fs.existsSync(landingBuildPath)) {
  console.log('✅ Landing build found, serving static files');
  
  // Serve static files (CSS, JS, images, etc.)
  app.use(express.static(landingBuildPath));

  // Handle client-side routing - THIS IS THE KEY FIX FOR REFRESHES
  app.get(/^\/(?!api).*/, (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found', code: 'NOT_FOUND' });
    }
    
    // For all other routes, serve the React app
    // This allows React Router to handle /signup, /login, etc.
    res.sendFile(path.join(landingBuildPath, 'index.html'));
  });
} else {
  console.log('⚠️ Landing build not found at:', landingBuildPath);
  console.log('Make sure to run: cd apps/landing && npm run build');
}

// ============================================
// 404 HANDLER - ONLY FOR API ROUTES NOW
// ============================================

// 404 handler: JSON for API routes, plain for others
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'Endpoint not found', code: 'NOT_FOUND' });
  } else {
    res.status(404).send('Not found');
  }
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
});

// Start server (skip in test to allow supertest)
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  httpServer.listen(parseInt(PORT.toString()), '0.0.0.0', () => {
    console.log(`Drift API running on port ${PORT}`);
    console.log(`📍 Serving landing app from: ${landingBuildPath}`);
  });
}

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  httpServer.close(() => process.exit(0));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { app, prisma, io };