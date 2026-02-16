import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';
import stripeRouter from './routes/stripe';

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const httpServer = createServer(app);

// ==================== BANK-GRADE SECURITY ====================

// Generate a strong JWT secret if not provided
const JWT_SECRET = process.env.JWT_SECRET || randomBytes(64).toString('hex');
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  No JWT_SECRET provided - generated temporary secret. Set JWT_SECRET in production!');
}

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
  skipSuccessfulRequests: true, // Only count failures
  message: 'Too many failed attempts. Try again later.',
});

// Apply rate limiting before routes
app.use('/api', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/change-password', authLimiter);

// Setup PostgreSQL connection pool with SSL
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ 
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// CORS configuration - strict whitelist
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://drift-diner.onrender.com',
  'https://drift-restaurant.onrender.com',
  'https://drift-landing.onrender.com',
  'https://drift-api-7vs7.onrender.com',
  'https://www.driftpos.com',
  'https://driftpos.com'      
];

// Socket.io setup with strict CORS
const io = new Server(httpServer, {
  cors: { 
    origin: allowedOrigins, 
    credentials: true,
    methods: ['GET', 'POST']
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
  },
});

// ==================== ENHANCED SECURITY MIDDLEWARE ====================

// Helmet with strict CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", ...allowedOrigins],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
}));

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 204,
}));

// Secure JSON parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitized logging
morgan.token('body', (req: any) => {
  if (!req.body) return '';
  const sanitized = { ...req.body };
  const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'token', 'secret'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) sanitized[field] = '[REDACTED]';
  });
  return JSON.stringify(sanitized);
});

app.use(morgan(':method :url :status :body - :response-time ms'));

// ==================== FUN ROOT ENDPOINT ====================
app.get('/', (req, res) => {
  const ascii = `
\x1b[36m    ╔══════════════════════════════════════╗
    ║     ╔═╗╦═╗╔═╗╔╦╗╔═╗╔╦╗  ╔═╗╔═╗╔╦╗    ║
    ║     ║ ╦╠╦╝╠═╣║║║╠═╣ ║   ║  ║ ║ ║║    ║
    ║     ╚═╝╩╚═╩ ╩╩ ╩╩ ╩ ╩   ╚═╝╚═╝═╩╝    ║
    ╚══════════════════════════════════════╝\x1b[0m

\x1b[32m  ⚡ Global payment infrastructure ⚡\x1b[0m
\x1b[90m  (Built with ♥ on the Great Lakes · Secured for the world)\x1b[0m

\x1b[33m  ┌─────────────────────────────────────────────┐
  │  Version: 1.0.0                              │
  │  Status: \x1b[32m● OPERATIONAL\x1b[33m                           │
  │  Security: \x1b[36mBANK GRADE\x1b[33m                            │
  │  Origin: \x1b[36mGreat Lakes, USA\x1b[33m                       │
  │  Destination: \x1b[32mEverywhere 🌎\x1b[33m                      │
  └─────────────────────────────────────────────┘\x1b[0m

\x1b[34m  🚀 Endpoints:
     ├─ /api/auth/register
     ├─ /api/auth/login  
     ├─ /api/auth/verify
     ├─ /api/restaurants/:id
     ├─ /api/tables/:id/qrcode
     ├─ /api/orders
     ├─ /api/demo/schedule
     └─ /health\x1b[0m

\x1b[35m  💡 Started in Milwaukee · Now securing payments worldwide\x1b[0m
\x1b[90m     (Your data is safer than a vault in a bank vault)\x1b[0m

\x1b[37m  🔗 https://driftpos.com\x1b[0m
  `;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.send(ascii);
});

// ==================== TEST ENDPOINT ====================
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is operational', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Stripe routes
app.use('/api', stripeRouter);

// ==================== AUTH MIDDLEWARE ====================
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ==================== AUTH ENDPOINTS ====================

