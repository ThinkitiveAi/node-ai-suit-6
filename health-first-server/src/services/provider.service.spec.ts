import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { Provider, VerificationStatus } from '../models/provider.model';
import { RegisterProviderDto } from '../dtos/provider.dto';

describe('ProviderService', () => {
  let service: ProviderService;
  let mockProviderModel: any;

  const mockProvider = {
    _id: '507f1f77bcf86cd799439011',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@clinic.com',
    phone_number: '+1234567890',
    password_hash: 'hashedPassword',
    specialization: 'Cardiology',
    license_number: 'MD123456789',
    years_of_experience: 10,
    clinic_address: {
      street: '123 Medical Center Dr',
      city: 'New York',
      state: 'NY',
      zip: '10001'
    },
    verification_status: VerificationStatus.PENDING,
    is_active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const mockSave = jest.fn().mockResolvedValue(mockProvider);
    
    mockProviderModel = jest.fn().mockImplementation(() => ({
      ...mockProvider,
      save: mockSave
    }));

    // Add static methods
    mockProviderModel.findOne = jest.fn();
    mockProviderModel.findById = jest.fn();
    mockProviderModel.findByIdAndUpdate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderService,
        {
          provide: getModelToken(Provider.name),
          useValue: mockProviderModel,
        },
      ],
    }).compile();

    service = module.get<ProviderService>(ProviderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerProvider', () => {
    const validRegisterDto: RegisterProviderDto = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@clinic.com',
      phone_number: '+1234567890',
      password: 'SecurePassword123!',
      confirm_password: 'SecurePassword123!',
      specialization: 'Cardiology',
      license_number: 'MD123456789',
      years_of_experience: 10,
      clinic_address: {
        street: '123 Medical Center Dr',
        city: 'New York',
        state: 'NY',
        zip: '10001'
      }
    };

    it('should register a new provider successfully', async () => {
      // Mock no existing providers
      mockProviderModel.findOne.mockResolvedValue(null);

      const result = await service.registerProvider(validRegisterDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Provider registered successfully. Verification email sent.');
      expect(result.data.provider_id).toBe(mockProvider._id);
      expect(result.data.email).toBe(mockProvider.email);
      expect(result.data.verification_status).toBe(VerificationStatus.PENDING);
    });

    it('should throw error when passwords do not match', async () => {
      const invalidDto = {
        ...validRegisterDto,
        confirm_password: 'DifferentPassword123!'
      };

      await expect(service.registerProvider(invalidDto)).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Password confirmation does not match',
          errors: {
            confirm_password: ['Password confirmation does not match']
          }
        }, HttpStatus.BAD_REQUEST)
      );
    });

    it('should throw error when email already exists', async () => {
      mockProviderModel.findOne.mockResolvedValue(mockProvider);

      await expect(service.registerProvider(validRegisterDto)).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Email already registered',
          errors: {
            email: ['Email address is already registered']
          }
        }, HttpStatus.CONFLICT)
      );
    });

    it('should throw error when phone number already exists', async () => {
      // First call returns null (email check passes)
      // Second call returns existing provider (phone check fails)
      mockProviderModel.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockProvider);

      await expect(service.registerProvider(validRegisterDto)).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Phone number already registered',
          errors: {
            phone_number: ['Phone number is already registered']
          }
        }, HttpStatus.CONFLICT)
      );
    });

    it('should throw error when license number already exists', async () => {
      // First two calls return null (email and phone checks pass)
      // Third call returns existing provider (license check fails)
      mockProviderModel.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockProvider);

      await expect(service.registerProvider(validRegisterDto)).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'License number already registered',
          errors: {
            license_number: ['License number is already registered']
          }
        }, HttpStatus.CONFLICT)
      );
    });
  });

  describe('getProviderById', () => {
    it('should return provider by ID', async () => {
      mockProviderModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockProvider)
      });

      const result = await service.getProviderById('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockProvider);
    });
  });

  describe('getProviderByEmail', () => {
    it('should return provider by email', async () => {
      mockProviderModel.findOne.mockResolvedValue(mockProvider);

      const result = await service.getProviderByEmail('john.doe@clinic.com');

      expect(result).toEqual(mockProvider);
    });
  });
}); 