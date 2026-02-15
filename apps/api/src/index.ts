import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Add this near the top after imports
console.log('🚀 Starting Drift API...');
console.log('📊 DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const httpServer = createServer(app);

// Setup PostgreSQL connection pool with adapter for Prisma 7
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// Create the Prisma adapter
const adapter = new PrismaPg(pool);

// Initialize Prisma Client WITH the adapter (required for Prisma 7)
const prisma = new PrismaClient({ adapter });

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-do-not-use-in-production';

// Define allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://drift-diner.onrender.com',
  'https://drift-restaurant.onrender.com',
  'https://drift-landing.onrender.com',
];

// Setup Socket.io with CORS for production
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// ==================== CORS FIXES ====================
// Explicit CORS middleware (this runs before other middleware)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow requests from allowed origins or any localhost
  if (origin && (allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // Set other CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS preflight request from:', origin);
    return res.sendStatus(204);
  }
  
  next();
});

// Use cors package as backup
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      console.log('❌ Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 204
}));

// Other middleware
app.use(express.json());
app.use(morgan('dev'));

// Use helmet without CSP for now to avoid blocking issues
app.use(helmet({
  contentSecurityPolicy: false,
}));

// ==================== TEST ENDPOINT ====================
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    cors: 'enabled',
    headers: {
      origin: req.headers.origin,
      host: req.headers.host
    },
    timestamp: new Date().toISOString() 
  });
});

// ==================== AUTH MIDDLEWARE ====================
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
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
  // Set CORS headers explicitly
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  try {
    const { email, password, name, restaurantName } = req.body;

    console.log('📝 Registration attempt:', { email, name, restaurantName });

    // Validate required fields
    if (!email || !password || !name || !restaurantName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['email', 'password', 'name', 'restaurantName']
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and restaurant in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash: hashedPassword
        }
      });

      // Create restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name: restaurantName,
          email,
          supabaseUserId: user.id,
          tables: {
            create: [
              { number: 1, qrCode: `table_1_${Date.now()}` },
              { number: 2, qrCode: `table_2_${Date.now()}` },
              { number: 3, qrCode: `table_3_${Date.now()}` },
              { number: 4, qrCode: `table_4_${Date.now()}` },
              { number: 5, qrCode: `table_5_${Date.now()}` },
            ]
          }
        },
        include: {
          tables: true
        }
      });

      return { user, restaurant };
    });

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: result.user.id, 
        email: result.user.email,
        restaurantId: result.restaurant.id 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Registration successful:', result.restaurant.id);

    res.status(201).json({
      success: true,
      token,
      restaurantId: result.restaurant.id,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name
      }
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
  // Set CORS headers explicitly
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email });

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['email', 'password']
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Find user's restaurant
    const restaurant = await prisma.restaurant.findFirst({
      where: { 
        OR: [
          { email: user.email },
          { supabaseUserId: user.id }
        ]
      }
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'No restaurant found for this user' });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        restaurantId: restaurant.id 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    console.log('✅ Login successful:', { userId: user.id, restaurantId: restaurant.id });

    res.json({
      success: true,
      token,
      restaurantId: restaurant.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
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
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    const restaurant = await prisma.restaurant.findFirst({
      where: { 
        OR: [
          { email: user?.email },
          { supabaseUserId: user?.id }
        ]
      },
      select: {
        id: true,
        name: true
      }
    });

    res.json({
      valid: true,
      user,
      restaurant
    });

  } catch (error) {
    console.error('❌ Token verification error:', error);
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

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

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

    res.json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    console.error('❌ Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ==================== ROOT ENDPOINT ====================
app.get('/', (req, res) => {
  res.json({
    name: 'Drift API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        verify: 'GET /api/auth/verify',
        changePassword: 'POST /api/auth/change-password'
      },
      test: 'GET /api/test',
      health: 'GET /health',
      restaurants: {
        create: 'POST /api/restaurants',
        get: 'GET /api/restaurants/:restaurantId',
        tables: 'GET /api/restaurant/:restaurantId/tables',
        orders: 'GET /api/restaurant/:restaurantId/orders',
        stats: 'GET /api/restaurant/:restaurantId/stats',
        menu: 'GET /api/restaurant/:restaurantId/menu'
      },
      orders: {
        create: 'POST /api/orders',
        update: 'PATCH /api/order/:orderId/status'
      },
      tables: {
        lookup: 'GET /api/table/:tableId/restaurant',
        qrCode: 'GET /api/table/:tableId/qrcode',
        downloadQR: 'GET /api/table/:tableId/qrcode/download'
      },
      demo: {
        schedule: 'POST /api/demo/schedule',
        requests: 'GET /api/demo/requests',
        stats: 'GET /api/demo/stats'
      }
    }
  });
});

// ==================== HEALTH CHECK ====================
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    })
  } catch (error) {
    const err = error as Error;
    console.error('Database connection error:', err)
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      timestamp: new Date().toISOString() 
    })
  }
});

