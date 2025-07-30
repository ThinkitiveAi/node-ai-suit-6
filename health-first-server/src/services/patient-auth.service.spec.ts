import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PatientAuthService } from './patient-auth.service';
import { Patient, Gender } from '../models/patient.model';
import { PatientSession } from '../models/patient-session.model';
import { SecurityLog, SecurityEventType, SecurityLevel } from '../models/security-log.model';
import { LoginPatientDto, RefreshTokenDto, LogoutDto, LogoutAllDto } from '../dtos/patient-auth.dto';
import { PatientJwtUtils } from '../utils/patient-jwt.utils';

describe('PatientAuthService', () => {
  let service: PatientAuthService;
  let mockPatientModel: any;
  let mockPatientSessionModel: any;
  let mockSecurityLogModel: any;
  let mockPatientJwtUtils: any;

  const mockPatient = {
    _id: '507f1f77bcf86cd799439011',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@email.com',
    phone_number: '+1234567890',
    password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKqKq',
    date_of_birth: new Date('1990-05-15'),
    gender: Gender.FEMALE,
    email_verified: true,
    phone_verified: true,
    is_active: true,
    login_count: 5,
    failed_login_attempts: 0,
    locked_until: null,
    last_failed_attempt: null,
    suspicious_activity_score: 0,
    last_login: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockSession = {
    _id: '507f1f77bcf86cd799439012',
    patient_id: mockPatient._id,
    refresh_token_hash: 'hashed-refresh-token',
    device_info: {
      device_type: 'mobile',
      device_name: 'iPhone 12'
    },
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    is_revoked: false,
    last_used_at: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    mockPatientModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn()
    };

    mockPatientSessionModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn()
    };

    mockSecurityLogModel = {
      create: jest.fn()
    };

    mockPatientJwtUtils = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      hashToken: jest.fn(),
      generateDeviceFingerprint: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientAuthService,
        {
          provide: getModelToken(Patient.name),
          useValue: mockPatientModel,
        },
        {
          provide: getModelToken(PatientSession.name),
          useValue: mockPatientSessionModel,
        },
        {
          provide: getModelToken(SecurityLog.name),
          useValue: mockSecurityLogModel,
        },
        {
          provide: PatientJwtUtils,
          useValue: mockPatientJwtUtils,
        },
      ],
    }).compile();

    service = module.get<PatientAuthService>(PatientAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('loginPatient', () => {
    const validLoginDto: LoginPatientDto = {
      identifier: 'jane.smith@email.com',
      password: 'SecurePassword123!',
      remember_me: false,
      device_info: {
        device_type: 'mobile',
        device_name: 'iPhone 12'
      }
    };

    it('should login patient successfully', async () => {
      mockPatientModel.findOne.mockResolvedValue(mockPatient);
      mockPatientSessionModel.countDocuments.mockResolvedValue(1);
      mockPatientSessionModel.create.mockResolvedValue(mockSession);
      mockPatientJwtUtils.generateAccessToken.mockReturnValue('access-token');
      mockPatientJwtUtils.generateRefreshToken.mockReturnValue('refresh-token');
      mockPatientJwtUtils.hashToken.mockReturnValue('hashed-token');
      mockPatientJwtUtils.generateDeviceFingerprint.mockReturnValue('device-fingerprint');

      const result = await service.loginPatient(validLoginDto, '192.168.1.1', 'Mozilla/5.0');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Login successful');
      expect(result.data.access_token).toBe('access-token');
      expect(result.data.refresh_token).toBe('refresh-token');
    });

    it('should throw error when patient not found', async () => {
      mockPatientModel.findOne.mockResolvedValue(null);

      await expect(service.loginPatient(validLoginDto, '192.168.1.1', 'Mozilla/5.0')).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Invalid email/phone or password',
          error_code: 'INVALID_CREDENTIALS'
        }, HttpStatus.UNAUTHORIZED)
      );
    });

    it('should throw error when account is locked', async () => {
      const lockedPatient = { ...mockPatient, locked_until: new Date(Date.now() + 3600000) };
      mockPatientModel.findOne.mockResolvedValue(lockedPatient);

      await expect(service.loginPatient(validLoginDto, '192.168.1.1', 'Mozilla/5.0')).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Account temporarily locked due to failed login attempts',
          error_code: 'ACCOUNT_LOCKED',
          locked_until: lockedPatient.locked_until.toISOString()
        }, HttpStatus.FORBIDDEN)
      );
    });

    it('should throw error when account is inactive', async () => {
      const inactivePatient = { ...mockPatient, is_active: false };
      mockPatientModel.findOne.mockResolvedValue(inactivePatient);

      await expect(service.loginPatient(validLoginDto, '192.168.1.1', 'Mozilla/5.0')).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Account is deactivated',
          error_code: 'ACCOUNT_DEACTIVATED'
        }, HttpStatus.FORBIDDEN)
      );
    });

    it('should throw error when email not verified', async () => {
      const unverifiedPatient = { ...mockPatient, email_verified: false };
      mockPatientModel.findOne.mockResolvedValue(unverifiedPatient);

      await expect(service.loginPatient(validLoginDto, '192.168.1.1', 'Mozilla/5.0')).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Please verify your email before logging in',
          error_code: 'EMAIL_NOT_VERIFIED',
          verification_required: true
        }, HttpStatus.FORBIDDEN)
      );
    });
  });

  describe('refreshToken', () => {
    const validRefreshTokenDto: RefreshTokenDto = {
      refresh_token: 'valid-refresh-token'
    };

    it('should refresh token successfully', async () => {
      const payload = {
        sub: mockPatient._id,
        session_id: mockSession._id,
        device_fingerprint: 'device-fingerprint'
      };

      mockPatientJwtUtils.verifyRefreshToken.mockReturnValue(payload);
      mockPatientSessionModel.findOne.mockResolvedValue(mockSession);
      mockPatientModel.findById.mockResolvedValue(mockPatient);
      mockPatientJwtUtils.generateAccessToken.mockReturnValue('new-access-token');
      mockPatientJwtUtils.generateRefreshToken.mockReturnValue('new-refresh-token');
      mockPatientJwtUtils.hashToken.mockReturnValue('new-hashed-token');

      const result = await service.refreshToken(validRefreshTokenDto, '192.168.1.1', 'Mozilla/5.0');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Token refreshed successfully');
      expect(result.data.access_token).toBe('new-access-token');
      expect(result.data.refresh_token).toBe('new-refresh-token');
    });

    it('should throw error when refresh token is invalid', async () => {
      mockPatientJwtUtils.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

      await expect(service.refreshToken(validRefreshTokenDto, '192.168.1.1', 'Mozilla/5.0')).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Internal server error during token refresh',
          error_code: 'INTERNAL_SERVER_ERROR'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
      );
    });
  });

  describe('logoutPatient', () => {
    const validLogoutDto: LogoutDto = {
      refresh_token: 'valid-refresh-token'
    };

    it('should logout patient successfully', async () => {
      const payload = {
        sub: mockPatient._id,
        session_id: mockSession._id
      };

      mockPatientJwtUtils.verifyRefreshToken.mockReturnValue(payload);
      mockPatientSessionModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await service.logoutPatient(validLogoutDto, '192.168.1.1', 'Mozilla/5.0');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Logout successful');
    });
  });

  describe('logoutAllDevices', () => {
    const validLogoutAllDto: LogoutAllDto = {
      password: 'SecurePassword123!'
    };

    it('should logout from all devices successfully', async () => {
      mockPatientModel.findById.mockResolvedValue(mockPatient);
      mockPatientSessionModel.updateMany.mockResolvedValue({ modifiedCount: 3 });

      const result = await service.logoutAllDevices(validLogoutAllDto, mockPatient._id, '192.168.1.1', 'Mozilla/5.0');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Logged out from all devices successfully');
    });

    it('should throw error when patient not found', async () => {
      mockPatientModel.findById.mockResolvedValue(null);

      await expect(service.logoutAllDevices(validLogoutAllDto, 'invalid-id', '192.168.1.1', 'Mozilla/5.0')).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Patient not found',
          error_code: 'PATIENT_NOT_FOUND'
        }, HttpStatus.NOT_FOUND)
      );
    });
  });

  describe('getActiveSessions', () => {
    it('should get active sessions successfully', async () => {
      mockPatientSessionModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockSession])
      });

      const result = await service.getActiveSessions(mockPatient._id, mockSession._id);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Active sessions retrieved successfully');
      expect(result.data.sessions).toHaveLength(1);
      expect(result.data.total_sessions).toBe(1);
    });
  });

  describe('revokeSession', () => {
    it('should revoke session successfully', async () => {
      mockPatientSessionModel.findOne.mockResolvedValue(mockSession);
      mockPatientSessionModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await service.revokeSession(mockSession._id, mockPatient._id, '192.168.1.1', 'Mozilla/5.0');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Session revoked successfully');
    });

    it('should throw error when session not found', async () => {
      mockPatientSessionModel.findOne.mockResolvedValue(null);

      await expect(service.revokeSession('invalid-session', mockPatient._id, '192.168.1.1', 'Mozilla/5.0')).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Session not found',
          error_code: 'SESSION_NOT_FOUND'
        }, HttpStatus.NOT_FOUND)
      );
    });
  });
}); 