/**
 * Register a new user and restaurant
 * POST /api/auth/register
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, restaurantName } = req.body;
    
    console.log('📝 Registration attempt:', { 
      email, 
      name, 
      restaurantName
    });

    // Validation
    if (!email || !password || !name || !restaurantName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and restaurant with DEFAULT 1 table
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name, passwordHash: hashedPassword }
      });

      // Create restaurant with 1 default table
      const restaurant = await tx.restaurant.create({
        data: {
          name: restaurantName,
          email,
          supabaseUserId: user.id,
          tables: {
            create: [
              { number: 1 } // Just one table by default
            ]
          }
        },
        include: { tables: true }
      });

      return { user, restaurant };
    });

    const token = jwt.sign(
      { userId: result.user.id, email: result.user.email, restaurantId: result.restaurant.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Registration successful:', { 
      restaurantId: result.restaurant.id,
      tablesCreated: result.restaurant.tables.length // Should be 1
    });

    res.status(201).json({
      success: true,
      token,
      restaurantId: result.restaurant.id,
      tableCount: result.restaurant.tables.length,
      user: { id: result.user.id, email: result.user.email, name: result.user.name }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * Login endpoint
 * POST /api/auth/login
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: { OR: [{ email: user.email }, { supabaseUserId: user.id }] }
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'No restaurant found for this user' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, restaurantId: restaurant.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    res.json({
      success: true,
      token,
      restaurantId: restaurant.id,
      user: { id: user.id, email: user.email, name: user.name }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * Verify token endpoint
 * GET /api/auth/verify
 */
app.get('/api/auth/verify', authenticateToken, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, phone: true }
    });

    const restaurant = await prisma.restaurant.findFirst({
      where: { OR: [{ email: user?.email }, { supabaseUserId: user?.id }] },
      select: { id: true, name: true }
    });

    res.json({ valid: true, user, restaurant });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * Change password
 * POST /api/auth/change-password
 */
app.post('/api/auth/change-password', authenticateToken, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user || !user.passwordHash) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword }
    });

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== RESTAURANT ENDPOINTS ====================

// Get restaurant by ID
app.get('/api/restaurants/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, name: true, email: true, phone: true, address: true, logo: true, timezone: true }
    });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

// Update restaurant by ID
app.patch('/api/restaurants/:restaurantId', authenticateToken, async (req: any, res) => {
  try {
    const { restaurantId } = req.params;
    if (restaurantId !== req.user.restaurantId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { name, address, phone } = req.body;
    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { name, address, phone },
      select: { id: true, name: true, address: true, phone: true, email: true, logo: true, timezone: true }
    });
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
});

