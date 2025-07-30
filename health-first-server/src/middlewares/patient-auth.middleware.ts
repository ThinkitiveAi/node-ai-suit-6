import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PatientSession, PatientSessionDocument } from '../models/patient-session.model';
import { PatientJwtUtils } from '../utils/patient-jwt.utils';

@Injectable()
export class PatientAuthMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(PatientSession.name) private patientSessionModel: Model<PatientSessionDocument>,
    private patientJwtUtils: PatientJwtUtils
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        throw new HttpException({
          success: false,
          message: 'Access token required',
          error_code: 'TOKEN_REQUIRED'
        }, HttpStatus.UNAUTHORIZED);
      }

      // Verify token format
      if (!this.patientJwtUtils.isValidTokenFormat(token)) {
        throw new HttpException({
          success: false,
          message: 'Invalid token format',
          error_code: 'INVALID_TOKEN_FORMAT'
        }, HttpStatus.UNAUTHORIZED);
      }

      // Verify access token
      const payload = this.patientJwtUtils.verifyAccessToken(token);
      
      // Check if token is for patient role
      if (!this.patientJwtUtils.isPatientToken(token)) {
        throw new HttpException({
          success: false,
          message: 'Invalid token type',
          error_code: 'INVALID_TOKEN_TYPE'
        }, HttpStatus.UNAUTHORIZED);
      }

      // Check if session exists and is valid
      if (payload.session_id) {
        const session = await this.patientSessionModel.findOne({
          _id: payload.session_id,
          is_revoked: false,
          expires_at: { $gt: new Date() }
        });

        if (!session) {
          throw new HttpException({
            success: false,
            message: 'Session expired or revoked',
            error_code: 'SESSION_INVALID'
          }, HttpStatus.UNAUTHORIZED);
        }

        // Update session last used time
        await this.patientSessionModel.updateOne(
          { _id: payload.session_id },
          { last_used_at: new Date() }
        );
      }

      // Attach user data to request
      (req as any).user = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        email_verified: payload.email_verified,
        phone_verified: payload.phone_verified,
        session_id: payload.session_id,
        device_fingerprint: payload.device_fingerprint
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

  /**
   * Extract token from request
   * @param req - Request object
   * @returns Token string
   */
  private extractToken(req: Request): string | null {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check cookie (for web applications)
    const tokenCookie = req.cookies?.access_token;
    if (tokenCookie) {
      return tokenCookie;
    }

    // Check query parameter (for development/testing)
    const queryToken = req.query.token as string;
    if (queryToken) {
      return queryToken;
    }

    return null;
  }
} 