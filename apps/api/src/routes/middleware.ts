import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/** JWT auth for restaurant/landing (Bearer token). Use for API routes that require login. */
export function createAuthMiddleware(JWT_SECRET: string) {
  return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });

    jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err: any, user: any) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(403).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
      }
      req.user = user;
      next();
    });
  };
}
