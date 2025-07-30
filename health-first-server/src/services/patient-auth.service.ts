import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Patient, PatientDocument } from "../models/patient.model";
import {
  PatientSession,
  PatientSessionDocument,
} from "../models/patient-session.model";
import {
  SecurityLog,
  SecurityLogDocument,
  SecurityEventType,
  SecurityLevel,
} from "../models/security-log.model";
import {
  LoginPatientDto,
  RefreshTokenDto,
  LogoutDto,
  LogoutAllDto,
} from "../dtos/patient-auth.dto";
import { PatientJwtUtils } from "../utils/patient-jwt.utils";
import { PasswordUtils } from "../utils/password.utils";
import { EncryptionUtils } from "../utils/encryption.utils";

@Injectable()
export class PatientAuthService {
  private readonly logger = new Logger(PatientAuthService.name);
  private readonly MAX_FAILED_ATTEMPTS = 3;
  private readonly LOCKOUT_DURATION = 60 * 60 * 1000; // 1 hour
  private readonly MAX_SESSIONS = 3;

  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(PatientSession.name)
    private patientSessionModel: Model<PatientSessionDocument>,
    @InjectModel(SecurityLog.name)
    private securityLogModel: Model<SecurityLogDocument>,
    private patientJwtUtils: PatientJwtUtils
  ) {}

  /**
   * Authenticate patient login
   * @param loginDto - Login data
   * @param ipAddress - IP address
   * @param userAgent - User agent
   * @returns Authentication result
   */
  async loginPatient(
    loginDto: LoginPatientDto,
    ipAddress: string,
    userAgent: string
  ): Promise<any> {
    try {
      console.log("Login attempt started");

      const { identifier, password, remember_me, device_info } = loginDto;

      console.log(
        `Login attempt for identifier: ${identifier} from IP: ${ipAddress}`
      );

      // Find patient by email or phone
      const patient = await this.patientModel.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { phone_number: identifier },
        ],
      });

      console.log("Patient lookup completed");

      if (!patient) {
        console.log(`No patient found for identifier: ${identifier}`);
        throw new HttpException(
          {
            success: false,
            message: "Invalid credentials",
            error_code: "INVALID_CREDENTIALS",
          },
          HttpStatus.UNAUTHORIZED
        );
      }

      console.log(`Patient found: ${patient.email}`);

      // Verify password
      const isPasswordValid = await PasswordUtils.comparePassword(
        password,
        patient.password_hash
      );

      console.log("Password verification completed");

      if (!isPasswordValid) {
        console.log("Password is invalid");
        throw new HttpException(
          {
            success: false,
            message: "Invalid credentials",
            error_code: "INVALID_CREDENTIALS",
          },
          HttpStatus.UNAUTHORIZED
        );
      }

      console.log("Login successful, returning response");

      // Simple response without complex session/token logic
      return {
        success: true,
        message: "Login successful (simplified)",
        data: {
          access_token: "test-access-token",
          refresh_token: "test-refresh-token",
          expires_in: 1800,
          token_type: "Bearer",
          patient: {
            id: patient._id.toString(),
            first_name: patient.first_name,
            last_name: patient.last_name,
            email: patient.email,
            phone_number: patient.phone_number,
            date_of_birth: patient.date_of_birth.toISOString().split("T")[0],
            email_verified: patient.email_verified,
            phone_verified: patient.phone_verified,
            is_active: patient.is_active,
            last_login: new Date().toISOString(),
          },
        },
      };
    } catch (error) {
      this.logger.error(`Patient login error: ${error.message}`, error.stack);
      console.error("Detailed error:", error);

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
   * Refresh access token
   * @param refreshTokenDto - Refresh token data
   * @param ipAddress - IP address
   * @param userAgent - User agent
   * @returns New tokens
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
    ipAddress: string,
    userAgent: string
  ): Promise<any> {
    try {
      const { refresh_token } = refreshTokenDto;

      // Verify refresh token
      const payload = this.patientJwtUtils.verifyRefreshToken(refresh_token);

      // Find session
      const session = await this.patientSessionModel.findOne({
        _id: payload.session_id,
        is_revoked: false,
        expires_at: { $gt: new Date() },
      });

      if (!session) {
        throw new HttpException(
          {
            success: false,
            message: "Invalid refresh token",
            error_code: "INVALID_REFRESH_TOKEN",
          },
          HttpStatus.UNAUTHORIZED
        );
      }

      // Verify token hash
      const tokenHash = this.patientJwtUtils.hashToken(refresh_token);
      if (session.refresh_token_hash !== tokenHash) {
        throw new HttpException(
          {
            success: false,
            message: "Invalid refresh token",
            error_code: "INVALID_REFRESH_TOKEN",
          },
          HttpStatus.UNAUTHORIZED
        );
      }

      // Find patient
      const patient = await this.patientModel.findById(payload.sub);
      if (!patient || !patient.is_active) {
        throw new HttpException(
          {
            success: false,
            message: "Patient not found or inactive",
            error_code: "PATIENT_NOT_FOUND",
          },
          HttpStatus.UNAUTHORIZED
        );
      }

      // Generate new tokens
      const newAccessToken = this.patientJwtUtils.generateAccessToken(
        patient,
        session._id.toString(),
        payload.device_fingerprint
      );

      const newRefreshToken = this.patientJwtUtils.generateRefreshToken(
        patient._id.toString(),
        session._id.toString(),
        payload.device_fingerprint
      );

      // Update session
      await this.patientSessionModel.updateOne(
        { _id: session._id },
        {
          refresh_token_hash: this.patientJwtUtils.hashToken(newRefreshToken),
          last_used_at: new Date(),
        }
      );

      // Log refresh token usage
      await this.logSecurityEvent(
        patient._id.toString(),
        SecurityEventType.REFRESH_TOKEN_USED,
        SecurityLevel.LOW,
        ipAddress,
        userAgent,
        { session_id: session._id }
      );

      return {
        success: true,
        message: "Token refreshed successfully",
        data: {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          expires_in: 30 * 60, // 30 minutes
          token_type: "Bearer",
        },
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
   * Logout patient
   * @param logoutDto - Logout data
   * @param ipAddress - IP address
   * @param userAgent - User agent
   * @returns Logout result
   */
  async logoutPatient(
    logoutDto: LogoutDto,
    ipAddress: string,
    userAgent: string
  ): Promise<any> {
    try {
      const { refresh_token } = logoutDto;

      // Verify refresh token
      const payload = this.patientJwtUtils.verifyRefreshToken(refresh_token);

      // Revoke session
      await this.patientSessionModel.updateOne(
        { _id: payload.session_id },
        { is_revoked: true }
      );

      // Log logout
      await this.logSecurityEvent(
        payload.sub,
        SecurityEventType.LOGOUT,
        SecurityLevel.LOW,
        ipAddress,
        userAgent,
        { session_id: payload.session_id }
      );

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
   * Logout from all devices
   * @param logoutAllDto - Logout all data
   * @param patientId - Patient ID
   * @param ipAddress - IP address
   * @param userAgent - User agent
   * @returns Logout result
   */
  async logoutAllDevices(
    logoutAllDto: LogoutAllDto,
    patientId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<any> {
    try {
      const { password } = logoutAllDto;

      // Find patient
      const patient = await this.patientModel.findById(patientId);
      if (!patient) {
        throw new HttpException(
          {
            success: false,
            message: "Patient not found",
            error_code: "PATIENT_NOT_FOUND",
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Verify password
      const isPasswordValid = await PasswordUtils.comparePassword(
        password,
        patient.password_hash
      );
      if (!isPasswordValid) {
        throw new HttpException(
          {
            success: false,
            message: "Invalid password",
            error_code: "INVALID_PASSWORD",
          },
          HttpStatus.UNAUTHORIZED
        );
      }

      // Revoke all sessions
      await this.patientSessionModel.updateMany(
        { patient_id: patientId, is_revoked: false },
        { is_revoked: true }
      );

      // Log logout all
      await this.logSecurityEvent(
        patientId,
        SecurityEventType.LOGOUT,
        SecurityLevel.MEDIUM,
        ipAddress,
        userAgent,
        { action: "logout_all" }
      );

      return {
        success: true,
        message: "Logged out from all devices successfully",
      };
    } catch (error) {
      this.logger.error(`Logout all error: ${error.message}`, error.stack);

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
   * Get active sessions for patient
   * @param patientId - Patient ID
   * @param currentSessionId - Current session ID
   * @returns Active sessions
   */
  async getActiveSessions(
    patientId: string,
    currentSessionId?: string
  ): Promise<any> {
    try {
      const sessions = await this.patientSessionModel
        .find({
          patient_id: patientId,
          is_revoked: false,
          expires_at: { $gt: new Date() },
        })
        .sort({ last_used_at: -1 });

      const sessionDtos = sessions.map((session) => ({
        id: session._id.toString(),
        device_info: session.device_info,
        ip_address: session.ip_address,
        last_used_at: session.last_used_at.toISOString(),
        created_at: session.createdAt.toISOString(),
        is_current: session._id.toString() === currentSessionId,
      }));

      return {
        success: true,
        message: "Active sessions retrieved successfully",
        data: {
          sessions: sessionDtos,
          total_sessions: sessionDtos.length,
        },
      };
    } catch (error) {
      this.logger.error(`Get sessions error: ${error.message}`, error.stack);

      throw new HttpException(
        {
          success: false,
          message: "Internal server error",
          error_code: "INTERNAL_SERVER_ERROR",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Revoke specific session
   * @param sessionId - Session ID
   * @param patientId - Patient ID
   * @param ipAddress - IP address
   * @param userAgent - User agent
   * @returns Revoke result
   */
  async revokeSession(
    sessionId: string,
    patientId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<any> {
    try {
      const session = await this.patientSessionModel.findOne({
        _id: sessionId,
        patient_id: patientId,
        is_revoked: false,
      });

      if (!session) {
        throw new HttpException(
          {
            success: false,
            message: "Session not found",
            error_code: "SESSION_NOT_FOUND",
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Revoke session
      await this.patientSessionModel.updateOne(
        { _id: sessionId },
        { is_revoked: true }
      );

      // Log session revocation
      await this.logSecurityEvent(
        patientId,
        SecurityEventType.SESSION_REVOKED,
        SecurityLevel.MEDIUM,
        ipAddress,
        userAgent,
        { session_id: sessionId }
      );

      return {
        success: true,
        message: "Session revoked successfully",
      };
    } catch (error) {
      this.logger.error(`Revoke session error: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: "Internal server error",
          error_code: "INTERNAL_SERVER_ERROR",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Handle failed login attempt
   * @param patient - Patient data
   * @param ipAddress - IP address
   * @param userAgent - User agent
   */
  private async handleFailedLogin(
    patient: any,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const failedAttempts = patient.failed_login_attempts + 1;
    const now = new Date();

    let lockedUntil = null;
    if (failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      lockedUntil = new Date(now.getTime() + this.LOCKOUT_DURATION);
    }

    await this.patientModel.updateOne(
      { _id: patient._id },
      {
        failed_login_attempts: failedAttempts,
        last_failed_attempt: now,
        locked_until: lockedUntil,
      }
    );

    await this.logSecurityEvent(
      patient._id.toString(),
      SecurityEventType.LOGIN_FAILED,
      SecurityLevel.HIGH,
      ipAddress,
      userAgent,
      {
        failed_attempts: failedAttempts,
        locked_until: lockedUntil,
      }
    );
  }

  /**
   * Create new session
   * @param patientId - Patient ID
   * @param deviceInfo - Device information
   * @param ipAddress - IP address
   * @param userAgent - User agent
   * @param rememberMe - Remember me option
   * @returns Created session
   */
  private async createSession(
    patientId: string,
    deviceInfo: any,
    ipAddress: string,
    userAgent: string,
    rememberMe: boolean = false
  ): Promise<PatientSessionDocument> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));

    return this.patientSessionModel.create({
      patient_id: patientId,
      device_info: deviceInfo,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt,
      is_revoked: false,
      last_used_at: new Date(),
    });
  }

  /**
   * Log security event
   * @param patientId - Patient ID
   * @param eventType - Event type
   * @param securityLevel - Security level
   * @param ipAddress - IP address
   * @param userAgent - User agent
   * @param eventDetails - Event details
   */
  private async logSecurityEvent(
    patientId: string | null,
    eventType: SecurityEventType,
    securityLevel: SecurityLevel,
    ipAddress: string,
    userAgent: string,
    eventDetails?: any
  ): Promise<void> {
    try {
      await this.securityLogModel.create({
        patient_id: patientId,
        event_type: eventType,
        security_level: securityLevel,
        ip_address: ipAddress,
        user_agent: userAgent,
        event_details: eventDetails,
        risk_score: this.calculateRiskScore(eventType, securityLevel),
        is_suspicious: this.isSuspiciousActivity(eventType, securityLevel),
      });
    } catch (error) {
      this.logger.error(`Failed to log security event: ${error.message}`);
    }
  }

  /**
   * Calculate risk score
   * @param eventType - Event type
   * @param securityLevel - Security level
   * @returns Risk score
   */
  private calculateRiskScore(
    eventType: SecurityEventType,
    securityLevel: SecurityLevel
  ): number {
    let baseScore = 0;

    switch (securityLevel) {
      case SecurityLevel.LOW:
        baseScore = 10;
        break;
      case SecurityLevel.MEDIUM:
        baseScore = 50;
        break;
      case SecurityLevel.HIGH:
        baseScore = 80;
        break;
      case SecurityLevel.CRITICAL:
        baseScore = 100;
        break;
    }

    switch (eventType) {
      case SecurityEventType.LOGIN_FAILED:
        baseScore += 20;
        break;
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
        baseScore += 30;
        break;
      case SecurityEventType.ACCOUNT_LOCKED:
        baseScore += 40;
        break;
    }

    return Math.min(baseScore, 100);
  }

  /**
   * Check if activity is suspicious
   * @param eventType - Event type
   * @param securityLevel - Security level
   * @returns True if suspicious
   */
  private isSuspiciousActivity(
    eventType: SecurityEventType,
    securityLevel: SecurityLevel
  ): boolean {
    return (
      securityLevel === SecurityLevel.HIGH ||
      securityLevel === SecurityLevel.CRITICAL ||
      eventType === SecurityEventType.SUSPICIOUS_ACTIVITY ||
      eventType === SecurityEventType.ACCOUNT_LOCKED
    );
  }

  /**
   * Get test patients for debugging
   * @returns List of patients
   */
  async getTestPatients(): Promise<any> {
    try {
      const patients = await this.patientModel
        .find({})
        .select(
          "email phone_number email_verified is_active first_name last_name"
        )
        .limit(10);

      return patients.map((patient) => ({
        id: patient._id.toString(),
        email: patient.email,
        phone_number: patient.phone_number,
        first_name: patient.first_name,
        last_name: patient.last_name,
        email_verified: patient.email_verified,
        is_active: patient.is_active,
      }));
    } catch (error) {
      this.logger.error(`Error getting test patients: ${error.message}`);
      throw error;
    }
  }

  /**
   * Simple test method for debugging
   * @returns Test response
   */
  async testMethod(): Promise<any> {
    try {
      return {
        success: true,
        message: "Test method working",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Test method error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify email for testing purposes
   * @param patientId - Patient ID
   * @returns Verification result
   */
  async verifyEmailForTesting(patientId: string): Promise<any> {
    try {
      const patient = await this.patientModel.findById(patientId);

      if (!patient) {
        throw new Error("Patient not found");
      }

      await this.patientModel.updateOne(
        { _id: patientId },
        { email_verified: true }
      );

      this.logger.log(`Email verified for testing: ${patient.email}`);

      return {
        patient_id: patientId,
        email: patient.email,
        email_verified: true,
      };
    } catch (error) {
      this.logger.error(`Error verifying email for testing: ${error.message}`);
      throw error;
    }
  }
}
