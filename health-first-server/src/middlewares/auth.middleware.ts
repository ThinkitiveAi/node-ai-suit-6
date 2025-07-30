import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JWTUtils, JWTPayload } from '../utils/jwt.utils';

export interface AuthenticatedRequest extends Request {
  provider?: {
    id: string;
    email: string;
    role: string;
    specialization: string;
    verification_status: string;
  };
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        throw new HttpException({
          success: false,
          message: 'Authorization header is required',
          error_code: 'MISSING_AUTHORIZATION_HEADER'
        }, HttpStatus.UNAUTHORIZED);
      }

      const token = JWTUtils.extractTokenFromHeader(authHeader);
      
      if (!token) {
        throw new HttpException({
          success: false,
          message: 'Invalid authorization header format',
          error_code: 'INVALID_AUTHORIZATION_FORMAT'
        }, HttpStatus.UNAUTHORIZED);
      }

      const decoded = JWTUtils.verifyAccessToken(token);
      
      if (!decoded) {
        throw new HttpException({
          success: false,
          message: 'Invalid or expired token',
          error_code: 'INVALID_TOKEN'
        }, HttpStatus.UNAUTHORIZED);
      }

      // Attach provider information to request
      req.provider = {
        id: decoded.provider_id,
        email: decoded.email,
        role: decoded.role,
        specialization: decoded.specialization,
        verification_status: decoded.verification_status
      };

      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        success: false,
        message: 'Authentication failed',
        error_code: 'AUTHENTICATION_FAILED'
      }, HttpStatus.UNAUTHORIZED);
    }
  }
} 