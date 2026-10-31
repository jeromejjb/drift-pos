import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

describe('order pricing and QR auth', () => {
  let app: any;
  let prisma: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const mod = await import('../index');
    app = mod.app;
    prisma = mod.prisma;
  });

  function token(restaurantId: string) {
    return jwt.sign({ userId: 'owner', email: 'o@example.com', restaurantId }, process.env.JWT_SECRET!, {
      algorithm: 'HS256',
    });
  }

  it('recomputes a QR order from the menu and ignores the client total', async () => {
    const restaurant = await prisma.restaurant.create({
      data: { name: 'Priced Kitchen', email: 'priced@example.com', taxRate: 0.1 },
    });
    const user = await prisma.user.create({ data: { email: 'priced-diner@example.com', name: 'Diner' } });
    const table = await prisma.table.create({ data: { restaurantId: restaurant.id, number: 4 } });
    const category = await prisma.menuCategory.create({
      data: { restaurantId: restaurant.id, name: 'Mains', sortOrder: 0 },
    });
    const item = await prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: category.id,
        name: 'Salmon',
        price: 24,
        isAvailable: true,
      },
    });
    try {
      const res = await request(app)
        .post('/api/orders')
        .send({
          restaurantId: restaurant.id,
          tableId: table.id,
          userId: user.id,
          items: [{ menuItemId: item.id, quantity: 1, price: 1 }],
          total: 1,
          tip: 50,
          tipPercent: 20,
        })
        .expect(200);
      expect(res.body.subtotal).toBe(24);
      expect(res.body.taxAmount).toBe(2.4);
      expect(res.body.tipAmount).toBe(4.8);
      expect(res.body.total).toBe(26.4);
      expect(res.body.channel).toBe('QR');
      expect(res.body.items[0].price).toBe(24);
    } finally {
      await prisma.orderItem.deleteMany({ where: { order: { restaurantId: restaurant.id } } });
      await prisma.order.deleteMany({ where: { restaurantId: restaurant.id } });
      await prisma.menuItem.deleteMany({ where: { restaurantId: restaurant.id } });
      await prisma.menuCategory.deleteMany({ where: { restaurantId: restaurant.id } });
      await prisma.table.deleteMany({ where: { restaurantId: restaurant.id } });
      await prisma.restaurant.delete({ where: { id: restaurant.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it('rejects an unavailable item', async () => {
    const restaurant = await prisma.restaurant.create({ data: { name: 'Closed Item', email: 'closed@example.com' } });
    const user = await prisma.user.create({ data: { email: 'closed-diner@example.com' } });
    const table = await prisma.table.create({ data: { restaurantId: restaurant.id, number: 1 } });
    const category = await prisma.menuCategory.create({
      data: { restaurantId: restaurant.id, name: 'Mains', sortOrder: 0 },
    });
    const item = await prisma.menuItem.create({
      data: { restaurantId: restaurant.id, categoryId: category.id, name: 'Soup', price: 8, isAvailable: false },
    });
    try {
      const res = await request(app)
        .post('/api/orders')
        .send({
          restaurantId: restaurant.id,
          tableId: table.id,
          userId: user.id,
          items: [{ menuItemId: item.id, quantity: 1 }],
          tipPercent: 0,
        })
        .expect(400);
      expect(res.body.code).toBe('ITEM_UNAVAILABLE');
    } finally {
      await prisma.menuItem.deleteMany({ where: { restaurantId: restaurant.id } });
      await prisma.menuCategory.deleteMany({ where: { restaurantId: restaurant.id } });
      await prisma.table.deleteMany({ where: { restaurantId: restaurant.id } });
      await prisma.restaurant.delete({ where: { id: restaurant.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it('requires the restaurant owner to generate QR codes', async () => {
    const restaurant = await prisma.restaurant.create({ data: { name: 'QR Kitchen', email: 'qr@example.com' } });
    const other = await prisma.restaurant.create({ data: { name: 'Other', email: 'other-qr@example.com' } });
    try {
      await request(app)
        .post(`/api/restaurants/${restaurant.id}/tables/generate-qrs`)
        .send({ tables: [{ number: 1 }] })
        .expect(401);

      const forbidden = await request(app)
        .post(`/api/restaurants/${restaurant.id}/tables/generate-qrs`)
        .set('Authorization', `Bearer ${token(other.id)}`)
        .send({ tables: [{ number: 1 }] })
        .expect(403);
      expect(forbidden.body.code).toBe('FORBIDDEN');

      const ok = await request(app)
        .post(`/api/restaurants/${restaurant.id}/tables/generate-qrs`)
        .set('Authorization', `Bearer ${token(restaurant.id)}`)
        .send({ tables: [{ number: 1 }] })
        .expect(200);
      expect(ok.body.tables[0].url).toContain('/table/');

      await request(app).get('/api/test-tables').expect(401);
      const listed = await request(app)
        .get('/api/test-tables')
        .set('Authorization', `Bearer ${token(restaurant.id)}`)
        .expect(200);
      expect(listed.body.every((t: { restaurantName: string }) => t.restaurantName === 'QR Kitchen')).toBe(true);
    } finally {
      await prisma.table.deleteMany({ where: { restaurantId: restaurant.id } });
      await prisma.restaurant.delete({ where: { id: restaurant.id } });
      await prisma.restaurant.delete({ where: { id: other.id } });
    }
  });
});
