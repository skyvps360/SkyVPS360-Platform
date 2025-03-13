import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to ensure user is authenticated
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

/**
 * Middleware to ensure user has admin privileges
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!req.user || !(req.user as any).isAdmin) {
    return res.status(403).json({ message: 'Admin privileges required' });
  }

  next();
};
