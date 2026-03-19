import { Request, Response, NextFunction } from 'express';

// Extend Request type to include tenantId
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

export const tenantMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip tenant check for health endpoints and static files
  const excludedPaths = ['/health', '/api/health', '/favicon.ico'];
  if (excludedPaths.includes(req.path)) {
    return next();
  }
  
  // Extract tenant ID from various sources
  // 1. From subdomain (e.g., cityhospital.vims.com)
  // 2. From header (X-Tenant-ID)
  // 3. From JWT token (already verified)
  
  const tenantId = 
    req.headers['x-tenant-id'] as string ||
    req.headers['x-hospital-id'] as string ||
    extractTenantFromSubdomain(req);

  // For development, allow requests without tenant
  if (!tenantId && process.env.NODE_ENV === 'development') {
    // Use a default tenant for development
    req.tenantId = 'default-hospital-id';
    return next();
  }

  if (!tenantId) {
    return res.status(400).json({
      success: false,
      message: 'Tenant identification required',
      code: 'TENANT_REQUIRED',
    });
  }

  req.tenantId = tenantId;
  next();
};

function extractTenantFromSubdomain(req: Request): string | null {
  const host = req.get('host');
  if (!host) return null;

  // Extract subdomain from host
  // e.g., cityhospital.vims.com -> cityhospital
  const parts = host.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

// Middleware to add tenant filter to Prisma queries
export const tenantQueryMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  // Store original tenant ID for use in services
  if (req.tenantId) {
    req.headers['x-tenant-id'] = req.tenantId;
  }
  next();
};