// Get restaurant by table ID
app.get('/api/table/:tableId/restaurant', async (req, res) => {
  try {
    const { tableId } = req.params;
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { restaurant: { include: { tables: true } } }
    });
    if (!table) return res.status(404).json({ error: 'Table not found' });
    res.json(table.restaurant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

// ==================== TABLE ENDPOINTS ====================

// Get all tables for a restaurant
app.get('/api/restaurant/:restaurantId/tables', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tables = await prisma.table.findMany({
      where: { restaurantId },
      orderBy: { number: 'asc' }
    });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Generate QR code for a single table
app.post('/api/tables/:tableId/generate-qr', async (req, res) => {
  try {
    const { tableId } = req.params;
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { restaurant: true }
    });
    if (!table) return res.status(404).json({ error: 'Table not found' });

    const baseUrl = process.env.DINER_URL || 'https://drift-diner.onrender.com';
    const url = `${baseUrl}/table/${tableId}`;
    
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    await prisma.table.update({
      where: { id: tableId },
      data: { qrCode: url }
    });

    res.json({ tableId: table.id, tableNumber: table.number, qrCode: qrDataUrl, url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Generate QR codes for all tables
app.post('/api/restaurants/:restaurantId/tables/generate-qrs', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tables = await prisma.table.findMany({
      where: { restaurantId },
      orderBy: { number: 'asc' }
    });

    if (!tables.length) {
      return res.status(404).json({ error: 'No tables found' });
    }

    const baseUrl = process.env.DINER_URL || 'https://drift-diner.onrender.com';
    const qrCodes = [];

    for (const table of tables) {
      const url = `${baseUrl}/table/${table.id}`;
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });

      await prisma.table.update({
        where: { id: table.id },
        data: { qrCode: url }
      });

      qrCodes.push({ tableId: table.id, tableNumber: table.number, qrCode: qrDataUrl, url });
    }

    res.json({ tables: qrCodes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR codes' });
  }
});

// Get QR code for a table
app.get('/api/table/:tableId/qrcode', async (req, res) => {
  try {
    const { tableId } = req.params;
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { restaurant: true }
    });
    if (!table) return res.status(404).json({ error: 'Table not found' });

    const baseUrl = process.env.DINER_URL || 'https://drift-diner.onrender.com';
    const url = `${baseUrl}/table/${tableId}`;
    
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    res.json({ tableId: table.id, tableNumber: table.number, restaurantName: table.restaurant.name, qrCode: qrDataUrl, url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Download QR code as PNG
app.get('/api/tables/:tableId/qrcode/download', async (req, res) => {
  try {
    const { tableId } = req.params;
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { restaurant: true }
    });
    if (!table) return res.status(404).json({ error: 'Table not found' });

    const baseUrl = process.env.DINER_URL || 'https://drift-diner.onrender.com';
    const url = `${baseUrl}/table/${tableId}`;
    
    const qrBuffer = await QRCode.toBuffer(url, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename=table-${table.number}.png`);
    res.send(qrBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to download QR code' });
  }
});

// ==================== MENU ENDPOINTS ====================

// Get menu for a restaurant
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
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// Create a new menu item
app.post('/api/menu/items', authenticateToken, async (req: any, res) => {
  try {
    const { name, description, price, categoryId, isAvailable } = req.body;
    const restaurantId = req.user.restaurantId;

    if (!name || !price || !categoryId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const category = await prisma.menuCategory.findFirst({
      where: { id: categoryId, restaurantId }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        categoryId,
        restaurantId,
        isAvailable: isAvailable ?? true
      }
    });

    res.status(201).json(menuItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// Update a menu item
app.patch('/api/menu/items/:itemId', authenticateToken, async (req: any, res) => {
  try {
    const { itemId } = req.params;
    const { name, description, price, isAvailable } = req.body;

    const existing = await prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId: req.user.restaurantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const menuItem = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        isAvailable
      }
    });

    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// Delete a menu item
app.delete('/api/menu/items/:itemId', authenticateToken, async (req: any, res) => {
  try {
    const { itemId } = req.params;

    const existing = await prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId: req.user.restaurantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    await prisma.menuItem.delete({ where: { id: itemId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// Create a new category
app.post('/api/menu/categories', authenticateToken, async (req: any, res) => {
  try {
    const { name } = req.body;
    const restaurantId = req.user.restaurantId;

    const lastCategory = await prisma.menuCategory.findFirst({
      where: { restaurantId },
      orderBy: { sortOrder: 'desc' }
    });

    const category = await prisma.menuCategory.create({
      data: {
        name,
        restaurantId,
        sortOrder: (lastCategory?.sortOrder || 0) + 1
      }
    });

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// ==================== ORDER ENDPOINTS ====================

// Get orders for a restaurant
app.get('/api/restaurant/:restaurantId/orders', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const orders = await prisma.order.findMany({
      where: { restaurantId, status: { in: ['PENDING', 'PREPARING', 'READY'] } },
      include: { items: { include: { menuItem: true } }, table: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const formattedOrders = orders.map(order => ({
      id: order.id,
      tableNumber: order.table.number,
      items: order.items.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.price
      })),
      status: order.status.toLowerCase(),
      total: order.total,
      createdAt: order.createdAt
    }));

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order summary/stats for dashboard
app.get('/api/restaurant/:restaurantId/stats', async (req, res) => {
  try {
    const { restaurantId } = req.params;

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

    const summary = {
      total: todayOrders.length,
      pending: activeOrders.find(o => o.status === 'PENDING')?._count || 0,
      preparing: activeOrders.find(o => o.status === 'PREPARING')?._count || 0,
      ready: activeOrders.find(o => o.status === 'READY')?._count || 0,
      revenue: todayOrders.reduce((sum, order) => sum + order.total, 0)
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Create a new order
app.post('/api/orders', async (req, res) => {
  try {
    const { restaurantId, tableId, userId, items, total, tip } = req.body;

    if (!restaurantId || !tableId || !userId || !items || !total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) return res.status(404).json({ error: 'Table not found' });

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, name: 'Guest User' }
    });

    // Verify all menu items exist
    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (!menuItem) {
        return res.status(404).json({ error: `Menu item not found: ${item.menuItemId}` });
      }
    }

    const order = await prisma.order.create({
      data: {
        restaurantId,
        tableId,
        userId: user.id,
        total,
        tipAmount: tip || 0,
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            userId: user.id
          }))
        }
      },
      include: { items: { include: { menuItem: true } }, table: true }
    });

    io.to(`restaurant:${restaurantId}`).emit('order-updated', order);
    res.json(order);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(500).json({ error: 'Database error', code: error.code });
    }
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status
app.patch('/api/order/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: status.toUpperCase() },
      include: { restaurant: true }
    });

    io.to(`restaurant:${order.restaurantId}`).emit('order-updated', order);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// ==================== DEMO SCHEDULING ENDPOINTS ====================

// Submit a new demo request
app.post('/api/demo/schedule', async (req, res) => {
  try {
    const { name, email, phone, restaurant, role, teamSize, date, time, message } = req.body;

    if (!name || !email || !restaurant || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({ error: 'Selected date must be in the future' });
    }

    // Check for duplicate requests
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const existingRequest = await prisma.demoRequest.findFirst({
      where: {
        email: email.toLowerCase(),
        createdAt: { gte: oneDayAgo }
      }
    });

    if (existingRequest) {
      return res.status(429).json({
        error: 'A demo request from this email was already submitted recently.'
      });
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

    // Optional Slack notification
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚀 New Demo Request: ${restaurant}`,
            blocks: [
              {
                type: 'header',
                text: { type: 'plain_text', text: '📅 New Demo Request', emoji: true }
              },
              {
                type: 'section',
                fields: [
                  { type: 'mrkdwn', text: `*Name:*\n${name}` },
                  { type: 'mrkdwn', text: `*Email:*\n${email}` }
                ]
              },
              {
                type: 'section',
                fields: [
                  { type: 'mrkdwn', text: `*Restaurant:*\n${restaurant}` },
                  { type: 'mrkdwn', text: `*Date:*\n${date} at ${time}` }
                ]
              }
            ]
          })
        });
      } catch (slackError) {
        // Non-blocking
      }
    }

    res.status(201).json({
      success: true,
      message: 'Demo scheduled successfully!',
      id: demoRequest.id
    });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(500).json({ error: 'Database error occurred' });
    }
    res.status(500).json({ error: 'Failed to schedule demo' });
  }
});

