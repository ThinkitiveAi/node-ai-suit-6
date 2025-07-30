import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  Provider,
  ProviderDocument,
  VerificationStatus,
} from "../models/provider.model";
import {
  RefreshToken,
  RefreshTokenDocument,
} from "../models/refresh-token.model";
import { LoginDto, RefreshTokenDto, LogoutDto } from "../dtos/auth.dto";
import { JWTUtils, JWTPayload, TokenPair } from "../utils/jwt.utils";
import { PasswordUtils } from "../utils/password.utils";
import { EmailUtils } from "../utils/email.utils";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(Provider.name) private providerModel: Model<ProviderDocument>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>
  ) {}

  /**
   * Authenticate provider login
   * @param loginDto - Login credentials
   * @returns Authentication result with tokens
   */
  async login(loginDto: LoginDto): Promise<any> {
    try {
      const { identifier, password, remember_me = false } = loginDto;

      // Find provider by email or phone number
      const provider = await this.providerModel.findOne({
        $or: [
          { email: EmailUtils.sanitizeEmail(identifier) },
          { phone_number: identifier.trim() },
        ],
      });

      if (!provider) {
        await this.logFailedLoginAttempt(identifier);
        throw new HttpException(
          {
            success: false,
            message: "Invalid credentials",
            error_code: "INVALID_CREDENTIALS",
          },
          HttpStatus.UNAUTHORIZED
        );
      }

      // Check if account is locked
      if (provider.locked_until && provider.locked_until > new Date()) {
        throw new HttpException(
          {
            success: false,
            message:
              "Account is temporarily locked due to multiple failed attempts",
            error_code: "ACCOUNT_LOCKED",
          },
          HttpStatus.FORBIDDEN
        );
      }

      // Check if account is active and verified
      if (!provider.is_active) {
        throw new HttpException(
          {
            success: false,
            message: "Account is deactivated",
            error_code: "ACCOUNT_DEACTIVATED",
          },
          HttpStatus.FORBIDDEN
        );
      }

      // Commented out verification check for development/testing
      // if (provider.verification_status !== VerificationStatus.VERIFIED) {
      //   throw new HttpException({
      //     success: false,
      //     message: 'Account is not verified',
      //     error_code: 'ACCOUNT_NOT_VERIFIED'
      //   }, HttpStatus.FORBIDDEN);
      // }

      // Verify password
      const isPasswordValid = await PasswordUtils.comparePassword(
        password,
        provider.password_hash
      );

      if (!isPasswordValid) {
        await this.handleFailedLogin(provider);
        throw new HttpException(
          {
            success: false,
            message: "Invalid credentials",
            error_code: "INVALID_CREDENTIALS",
          },
          HttpStatus.UNAUTHORIZED
        );
      }

      // Reset failed login attempts on successful login
      await this.resetFailedLoginAttempts(provider._id.toString());

      // Generate tokens
      const tokenPayload: Omit<JWTPayload, "type"> = {
        provider_id: provider._id.toString(),
        email: provider.email,
        role: "provider",
        specialization: provider.specialization,
        verification_status: provider.verification_status,
      };

      const tokenPair = JWTUtils.generateTokenPair(tokenPayload, remember_me);

      // Store refresh token
      await this.storeRefreshToken(
        provider._id.toString(),
        tokenPair.refresh_token,
        remember_me
      );

      // Update last login and login count
      await this.updateLoginStats(provider._id.toString());

      // Log successful login
      this.logger.log(`Successful login: ${provider.email}`);

      return {
        success: true,
        message: "Login successful",
        data: {
          ...tokenPair,
          provider: {
            id: provider._id.toString(),
            first_name: provider.first_name,
            last_name: provider.last_name,
            email: provider.email,
            specialization: provider.specialization,
            verification_status: provider.verification_status,
            is_active: provider.is_active,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: "Internal server error during login",
          error_code: "INTERNAL_SERVER_ERROR",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Refresh access token using refresh token
   * @param refreshTokenDto - Refresh token data
   * @returns New token pair
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<any> {
    try {
      const { refresh_token } = refreshTokenDto;

      // Verify refresh token
      const decoded = JWTUtils.verifyRefreshToken(refresh_token);
      if (!decoded) {
        throw new HttpException(
          {
            success: false,
            message: "Invalid refresh token",
            error_code: "INVALID_REFRESH_TOKEN",
          },
          HttpStatus.UNAUTHORIZED
        );
      }

      // Check if refresh token exists in database
      const tokenHash = JWTUtils.hashRefreshToken(refresh_token);
      const storedToken = await this.refreshTokenModel.findOne({
        provider_id: decoded.provider_id,
        token_hash: tokenHash,
        is_revoked: false,
        expires_at: { $gt: new Date() },
      });

      if (!storedToken) {
        throw new HttpException(
          {
            success: false,
            message: "Refresh token not found or expired",
            error_code: "REFRESH_TOKEN_NOT_FOUND",
          },
          HttpStatus.UNAUTHORIZED
        );
      }

      // Get provider information
      const provider = await this.providerModel.findById(decoded.provider_id);
      if (!provider || !provider.is_active) {
        throw new HttpException(
          {
            success: false,
            message: "Provider not found or inactive",
            error_code: "PROVIDER_NOT_FOUND",
          },
          HttpStatus.UNAUTHORIZED
        );
      }

      // Generate new token pair
      const tokenPayload: Omit<JWTPayload, "type"> = {
        provider_id: provider._id.toString(),
        email: provider.email,
        role: "provider",
        specialization: provider.specialization,
        verification_status: provider.verification_status,
      };

      const newTokenPair = JWTUtils.generateTokenPair(tokenPayload, false);

      // Revoke old refresh token and store new one
      await this.refreshTokenModel.updateOne(
        { _id: storedToken._id },
        { is_revoked: true }
      );

      await this.storeRefreshToken(
        provider._id.toString(),
        newTokenPair.refresh_token,
        false
      );

      return {
        success: true,
        message: "Token refreshed successfully",
        data: newTokenPair,
      };
    } catch (error) {
      this.logger.error(`Token refresh error: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: "Internal server error during token refresh",
          error_code: "INTERNAL_SERVER_ERROR",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Logout provider by revoking refresh token
   * @param logoutDto - Logout data
   * @returns Logout result
   */
  async logout(logoutDto: LogoutDto): Promise<any> {
    try {
      const { refresh_token } = logoutDto;

      // Verify refresh token
      const decoded = JWTUtils.verifyRefreshToken(refresh_token);
      if (!decoded) {
        throw new HttpException(
          {
            success: false,
            message: "Invalid refresh token",
            error_code: "INVALID_REFRESH_TOKEN",
          },
          HttpStatus.UNAUTHORIZED
        );
      }

      // Revoke refresh token
      const tokenHash = JWTUtils.hashRefreshToken(refresh_token);
      await this.refreshTokenModel.updateOne(
        {
          provider_id: decoded.provider_id,
          token_hash: tokenHash,
          is_revoked: false,
        },
        { is_revoked: true }
      );

      this.logger.log(`Logout successful: ${decoded.email}`);

      return {
        success: true,
        message: "Logout successful",
      };
    } catch (error) {
      this.logger.error(`Logout error: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: "Internal server error during logout",
          error_code: "INTERNAL_SERVER_ERROR",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Logout from all sessions
   * @param providerId - Provider ID
   * @returns Logout result
   */
  async logoutAll(providerId: string): Promise<any> {
    try {
      // Revoke all refresh tokens for the provider
      await this.refreshTokenModel.updateMany(
        { provider_id: providerId, is_revoked: false },
        { is_revoked: true }
      );

      this.logger.log(`Logout all sessions: ${providerId}`);

      return {
        success: true,
        message: "Logged out from all sessions",
      };
    } catch (error) {
      this.logger.error(`Logout all error: ${error.message}`, error.stack);

      throw new HttpException(
        {
          success: false,
          message: "Internal server error during logout",
          error_code: "INTERNAL_SERVER_ERROR",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Handle failed login attempt
   * @param provider - Provider document
   */
  private async handleFailedLogin(provider: ProviderDocument): Promise<void> {
    const failedAttempts = (provider.failed_login_attempts || 0) + 1;

    if (failedAttempts >= 5) {
      // Lock account for 30 minutes
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + 30);

      await this.providerModel.updateOne(
        { _id: provider._id },
        {
          failed_login_attempts: failedAttempts,
          locked_until: lockedUntil,
        }
      );
    } else {
      await this.providerModel.updateOne(
        { _id: provider._id },
        { failed_login_attempts: failedAttempts }
      );
    }
  }

  /**
   * Reset failed login attempts
   * @param providerId - Provider ID
   */
  private async resetFailedLoginAttempts(providerId: string): Promise<void> {
    await this.providerModel.updateOne(
      { _id: providerId },
      {
        failed_login_attempts: 0,
        locked_until: null,
      }
    );
  }

  /**
   * Log failed login attempt for unknown users
   * @param identifier - Login identifier
   */
  private async logFailedLoginAttempt(identifier: string): Promise<void> {
    this.logger.warn(`Failed login attempt for unknown user: ${identifier}`);
  }

  /**
   * Store refresh token in database
   * @param providerId - Provider ID
   * @param refreshToken - Refresh token
   * @param rememberMe - Remember me flag
   */
  private async storeRefreshToken(
    providerId: string,
    refreshToken: string,
    rememberMe: boolean
  ): Promise<void> {
    const tokenHash = JWTUtils.hashRefreshToken(refreshToken);
    const expiresAt = JWTUtils.calculateExpiryDate(rememberMe);

    await this.refreshTokenModel.create({
      provider_id: providerId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      is_revoked: false,
    });
  }

  /**
   * Update login statistics
   * @param providerId - Provider ID
   */
  private async updateLoginStats(providerId: string): Promise<void> {
    await this.providerModel.updateOne(
      { _id: providerId },
      {
        last_login: new Date(),
        $inc: { login_count: 1 },
      }
    );
  }
}
