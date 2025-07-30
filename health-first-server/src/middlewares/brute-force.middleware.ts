import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

@Injectable()
export class BruteForceMiddleware implements NestMiddleware {
  private loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 failed login attempts per 15 minutes
    message: {
      success: false,
      message: 'Too many failed login attempts. Please try again in 15 minutes.',
      error_code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      throw new HttpException({
        success: false,
        message: 'Too many failed login attempts. Please try again in 15 minutes.',
        error_code: 'RATE_LIMIT_EXCEEDED'
      }, HttpStatus.TOO_MANY_REQUESTS);
    },
    skipSuccessfulRequests: true, // Only count failed attempts
    keyGenerator: (req: Request) => {
      // Use IP address for rate limiting
      return req.ip || req.connection.remoteAddress || 'unknown';
    }
  });

  use(req: Request, res: Response, next: NextFunction) {
    // Apply brute force protection only to login endpoints
    if (req.path.includes('/login')) {
      this.loginLimiter(req, res, next);
    } else {
      next();
    }
  }
} 