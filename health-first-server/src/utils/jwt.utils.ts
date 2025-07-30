import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

export interface JWTPayload {
  provider_id: string;
  email: string;
  role: string;
  specialization: string;
  verification_status: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export class JWTUtils {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'supersecretkey';
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshkey';
  private static readonly ACCESS_TOKEN_EXPIRY = '1h';
  private static readonly ACCESS_TOKEN_EXPIRY_REMEMBER = '24h';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';
  private static readonly REFRESH_TOKEN_EXPIRY_REMEMBER = '30d';

  /**
   * Generate access token
   * @param payload - JWT payload
   * @param rememberMe - Whether to extend token expiry
   * @returns Access token
   */
  static generateAccessToken(payload: Omit<JWTPayload, 'type'>, rememberMe: boolean = false): string {
    const expiry = rememberMe ? this.ACCESS_TOKEN_EXPIRY_REMEMBER : this.ACCESS_TOKEN_EXPIRY;
    
    return jwt.sign(
      { ...payload, type: 'access' },
      this.ACCESS_TOKEN_SECRET,
      { expiresIn: expiry }
    );
  }

  /**
   * Generate refresh token
   * @param payload - JWT payload
   * @param rememberMe - Whether to extend token expiry
   * @returns Refresh token
   */
  static generateRefreshToken(payload: Omit<JWTPayload, 'type'>, rememberMe: boolean = false): string {
    const expiry = rememberMe ? this.REFRESH_TOKEN_EXPIRY_REMEMBER : this.REFRESH_TOKEN_EXPIRY;
    
    return jwt.sign(
      { ...payload, type: 'refresh' },
      this.REFRESH_TOKEN_SECRET,
      { expiresIn: expiry }
    );
  }

  /**
   * Generate token pair
   * @param payload - JWT payload
   * @param rememberMe - Whether to extend token expiry
   * @returns Token pair with expiry information
   */
  static generateTokenPair(payload: Omit<JWTPayload, 'type'>, rememberMe: boolean = false): TokenPair {
    const access_token = this.generateAccessToken(payload, rememberMe);
    const refresh_token = this.generateRefreshToken(payload, rememberMe);
    
    // Calculate expiry in seconds
    const expires_in = rememberMe ? 24 * 60 * 60 : 60 * 60; // 24 hours or 1 hour
    
    return {
      access_token,
      refresh_token,
      expires_in,
      token_type: 'Bearer'
    };
  }

  /**
   * Verify access token
   * @param token - Access token to verify
   * @returns Decoded payload or null
   */
  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET) as JWTPayload;
      return decoded.type === 'access' ? decoded : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token
   * @param token - Refresh token to verify
   * @returns Decoded payload or null
   */
  static verifyRefreshToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET) as JWTPayload;
      return decoded.type === 'refresh' ? decoded : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Hash refresh token for storage
   * @param token - Refresh token to hash
   * @returns Hashed token
   */
  static hashRefreshToken(token: string): string {
    return bcrypt.hashSync(token, 10);
  }

  /**
   * Compare refresh token with hash
   * @param token - Plain refresh token
   * @param hash - Hashed token to compare against
   * @returns True if tokens match
   */
  static compareRefreshToken(token: string, hash: string): boolean {
    return bcrypt.compareSync(token, hash);
  }

  /**
   * Generate unique token ID
   * @returns Unique token ID
   */
  static generateTokenId(): string {
    return uuidv4();
  }

  /**
   * Calculate token expiry date
   * @param rememberMe - Whether to extend token expiry
   * @returns Expiry date
   */
  static calculateExpiryDate(rememberMe: boolean = false): Date {
    const days = rememberMe ? 30 : 7;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    return expiryDate;
  }

  /**
   * Extract token from Authorization header
   * @param authHeader - Authorization header
   * @returns Token or null
   */
  static extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
} 