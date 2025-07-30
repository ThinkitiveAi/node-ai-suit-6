import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface PatientJwtPayload {
  sub: string; // patient_id
  email: string;
  role: string;
  email_verified: boolean;
  phone_verified: boolean;
  session_id?: string;
  device_fingerprint?: string;
  iat?: number;
  exp?: number;
}

export interface PatientRefreshTokenPayload {
  sub: string; // patient_id
  session_id: string;
  token_id: string;
  device_fingerprint?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class PatientJwtUtils {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  /**
   * Generate access token for patient
   * @param patient - Patient data
   * @param sessionId - Session ID
   * @param deviceFingerprint - Device fingerprint
   * @param rememberMe - Remember me option
   * @returns Access token
   */
  generateAccessToken(
    patient: any,
    sessionId?: string,
    deviceFingerprint?: string,
    rememberMe: boolean = false
  ): string {
    const payload: PatientJwtPayload = {
      sub: patient._id.toString(),
      email: patient.email,
      role: 'patient',
      email_verified: patient.email_verified,
      phone_verified: patient.phone_verified,
      session_id: sessionId,
      device_fingerprint: deviceFingerprint
    };

    const expiresIn = rememberMe ? '4h' : '30m';

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn
    });
  }

  /**
   * Generate refresh token for patient
   * @param patientId - Patient ID
   * @param sessionId - Session ID
   * @param deviceFingerprint - Device fingerprint
   * @param rememberMe - Remember me option
   * @returns Refresh token
   */
  generateRefreshToken(
    patientId: string,
    sessionId: string,
    deviceFingerprint?: string,
    rememberMe: boolean = false
  ): string {
    const tokenId = crypto.randomBytes(32).toString('hex');
    
    const payload: PatientRefreshTokenPayload = {
      sub: patientId,
      session_id: sessionId,
      token_id: tokenId,
      device_fingerprint: deviceFingerprint
    };

    const expiresIn = rememberMe ? '30d' : '7d';

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn
    });
  }

  /**
   * Verify access token
   * @param token - Access token
   * @returns Decoded payload
   */
  verifyAccessToken(token: string): PatientJwtPayload {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET')
      });
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * Verify refresh token
   * @param token - Refresh token
   * @returns Decoded payload
   */
  verifyRefreshToken(token: string): PatientRefreshTokenPayload {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET')
      });
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Decode token without verification
   * @param token - JWT token
   * @returns Decoded payload
   */
  decodeToken(token: string): any {
    try {
      return this.jwtService.decode(token);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  /**
   * Get token expiration time
   * @param token - JWT token
   * @returns Expiration timestamp
   */
  getTokenExpiration(token: string): number {
    const decoded = this.decodeToken(token);
    return decoded.exp;
  }

  /**
   * Check if token is expired
   * @param token - JWT token
   * @returns True if expired
   */
  isTokenExpired(token: string): boolean {
    const exp = this.getTokenExpiration(token);
    return Date.now() >= exp * 1000;
  }

  /**
   * Get token time to live
   * @param token - JWT token
   * @returns Time to live in seconds
   */
  getTokenTTL(token: string): number {
    const exp = this.getTokenExpiration(token);
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, exp - now);
  }

  /**
   * Generate token hash for storage
   * @param token - JWT token
   * @returns Hashed token
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Extract patient ID from token
   * @param token - JWT token
   * @returns Patient ID
   */
  extractPatientId(token: string): string {
    const payload = this.verifyAccessToken(token);
    return payload.sub;
  }

  /**
   * Extract session ID from token
   * @param token - JWT token
   * @returns Session ID
   */
  extractSessionId(token: string): string | undefined {
    const payload = this.verifyAccessToken(token);
    return payload.session_id;
  }

  /**
   * Check if token is for patient role
   * @param token - JWT token
   * @returns True if patient token
   */
  isPatientToken(token: string): boolean {
    try {
      const payload = this.verifyAccessToken(token);
      return payload.role === 'patient';
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate device fingerprint
   * @param userAgent - User agent string
   * @param ipAddress - IP address
   * @param deviceInfo - Device information
   * @returns Device fingerprint
   */
  generateDeviceFingerprint(
    userAgent: string,
    ipAddress: string,
    deviceInfo?: any
  ): string {
    const fingerprintData = {
      userAgent,
      ipAddress,
      deviceInfo: deviceInfo || {}
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(fingerprintData))
      .digest('hex');
  }

  /**
   * Validate token format
   * @param token - JWT token
   * @returns True if valid format
   */
  isValidTokenFormat(token: string): boolean {
    const tokenRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    return tokenRegex.test(token);
  }
} 