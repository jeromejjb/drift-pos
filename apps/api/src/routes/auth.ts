import { Router, type RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import twilio from 'twilio';
import { withDbRetry } from '../lib/dbRetry';

async function getPrisma() {
  const { prisma } = await import('../index');
  return prisma;
}

export default function createAuthRouter(authenticateToken: RequestHandler): Router {
  const router = Router();
  const JWT_SECRET = process.env.JWT_SECRET!;

  // Supabase Auth Send SMS Hook — receives { user: { phone }, sms: { otp } } and sends via Twilio
  router.post('/auth/send-sms', async (req, res) => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!sid || !token || !from) {
      console.warn('Send SMS hook: Twilio not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)');
      return res.status(503).json({ error: 'SMS provider not configured' });
    }
    const phone = req.body?.user?.phone;
    const otp = req.body?.sms?.otp;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Missing phone or otp' });
    }
    try {
      const client = twilio(sid, token);
      await client.messages.create({
        body: `Your Drift code is ${otp}`,
        from,
        to: phone,
      });
      res.status(200).send();
    } catch (err: any) {
      console.error('Send SMS hook error:', err?.message || err);
      res.status(500).json({ error: err?.message || 'Failed to send SMS' });
    }
  });

  router.post('/auth/register', async (req, res) => {
    try {
      const { email, password, name, restaurantName, tableCount = 1 } = req.body;

      if (!email || !password || !name || !restaurantName) {
        return res.status(400).json({ error: 'Missing required fields', code: 'MISSING_FIELDS' });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format', code: 'INVALID_EMAIL' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters', code: 'WEAK_PASSWORD' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const outcome = await withDbRetry('auth/register', async () => {
        const prisma = await getPrisma();
        if (await prisma.user.findUnique({ where: { email } })) {
          return { kind: 'conflict' as const };
        }
        const result = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({ data: { email, name, passwordHash: hashedPassword } });

          const restaurant = await tx.restaurant.create({
            data: {
              name: restaurantName,
              email,
              supabaseUserId: user.id,
              tables: {
                create: Array.from({ length: tableCount }, (_, i) => ({ number: i + 1 })),
              },
            },
            include: { tables: true },
          });

          return { user, restaurant };
        });
        return { kind: 'ok' as const, result };
      });

      if (outcome.kind === 'conflict') {
        return res.status(409).json({ error: 'User already exists', code: 'USER_EXISTS' });
      }

      const { user, restaurant } = outcome.result;
      const token = jwt.sign(
        { userId: user.id, email: user.email, restaurantId: restaurant.id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        token,
        userId: user.id,
        restaurantId: restaurant.id,
        tableCount: restaurant.tables.length,
        user: { id: user.id, email: user.email, name: user.name },
      });
    } catch (error: any) {
      console.error('Registration error:', error?.message || error);
      const message = error?.message && typeof error.message === 'string' ? error.message : 'Registration failed';
      res.status(500).json({
        error: message.includes('Unique constraint') ? 'An account with this email already exists.' : message,
        code: 'SERVER_ERROR',
      });
    }
  });

  router.post('/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Missing required fields', code: 'MISSING_FIELDS' });
      }

      const payload = await withDbRetry('auth/login', async () => {
        const prisma = await getPrisma();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
          return { kind: 'badcreds' as const };
        }

        const restaurant = await prisma.restaurant.findFirst({
          where: { OR: [{ email: user.email }, { supabaseUserId: user.id }] },
        });

        if (!restaurant) {
          return { kind: 'norest' as const };
        }

        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { kind: 'ok' as const, user, restaurant };
      });

      if (payload.kind === 'badcreds') {
        return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
      }
      if (payload.kind === 'norest') {
        return res.status(404).json({ error: 'No restaurant found', code: 'NO_RESTAURANT' });
      }

      const { user, restaurant } = payload;
      const token = jwt.sign(
        { userId: user.id, email: user.email, restaurantId: restaurant.id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        restaurantId: restaurant.id,
        user: { id: user.id, email: user.email, name: user.name },
      });
    } catch (error) {
      res.status(500).json({ error: 'Login failed', code: 'SERVER_ERROR' });
    }
  });

  router.get('/auth/verify', authenticateToken, async (req: any, res) => {
    try {
      const prisma = await getPrisma();
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { id: true, name: true, email: true, phone: true },
      });
      const restaurant = await prisma.restaurant.findFirst({
        where: { OR: [{ email: user?.email }, { supabaseUserId: user?.id }] },
        select: { id: true, name: true },
      });
      res.json({ valid: true, user, restaurant });
    } catch (error) {
      res.status(500).json({ error: 'Verification failed', code: 'SERVER_ERROR' });
    }
  });

  router.post('/auth/change-password', authenticateToken, async (req: any, res) => {
    try {
      const prisma = await getPrisma();
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Missing required fields', code: 'MISSING_FIELDS' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters', code: 'WEAK_PASSWORD' });
      }

      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (!user || !user.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
        return res.status(401).json({ error: 'Current password incorrect', code: 'INVALID_PASSWORD' });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await bcrypt.hash(newPassword, 10) },
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to change password', code: 'SERVER_ERROR' });
    }
  });

  return router;
}
