/** Transient TCP / TLS / pool errors worth retrying once or twice. */
export function isTransientDbError(error: unknown): boolean {
  const msg = String((error as { message?: string })?.message ?? error).toLowerCase();
  return (
    msg.includes('connection terminated unexpectedly') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('socket hang up') ||
    msg.includes('socket closed') ||
    msg.includes('server closed the connection') ||
    msg.includes('broken pipe') ||
    msg.includes('connection closed')
  );
}

export async function withDbRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!isTransientDbError(e) || i === attempts - 1) throw e;
      const ms = 400 * (i + 1);
      console.warn(`[db retry] ${label}: ${(e as Error)?.message}; retry ${i + 1}/${attempts - 1} in ${ms}ms`);
      await new Promise((r) => setTimeout(r, ms));
    }
  }
  throw last;
}
