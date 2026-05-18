import { Pool, type PoolConfig } from 'pg';

/** True when DATABASE_URL points at a Postgres instance on this machine. */
export function databaseHostIsLocal(databaseUrl: string | undefined): boolean {
  if (!databaseUrl) return true;
  try {
    const normalized = databaseUrl.replace(/^postgresql:\/\//i, 'postgres://');
    const u = new URL(normalized);
    const h = u.hostname.toLowerCase();
    return h === 'localhost' || h === '127.0.0.1' || h === '::1';
  } catch {
    return false;
  }
}

/**
 * Hosted Postgres (Render, Supabase, RDS, Neon, …) expects TLS from clients outside the VPC.
 * Relying only on `DATABASE_URL.includes('render.com')` misses other hosts and can yield
 * `Connection terminated unexpectedly` / ECONNRESET when SSL is required but not negotiated.
 */
export function createPoolFromDatabaseUrl(): Pool {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL is required');

  const isLocal = databaseHostIsLocal(raw);
  let connectionString = raw;
  if (!isLocal && !/[?&]sslmode=/i.test(connectionString)) {
    connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=require';
  }

  const config: PoolConfig = {
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: Math.min(Math.max(Number(process.env.PG_POOL_MAX) || 10, 1), 50),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS) || 60_000,
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS) || 30_000,
    keepAlive: true,
  };

  const pool = new Pool(config);

  pool.on('error', (err) => {
    console.error('[pg pool] idle client error:', err?.message || err);
  });

  return pool;
}
