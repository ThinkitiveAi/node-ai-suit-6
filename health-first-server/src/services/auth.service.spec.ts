import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Provider, VerificationStatus } from '../models/provider.model';
import { RefreshToken } from '../models/refresh-token.model';
import { LoginDto, RefreshTokenDto, LogoutDto } from '../dtos/auth.dto';
import { JWTUtils } from '../utils/jwt.utils';
import { PasswordUtils } from '../utils/password.utils';

describe('AuthService', () => {
  let service: AuthService;
  let mockProviderModel: any;
  let mockRefreshTokenModel: any;

  const mockProvider = {
    _id: '507f1f77bcf86cd799439011',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@clinic.com',
    phone_number: '+1234567890',
    password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKqKq',
    specialization: 'Cardiology',
    license_number: 'MD123456789',
    years_of_experience: 10,
    clinic_address: {
      street: '123 Medical Center Dr',
      city: 'New York',
      state: 'NY',
      zip: '10001'
    },
    verification_status: VerificationStatus.VERIFIED,
    is_active: true,
    failed_login_attempts: 0,
    locked_until: null,
    login_count: 0,
    last_login: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockRefreshToken = {
    _id: '507f1f77bcf86cd799439012',
    provider_id: mockProvider._id,
    token_hash: 'hashed_refresh_token',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    is_revoked: false,
    last_used_at: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    mockProviderModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn()
    };

    mockRefreshTokenModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn()
    };

    // Mock JWT and Password utilities
    jest.spyOn(PasswordUtils, 'comparePassword').mockResolvedValue(true);
    jest.spyOn(JWTUtils, 'generateTokenPair').mockReturnValue({
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      expires_in: 3600,
      token_type: 'Bearer'
    });
    jest.spyOn(JWTUtils, 'verifyRefreshToken').mockReturnValue({
      provider_id: mockProvider._id,
      email: mockProvider.email,
      role: 'provider',
      specialization: mockProvider.specialization,
      verification_status: mockProvider.verification_status,
      type: 'refresh'
    });
    jest.spyOn(JWTUtils, 'hashRefreshToken').mockReturnValue('hashed_token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(Provider.name),
          useValue: mockProviderModel,
        },
        {
          provide: getModelToken(RefreshToken.name),
          useValue: mockRefreshTokenModel,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const validLoginDto: LoginDto = {
      identifier: 'john.doe@clinic.com',
      password: 'SecurePassword123!',
      remember_me: false
    };

    it('should login successfully with valid credentials', async () => {
      mockProviderModel.findOne.mockResolvedValue(mockProvider);
      mockProviderModel.updateOne.mockResolvedValue({ modifiedCount: 1 });
      mockRefreshTokenModel.create.mockResolvedValue(mockRefreshToken);

      const result = await service.login(validLoginDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Login successful');
      expect(result.data.access_token).toBeDefined();
      expect(result.data.refresh_token).toBeDefined();
      expect(result.data.provider.id).toBe(mockProvider._id);
    });

    it('should throw error when provider not found', async () => {
      mockProviderModel.findOne.mockResolvedValue(null);

      await expect(service.login(validLoginDto)).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Invalid credentials',
          error_code: 'INVALID_CREDENTIALS'
        }, HttpStatus.UNAUTHORIZED)
      );
    });

    it('should throw error when password is invalid', async () => {
      mockProviderModel.findOne.mockResolvedValue(mockProvider);
      jest.spyOn(PasswordUtils, 'comparePassword').mockResolvedValue(false);

      await expect(service.login(validLoginDto)).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Invalid credentials',
          error_code: 'INVALID_CREDENTIALS'
        }, HttpStatus.UNAUTHORIZED)
      );
    });

    it('should throw error when account is locked', async () => {
      const lockedProvider = {
        ...mockProvider,
        locked_until: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
      };
      mockProviderModel.findOne.mockResolvedValue(lockedProvider);

      await expect(service.login(validLoginDto)).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Account is temporarily locked due to multiple failed attempts',
          error_code: 'ACCOUNT_LOCKED'
        }, HttpStatus.FORBIDDEN)
      );
    });

    it('should throw error when account is deactivated', async () => {
      const deactivatedProvider = {
        ...mockProvider,
        is_active: false
      };
      mockProviderModel.findOne.mockResolvedValue(deactivatedProvider);

      await expect(service.login(validLoginDto)).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Account is deactivated',
          error_code: 'ACCOUNT_DEACTIVATED'
        }, HttpStatus.FORBIDDEN)
      );
    });

    it('should throw error when account is not verified', async () => {
      const unverifiedProvider = {
        ...mockProvider,
        verification_status: VerificationStatus.PENDING
      };
      mockProviderModel.findOne.mockResolvedValue(unverifiedProvider);

      await expect(service.login(validLoginDto)).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Account is not verified',
          error_code: 'ACCOUNT_NOT_VERIFIED'
        }, HttpStatus.FORBIDDEN)
      );
    });
  });

  describe('refreshToken', () => {
    const validRefreshTokenDto: RefreshTokenDto = {
      refresh_token: 'valid_refresh_token'
    };

    it('should refresh token successfully', async () => {
      mockProviderModel.findById.mockResolvedValue(mockProvider);
      mockRefreshTokenModel.findOne.mockResolvedValue(mockRefreshToken);
      mockRefreshTokenModel.updateOne.mockResolvedValue({ modifiedCount: 1 });
      mockRefreshTokenModel.create.mockResolvedValue(mockRefreshToken);

      const result = await service.refreshToken(validRefreshTokenDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Token refreshed successfully');
      expect(result.data.access_token).toBeDefined();
      expect(result.data.refresh_token).toBeDefined();
    });

    it('should throw error when refresh token not found in database', async () => {
      mockRefreshTokenModel.findOne.mockResolvedValue(null);

      await expect(service.refreshToken(validRefreshTokenDto)).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Refresh token not found or expired',
          error_code: 'REFRESH_TOKEN_NOT_FOUND'
        }, HttpStatus.UNAUTHORIZED)
      );
    });

    it('should throw error when refresh token is invalid', async () => {
      jest.spyOn(JWTUtils, 'verifyRefreshToken').mockReturnValue(null);

      await expect(service.refreshToken(validRefreshTokenDto)).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Invalid refresh token',
          error_code: 'INVALID_REFRESH_TOKEN'
        }, HttpStatus.UNAUTHORIZED)
      );
    });
  });

  describe('logout', () => {
    const validLogoutDto: LogoutDto = {
      refresh_token: 'valid_refresh_token'
    };

    it('should logout successfully', async () => {
      mockRefreshTokenModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await service.logout(validLogoutDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Logout successful');
    });

    it('should throw error when refresh token is invalid', async () => {
      jest.spyOn(JWTUtils, 'verifyRefreshToken').mockReturnValue(null);

      await expect(service.logout(validLogoutDto)).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Invalid refresh token',
          error_code: 'INVALID_REFRESH_TOKEN'
        }, HttpStatus.UNAUTHORIZED)
      );
    });
  });

  describe('logoutAll', () => {
    it('should logout from all sessions successfully', async () => {
      mockRefreshTokenModel.updateMany.mockResolvedValue({ modifiedCount: 2 });

      const result = await service.logoutAll('507f1f77bcf86cd799439011');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Logged out from all sessions');
    });
  });
}); 