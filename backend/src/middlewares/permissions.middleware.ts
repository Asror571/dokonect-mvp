import { Request, Response, NextFunction } from 'express';
import { SubRolePermissions } from '../types/distributor.types';

export const checkPermission = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Super admin and admin have all permissions
    if (user.role === 'ADMIN') {
      return next();
    }

    // For distributors, check sub-role
    if (user.role === 'DISTRIBUTOR') {
      // Super admin has all permissions
      const decoded = (req as any).user;
      
      // Get full user data from token
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization?.replace('Bearer ', '');
      const fullUser = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      
      if (fullUser.subRole === 'SUPER_ADMIN') {
        return next();
      }

      // Check permissions
      const permissions = fullUser.permissions as SubRolePermissions;
      
      if (!permissions || !permissions[resource as keyof SubRolePermissions]) {
        return res.status(403).json({ error: 'Ruxsat yo\'q' });
      }

      const resourcePerms = permissions[resource as keyof SubRolePermissions] as any;
      if (!resourcePerms[action]) {
        return res.status(403).json({ error: 'Ruxsat yo\'q' });
      }
    }

    next();
  };
};
