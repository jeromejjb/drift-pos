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

// Middleware
// Use helmet without CSP for now to avoid blocking issues
app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: allowedOrigins,
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



// ==================== DEMO SCHEDULING ENDPOINTS ====================
// Production-ready endpoints for managing demo requests

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
    
    const pageSize = Math.min(parseInt(limit as string), 100); // Max 100 per page
    const pageNumber = Math.max(parseInt(page as string), 1);
    const skip = (pageNumber - 1) * pageSize;

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Get total count
    const totalCount = await prisma.demoRequest.count({ where });

    // Fetch requests
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
    
    // Validate status
    const validStatuses = ['PENDING', 'CONTACTED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses
      });
    }
    
    // Check if request exists
    const existing = await prisma.demoRequest.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Demo request not found' });
    }

    // Update status
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
    // Get counts by status
    const statusCounts = await prisma.demoRequest.groupBy({
      by: ['status'],
      _count: true
    });

    // Get today's requests
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCount = await prisma.demoRequest.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });

    // Get this week's requests
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekCount = await prisma.demoRequest.count({
      where: {
        createdAt: {
          gte: weekAgo
        }
      }
    });

    // Get this month's requests
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const monthCount = await prisma.demoRequest.count({
      where: {
        createdAt: {
          gte: monthAgo
        }
      }
    });

    // Format status counts
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
    
    // Check if request exists
    const existing = await prisma.demoRequest.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Demo request not found' });
    }

    // Delete from database
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
    
    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // Fetch all requests (no pagination for export)
    const requests = await prisma.demoRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Create CSV header
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

    // Add data rows
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

/**
 * Bulk update demo request statuses
 * POST /api/demo/requests/bulk/status
 */
app.post('/api/demo/requests/bulk/status', async (req, res) => {
  try {
    const { ids, status } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid or missing ids array' });
    }

    // Validate status
    const validStatuses = ['PENDING', 'CONTACTED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses
      });
    }

    // Update all matching requests
    const result = await prisma.demoRequest.updateMany({
      where: {
        id: {
          in: ids
        }
      },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Bulk updated ${result.count} demo requests to status: ${status}`);
    res.json({ 
      success: true, 
      count: result.count,
      message: `Updated ${result.count} requests`
    });

  } catch (error) {
    console.error('❌ Error bulk updating demo requests:', error);
    res.status(500).json({ error: 'Failed to bulk update demo requests' });
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

// ==================== USER ENDPOINTS ====================

// Get user by ID
app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
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
    
    // Add subscription info (mock for now)
    const userWithSubscription = {
      ...user,
      subscription: {
        plan: 'free',
        status: 'active',
        features: ['basic_ordering', 'qr_codes']
      }
    };
    
    res.json(userWithSubscription);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user by ID
app.patch('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone } = req.body;
    
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
app.patch('/api/restaurants/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { name, address, phone, cuisine } = req.body;
    
    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        name,
        address,
        phone
        // Note: cuisine might need to be added to your schema if not present
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
app.post('/api/menu/items', async (req, res) => {
  try {
    const { name, description, price, categoryId, restaurantId, isAvailable } = req.body;
    
    console.log('📝 Creating menu item:', { name, categoryId, restaurantId });
    
    if (!name || !price || !categoryId || !restaurantId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { name, price, categoryId, restaurantId }
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
app.patch('/api/menu/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name, description, price, isAvailable } = req.body;
    
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
app.delete('/api/menu/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    
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
app.post('/api/menu/categories', async (req, res) => {
  try {
    const { name, restaurantId } = req.body;
    
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