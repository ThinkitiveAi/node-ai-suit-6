import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

@Injectable()
export class RateLimitingMiddleware implements NestMiddleware {
  private registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 registration attempts per hour
    message: {
      success: false,
      message: 'Too many registration attempts. Please try again in 1 hour.',
      errors: {
        rate_limit: ['Rate limit exceeded. Maximum 5 registration attempts per hour.']
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      throw new HttpException({
        success: false,
        message: 'Too many registration attempts. Please try again in 1 hour.',
        errors: {
          rate_limit: ['Rate limit exceeded. Maximum 5 registration attempts per hour.']
        }
      }, HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  use(req: Request, res: Response, next: NextFunction) {
    // Apply rate limiting only to registration endpoints
    if (req.path.includes('/register')) {
      this.registrationLimiter(req, res, next);
    } else {
      next();
    }
  }
} 