// ==================== TEST ENDPOINTS ====================
app.post('/test/restaurant', async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Trattoria Bellini',
        address: '123 Main St',
        tables: {
          create: [
            { number: 1, qrCode: `table_1_${Date.now()}` },
            { number: 2, qrCode: `table_2_${Date.now()}` },
            { number: 3, qrCode: `table_3_${Date.now()}` },
          ]
        }
      },
      include: {
        tables: true
      }
    })
    res.json(restaurant)
  } catch (error) {
    const err = error as Error;
    console.error('Error creating restaurant:', err)
    res.status(500).json({ error: 'Failed to create restaurant' })
  }
});

// ==================== RESTAURANT ENDPOINTS ====================

// Create a new restaurant (called from signup)
app.post('/api/restaurants', async (req, res) => {
  try {
    const { name, email, supabaseUserId } = req.body;
    
    console.log('📝 Creating restaurant:', { name, email, supabaseUserId });
    
    if (!name || !email || !supabaseUserId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { name, email, supabaseUserId }
      });
    }
    
    // Check if restaurant already exists
    const existing = await prisma.restaurant.findFirst({
      where: {
        OR: [
          { email: email },
          { supabaseUserId: supabaseUserId }
        ]
      }
    });
    
    if (existing) {
      console.log('⚠️ Restaurant already exists:', existing.id);
      return res.json(existing);
    }
    
    // Create new restaurant with default tables
    const restaurant = await prisma.restaurant.create({
      data: {
        name: name,
        email: email,
        supabaseUserId: supabaseUserId,
        tables: {
          create: [
            { number: 1, qrCode: `table_1_${Date.now()}` },
            { number: 2, qrCode: `table_2_${Date.now()}` },
            { number: 3, qrCode: `table_3_${Date.now()}` },
            { number: 4, qrCode: `table_4_${Date.now()}` },
            { number: 5, qrCode: `table_5_${Date.now()}` },
          ]
        }
      },
      include: {
        tables: true
      }
    });
    
    // Create user record
    try {
      await prisma.user.upsert({
        where: { email: email },
        update: {},
        create: {
          id: supabaseUserId,
          email: email,
          name: name,
          supabaseId: supabaseUserId
        }
      });
    } catch (userError) {
      console.log('⚠️ User creation issue:', userError);
    }
    
    console.log('✅ Restaurant created:', restaurant.id);
    res.status(201).json(restaurant);
    
  } catch (error) {
    console.error('❌ Error creating restaurant:', error);
    res.status(500).json({ 
      error: 'Failed to create restaurant',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get restaurant by ID
app.get('/api/restaurants/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        logo: true,
        timezone: true
      }
    });
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

// Get restaurant by table ID
app.get('/api/table/:tableId/restaurant', async (req, res) => {
  try {
    const { tableId } = req.params;
    console.log('🔍 Looking for table:', tableId);
    
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        restaurant: {
          include: {
            tables: true
          }
        }
      }
    });
    
    if (!table) {
      console.log('❌ Table not found:', tableId);
      return res.status(404).json({ error: 'Table not found' });
    }
    
    console.log('✅ Found table:', table.number, 'at restaurant:', table.restaurant.name);
    res.json(table.restaurant);
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching restaurant:', err);
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
    const err = error as Error;
    console.error('Error fetching tables:', err);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Generate QR code for a table
app.get('/api/table/:tableId/qrcode', async (req, res) => {
  try {
    const { tableId } = req.params;
    
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { restaurant: true }
    });
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    const baseUrl = process.env.DINER_URL || 'https://drift-diner.onrender.com';
    const url = `${baseUrl}/table/${tableId}`;
    
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    res.json({
      tableId: table.id,
      tableNumber: table.number,
      restaurantName: table.restaurant.name,
      qrCode: qrDataUrl,
      url: url
    });
  } catch (error) {
    const err = error as Error;
    console.error('QR generation error:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Download QR code as PNG
app.get('/api/table/:tableId/qrcode/download', async (req, res) => {
  try {
    const { tableId } = req.params;
    
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { restaurant: true }
    });
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    const baseUrl = process.env.DINER_URL || 'https://drift-diner.onrender.com';
    const url = `${baseUrl}/table/${tableId}`;
    
    const qrBuffer = await QRCode.toBuffer(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename=${table.restaurant.name.replace(/\s+/g, '-')}-table-${table.number}.png`);
    res.send(qrBuffer);
  } catch (error) {
    const err = error as Error;
    console.error('QR download error:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// ==================== MENU ENDPOINTS ====================

// Get menu for a restaurant
app.get('/api/restaurant/:restaurantId/menu', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId },
      include: {
        items: {
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });
    
    res.json(categories);
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching menu:', err);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// Debug endpoint to set up menu items
app.post('/api/debug/setup-menu', async (req, res) => {
  try {
    const { restaurantId } = req.body;
    
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    const cat1 = await prisma.menuCategory.upsert({
      where: { id: 'cat1' },
      update: {},
      create: {
        id: 'cat1',
        name: 'Antipasti',
        sortOrder: 0,
        restaurantId
      }
    });
    
    const cat2 = await prisma.menuCategory.upsert({
      where: { id: 'cat2' },
      update: {},
      create: {
        id: 'cat2',
        name: 'Pizza',
        sortOrder: 1,
        restaurantId
      }
    });
    
    const items = await prisma.menuItem.createMany({
      data: [
        { 
          id: 'item1', 
          name: 'Arancini', 
          description: 'Crispy rice balls with mozzarella', 
          price: 12, 
          isShared: true, 
          categoryId: cat1.id, 
          restaurantId 
        },
        { 
          id: 'item2', 
          name: 'Calamari', 
          description: 'Fried squid with marinara', 
          price: 14, 
          isShared: true, 
          categoryId: cat1.id, 
          restaurantId 
        },
        { 
          id: 'item3', 
          name: 'Burrata', 
          description: 'Creamy burrata with heirloom tomatoes', 
          price: 16, 
          isShared: true, 
          categoryId: cat1.id, 
          restaurantId 
        },
        { 
          id: 'item4', 
          name: 'Margherita', 
          description: 'Tomato, mozzarella, basil', 
          price: 18, 
          isShared: true, 
          categoryId: cat2.id, 
          restaurantId 
        },
        { 
          id: 'item5', 
          name: 'Diavola', 
          description: 'Spicy salami, tomato, mozzarella', 
          price: 20, 
          isShared: true, 
          categoryId: cat2.id, 
          restaurantId 
        },
        { 
          id: 'item6', 
          name: 'Quattro Formaggi', 
          description: 'Four cheese blend', 
          price: 22, 
          isShared: true, 
          categoryId: cat2.id, 
          restaurantId 
        }
      ],
      skipDuplicates: true
    });
    
    res.json({ 
      success: true, 
      message: 'Menu setup complete',
      categories: [cat1, cat2],
      itemsCreated: items.count
    });
    
  } catch (error) {
    const err = error as Error;
    console.error('Error setting up menu:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== ORDER ENDPOINTS ====================

// Get orders for a restaurant
app.get('/api/restaurant/:restaurantId/orders', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const orders = await prisma.order.findMany({
      where: { 
        restaurantId,
        status: { in: ['PENDING', 'PREPARING', 'READY'] }
      },
      include: {
        items: {
          include: { menuItem: true }
        },
        table: true
      },
      orderBy: { createdAt: 'desc' }
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
    const err = error as Error;
    console.error('Error fetching orders:', err);
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
      where: {
        restaurantId,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    
    const activeOrders = await prisma.order.groupBy({
      by: ['status'],
      where: {
        restaurantId,
        status: { in: ['PENDING', 'PREPARING', 'READY'] }
      },
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
    const err = error as Error;
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Create a new order (called from diner app)
app.post('/api/orders', async (req, res) => {
  try {
    const { restaurantId, tableId, userId, items, total, tip } = req.body;
    
    console.log('📦 Received order request:', { 
      restaurantId, 
      tableId, 
      userId, 
      items, 
      total, 
      tip 
    });

    if (!restaurantId || !tableId || !userId || !items || !total) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { restaurantId, tableId, userId, items, total, tip }
      });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });
    
    if (!restaurant) {
      console.log('❌ Restaurant not found:', restaurantId);
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const table = await prisma.table.findUnique({
      where: { id: tableId }
    });
    
    if (!table) {
      console.log('❌ Table not found:', tableId);
      return res.status(404).json({ error: 'Table not found' });
    }

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: 'Guest User'
      }
    });

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId }
      });
      if (!menuItem) {
        console.log('❌ Menu item not found:', item.menuItemId);
        return res.status(404).json({ 
          error: `Menu item not found: ${item.menuItemId}` 
        });
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
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        table: true
      }
    });
    
    io.to(`restaurant:${restaurantId}`).emit('order-updated', order);
    
    res.json(order);
  } catch (error) {
    console.error('❌ Error creating order:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(500).json({ 
        error: 'Database error', 
        code: error.code,
        message: error.message
      });
    }
    
    const err = error as Error;
    res.status(500).json({ 
      error: 'Failed to create order', 
      message: err.message
    });
  }
});

// Update order status
app.patch('/api/order/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: status.toUpperCase() },
      include: { restaurant: true }
    });
    
    io.to(`restaurant:${order.restaurantId}`).emit('order-updated', order);
    
    res.json(order);
  } catch (error) {
    const err = error as Error;
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Test endpoint to create an order
app.post('/api/test/create-order', async (req, res) => {
  try {
    const { restaurantId, tableId, userId, items, total } = req.body;
    
    const order = await prisma.order.create({
      data: {
        restaurantId,
        tableId,
        userId,
        total,
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        items: true,
        table: true
      }
    });
    
    io.to(`restaurant:${restaurantId}`).emit('order-updated', order);
    
    res.json(order);
  } catch (error) {
    const err = error as Error;
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ==================== DEMO SCHEDULING ENDPOINTS ====================

/**
 * Submit a new demo request
 * POST /api/demo/schedule
 */
app.post('/api/demo/schedule', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      restaurant, 
      role, 
      teamSize, 
      date, 
      time, 
      message 
    } = req.body;
    
    console.log('📅 New demo request received:', { 
      name, 
      email, 
      restaurant, 
      date, 
      time 
    });

    // Validate required fields
    if (!name || !email || !restaurant || !date || !time) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'email', 'restaurant', 'date', 'time']
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format'
      });
    }

    // Validate date is in the future
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return res.status(400).json({ 
        error: 'Selected date must be in the future'
      });
    }

    // Check for duplicate requests (same email within last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const existingRequest = await prisma.demoRequest.findFirst({
      where: {
        email: email.toLowerCase(),
        createdAt: {
          gte: oneDayAgo
        }
      }
    });

    if (existingRequest) {
      return res.status(429).json({ 
        error: 'A demo request from this email was already submitted recently. We\'ll be in touch soon!'
      });
    }

    // Save to database
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

    console.log('✅ Demo request saved with ID:', demoRequest.id);

    // Send notification to Slack (if configured)
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        const slackMessage = {
          text: `🚀 New Demo Request: ${restaurant}`,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '📅 New Demo Request',
                emoji: true
              }
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
        };

        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage)
        });
      } catch (slackError) {
        // Don't fail the request if Slack notification fails
        console.error('⚠️ Slack notification failed:', slackError);
      }
    }

    res.status(201).json({ 
      success: true, 
      message: 'Demo scheduled successfully! We\'ll contact you within 24 hours.',
      id: demoRequest.id
    });

  } catch (error) {
    console.error('❌ Error scheduling demo:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(500).json({ 
        error: 'Database error occurred',
        code: error.code
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to schedule demo. Please try again later.'
    });
  }
});

/**
 * Get all demo requests (paginated)
 * GET /api/demo/requests
 */
app.get('/api/demo/requests', async (req, res) => {
  try {
    const { status, limit = '50', page = '1' } = req.query;
    
    const pageSize = Math.min(parseInt(limit as string), 100);
    const pageNumber = Math.max(parseInt(page as string), 1);
    const skip = (pageNumber - 1) * pageSize;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const totalCount = await prisma.demoRequest.count({ where });

    const requests = await prisma.demoRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip
    });

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
    console.error('❌ Error fetching demo requests:', error);
    res.status(500).json({ error: 'Failed to fetch demo requests' });
  }
});

/**
 * Get demo request by ID
 * GET /api/demo/requests/:id
 */
app.get('/api/demo/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await prisma.demoRequest.findUnique({
      where: { id }
    });
    
    if (!request) {
      return res.status(404).json({ error: 'Demo request not found' });
    }
    
    res.json(request);

  } catch (error) {
    console.error('❌ Error fetching demo request:', error);
    res.status(500).json({ error: 'Failed to fetch demo request' });
  }
});

/**
 * Update demo request status
 * PATCH /api/demo/requests/:id/status
 */
app.patch('/api/demo/requests/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['PENDING', 'CONTACTED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses
      });
    }
    
    const existing = await prisma.demoRequest.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Demo request not found' });
    }

    const request = await prisma.demoRequest.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Demo request ${id} status updated to: ${status}`);
    res.json(request);

  } catch (error) {
    console.error('❌ Error updating demo request:', error);
    res.status(500).json({ error: 'Failed to update demo request' });
  }
});

/**
 * Get demo request statistics
 * GET /api/demo/stats
 */
app.get('/api/demo/stats', async (req, res) => {
  try {
    const statusCounts = await prisma.demoRequest.groupBy({
      by: ['status'],
      _count: true
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCount = await prisma.demoRequest.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekCount = await prisma.demoRequest.count({
      where: {
        createdAt: {
          gte: weekAgo
        }
      }
    });

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const monthCount = await prisma.demoRequest.count({
      where: {
        createdAt: {
          gte: monthAgo
        }
      }
    });

    const byStatus = statusCounts.reduce((acc: any, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {});

    res.json({
      total: await prisma.demoRequest.count(),
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
    console.error('❌ Error fetching demo stats:', error);
    res.status(500).json({ error: 'Failed to fetch demo statistics' });
  }
});

/**
 * Delete demo request
 * DELETE /api/demo/requests/:id
 */
app.delete('/api/demo/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.demoRequest.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Demo request not found' });
    }

    await prisma.demoRequest.delete({
      where: { id }
    });

    console.log(`✅ Demo request ${id} deleted`);
    res.json({ success: true, message: 'Demo request deleted' });

  } catch (error) {
    console.error('❌ Error deleting demo request:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Demo request not found' });
    }
    
    res.status(500).json({ error: 'Failed to delete demo request' });
  }
});

