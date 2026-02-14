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

// Setup Socket.io with CORS for production
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://drift-diner.onrender.com',
      'https://drift-restaurant.onrender.com',
      'https://drift-landing.onrender.com',
    ],
    credentials: true
  }
});

// Middleware
// Use helmet without CSP for now to avoid blocking issues
app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://drift-diner.onrender.com',
    'https://drift-restaurant.onrender.com',
    'https://drift-landing.onrender.com',
  ],
  credentials: true
}));

app.use(express.json());
app.use(morgan('dev'));

// ==================== ROOT ENDPOINT ====================
app.get('/', (req, res) => {
  res.json({
    name: 'Drift API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
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
      debug: {
        setupMenu: 'POST /api/debug/setup-menu',
        testRestaurant: 'POST /test/restaurant',
        testOrder: 'POST /api/test/create-order'
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

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  console.log('Server shutting down')
  process.exit(0)
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Drift API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🍕 Test endpoint: POST http://localhost:${PORT}/test/restaurant`);
  console.log(`🔍 Table lookup: GET http://localhost:${PORT}/api/table/[tableId]/restaurant`);
  console.log(`📋 Tables: GET http://localhost:${PORT}/api/restaurant/[restaurantId]/tables`);
  console.log(`📦 Orders: GET http://localhost:${PORT}/api/restaurant/[restaurantId]/orders`);
  console.log(`📊 Stats: GET http://localhost:${PORT}/api/restaurant/[restaurantId]/stats`);
  console.log(`🔄 Update order: PATCH http://localhost:${PORT}/api/order/[orderId]/status`);
  console.log(`📝 Create order: POST http://localhost:${PORT}/api/orders`);
  console.log(`🎯 Setup menu: POST http://localhost:${PORT}/api/debug/setup-menu`);
  console.log(`📋 Get menu: GET http://localhost:${PORT}/api/restaurant/[restaurantId]/menu`);
  console.log(`🏪 Create restaurant: POST http://localhost:${PORT}/api/restaurants`);
  console.log(`🔍 Get restaurant: GET http://localhost:${PORT}/api/restaurants/[restaurantId]`);
});