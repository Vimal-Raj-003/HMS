import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './error.middleware';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        hospitalId: string;
      };
    }
  }
}

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  hospitalId: string;
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token required', 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      hospitalId: decoded.hospitalId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized('Invalid or expired token', 'INVALID_TOKEN'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Access denied', 'ACCESS_DENIED'));
    }

    next();
  };
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        hospitalId: decoded.hospitalId,
      };
    }

    next();
  } catch {
    // Continue without authentication
    next();
  }
};