/**
 * Export demo requests as CSV
 * GET /api/demo/export/csv
 */
app.get('/api/demo/export/csv', async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const requests = await prisma.demoRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const csvRows = [];
    csvRows.push([
      'ID',
      'Name',
      'Email',
      'Phone',
      'Restaurant',
      'Role',
      'Team Size',
      'Preferred Date',
      'Preferred Time',
      'Message',
      'Status',
      'Created At'
    ].join(','));

    for (const req of requests) {
      csvRows.push([
        req.id,
        `"${req.name}"`,
        req.email,
        req.phone || '',
        `"${req.restaurantName}"`,
        req.role || '',
        req.teamSize || '',
        req.preferredDate.toISOString().split('T')[0],
        req.preferredTime,
        `"${(req.message || '').replace(/"/g, '""')}"`,
        req.status,
        req.createdAt.toISOString()
      ].join(','));
    }

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=demo-requests.csv');
    res.send(csv);

  } catch (error) {
    console.error('❌ Error exporting demo requests:', error);
    res.status(500).json({ error: 'Failed to export demo requests' });
  }
});

// ==================== SOCKET.IO ====================
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-table', (tableId) => {
    socket.join(`table:${tableId}`);
    console.log(`Socket ${socket.id} joined table ${tableId}`);
  });
  
  socket.on('join-restaurant', (restaurantId) => {
    socket.join(`restaurant:${restaurantId}`);
    console.log(`Socket ${socket.id} joined restaurant ${restaurantId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// ==================== USER ENDPOINTS ====================

// Get user by ID
app.get('/api/users/:userId', authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own data
    if (userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        stripeCustomerId: true,
        supabaseId: true,
        createdAt: true,
        lastLoginAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userWithSubscription = {
      ...user,
      subscription: {
        plan: 'professional',
        status: 'active',
        features: ['unlimited_orders', 'team_management', 'analytics', 'qr_codes']
      }
    };
    
    res.json(userWithSubscription);
  } catch (error) {
    console.error('Error fetching user:', error);
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

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        phone
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      }
    });
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ==================== RESTAURANT UPDATE ENDPOINT ====================

// Update restaurant by ID
app.patch('/api/restaurants/:restaurantId', authenticateToken, async (req: any, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Ensure user owns this restaurant
    if (restaurantId !== req.user.restaurantId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { name, address, phone } = req.body;
    
    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        name,
        address,
        phone
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        timezone: true
      }
    });
    
    res.json(restaurant);
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
});

// ==================== MENU MANAGEMENT ENDPOINTS ====================

// Create a new menu item
app.post('/api/menu/items', authenticateToken, async (req: any, res) => {
  try {
    const { name, description, price, categoryId, isAvailable } = req.body;
    const restaurantId = req.user.restaurantId;
    
    console.log('📝 Creating menu item:', { name, categoryId, restaurantId });
    
    if (!name || !price || !categoryId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { name, price, categoryId }
      });
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
    
    console.log('✅ Menu item created:', menuItem.id);
    res.status(201).json(menuItem);
    
  } catch (error) {
    console.error('❌ Error creating menu item:', error);
    res.status(500).json({ 
      error: 'Failed to create menu item',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update a menu item
app.patch('/api/menu/items/:itemId', authenticateToken, async (req: any, res) => {
  try {
    const { itemId } = req.params;
    const { name, description, price, isAvailable } = req.body;
    
    // Verify the menu item belongs to user's restaurant
    const existing = await prisma.menuItem.findFirst({
      where: {
        id: itemId,
        restaurantId: req.user.restaurantId
      }
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
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// Delete a menu item
app.delete('/api/menu/items/:itemId', authenticateToken, async (req: any, res) => {
  try {
    const { itemId } = req.params;
    
    // Verify the menu item belongs to user's restaurant
    const existing = await prisma.menuItem.findFirst({
      where: {
        id: itemId,
        restaurantId: req.user.restaurantId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    await prisma.menuItem.delete({
      where: { id: itemId }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// Create a new category
app.post('/api/menu/categories', authenticateToken, async (req: any, res) => {
  try {
    const { name } = req.body;
    const restaurantId = req.user.restaurantId;
    
    const category = await prisma.menuCategory.create({
      data: {
        name,
        restaurantId,
        sortOrder: 0
      }
    });
    
    res.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3001;
const portNumber = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;

// Log startup info
console.log('\n🔧 ==================== CONFIGURATION ====================');
console.log(`📌 PORT: ${portNumber}`);
console.log(`🔌 DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`✅ CORS allowed origins: ${allowedOrigins.length}`);
allowedOrigins.forEach((origin, i) => console.log(`   ${i + 1}. ${origin}`));
console.log('🔧 ======================================================\n');

// Bind to 0.0.0.0 to accept connections from anywhere (required for Render)
httpServer.listen(portNumber, '0.0.0.0', () => {
  console.log('\n✅ ==================== SERVER STARTED ====================');
  console.log(`🚀 Drift API running on port ${portNumber}`);
  console.log(`📊 Health check: http://0.0.0.0:${portNumber}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Accepting connections from ${allowedOrigins.length} configured origins`);
  console.log('✅ ======================================================\n');
}).on('error', (err: Error) => {
  console.error('\n❌ ==================== SERVER FAILED ====================');
  console.error('Failed to start server:', err.message);
  if ('code' in err && err.code === 'EADDRINUSE') {
    console.error(`Port ${portNumber} is already in use`);
  }
  console.error('❌ ======================================================\n');
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n📦 Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\n📦 Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});