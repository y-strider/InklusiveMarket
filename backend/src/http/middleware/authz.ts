import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

export function allowRoles(roles: ('buyer' | 'seller' | 'admin')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req.user as any)?.role as 'buyer' | 'seller' | 'admin' | undefined;
    if (!role || !roles.includes(role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}

export function canAccessOrder(req: Request, res: Response, next: NextFunction) {
  const role = (req.user as any)?.role as 'buyer' | 'seller' | 'admin' | undefined;
  const userId = (req.user as any)?.id as string | undefined;
  if (role === 'admin') return next();
  const buyerId = req.params.buyerId || req.query.buyerId;
  const sellerId = req.params.sellerId || req.query.sellerId;
  if (role === 'buyer' && userId && (buyerId === userId)) return next();
  if (role === 'seller' && userId && (sellerId === userId)) return next();
  next();
}