// Get demo requests (paginated)
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
      prisma.demoRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip
      })
    ]);

    res.json({
      data: requests,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNextPage: pageNumber < Math.ceil(totalCount / pageSize),
        hasPrevPage: pageNumber > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch demo requests' });
  }
});

// Get demo statistics
app.get('/api/demo/stats', authenticateToken, async (req: any, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [total, todayCount, weekCount, monthCount, statusCounts] = await Promise.all([
      prisma.demoRequest.count(),
      prisma.demoRequest.count({ where: { createdAt: { gte: today } } }),
      prisma.demoRequest.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.demoRequest.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.demoRequest.groupBy({
        by: ['status'],
        _count: true
      })
    ]);

    const byStatus = statusCounts.reduce((acc: any, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {});

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
    res.status(500).json({ error: 'Failed to fetch demo statistics' });
  }
});

// ==================== SOCKET.IO ====================
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-table', (tableId) => {
    socket.join(`table:${tableId}`);
  });

  socket.on('join-restaurant', (restaurantId) => {
    socket.join(`restaurant:${restaurantId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.set('io', io);

// ==================== USER ENDPOINTS ====================

// Get user by ID
app.get('/api/users/:userId', authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.params;
    if (userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user by ID
app.patch('/api/users/:userId', authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone } = req.body;

    if (userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (email && email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, email, phone },
      select: { id: true, name: true, email: true, phone: true }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('❌ Unhandled error:', err);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(500).json({ error: message });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3001;
const portNumber = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;

httpServer.listen(portNumber, '0.0.0.0', () => {
  console.log(`\n\x1b[36m🚀 Drift API running on port ${portNumber}\x1b[0m`);
  console.log(`\x1b[32m📊 Health check: http://0.0.0.0:${portNumber}/health\x1b[0m`);
  console.log(`\x1b[33m🔒 Security: BANK GRADE ENABLED\x1b[0m`);
  console.log(`\x1b[35m🌎 Serving the world from the Great Lakes\x1b[0m\n`);
});

// Graceful shutdown with timeout
async function shutdown(signal: string) {
  console.log(`\n📦 Received ${signal}, shutting down gracefully...`);
  
  // Set timeout to force shutdown
  const forceShutdown = setTimeout(() => {
    console.error('❌ Force shutdown due to timeout');
    process.exit(1);
  }, 10000);
  
  try {
    await prisma.$disconnect();
    httpServer.close(() => {
      clearTimeout(forceShutdown);
      console.log('✅ Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));