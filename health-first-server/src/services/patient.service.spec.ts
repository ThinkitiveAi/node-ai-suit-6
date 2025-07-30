import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PatientService } from './patient.service';
import { Patient, Gender } from '../models/patient.model';
import { VerificationToken, VerificationType } from '../models/verification-token.model';
import { RegisterPatientDto, VerificationDto } from '../dtos/patient.dto';

describe('PatientService', () => {
  let service: PatientService;
  let mockPatientModel: any;
  let mockVerificationTokenModel: any;

  const mockPatient = {
    _id: '507f1f77bcf86cd799439011',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@email.com',
    phone_number: '+1234567890',
    password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKqKq',
    date_of_birth: new Date('1990-05-15'),
    gender: Gender.FEMALE,
    address: {
      street: '456 Main Street',
      city: 'Boston',
      state: 'MA',
      zip: '02101'
    },
    emergency_contact: {
      name: 'John Smith',
      phone: '+1234567891',
      relationship: 'spouse'
    },
    medical_history: ['Diabetes'],
    insurance_info: {
      provider: 'Blue Cross',
      policy_number: 'encrypted-policy-number'
    },
    email_verified: false,
    phone_verified: false,
    is_active: true,
    marketing_opt_in: false,
    data_retention_consent: true,
    hipaa_consent: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockVerificationToken = {
    _id: '507f1f77bcf86cd799439012',
    patient_id: mockPatient._id,
    token: 'verification-token-here',
    type: VerificationType.EMAIL,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    usage_count: 0,
    max_usage: 1,
    is_used: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    mockPatientModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn(),
      save: jest.fn()
    };

    mockVerificationTokenModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientService,
        {
          provide: getModelToken(Patient.name),
          useValue: mockPatientModel,
        },
        {
          provide: getModelToken(VerificationToken.name),
          useValue: mockVerificationTokenModel,
        },
      ],
    }).compile();

    service = module.get<PatientService>(PatientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerPatient', () => {
    const validRegisterDto: RegisterPatientDto = {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@email.com',
      phone_number: '+1234567890',
      password: 'SecurePassword123!',
      confirm_password: 'SecurePassword123!',
      date_of_birth: '1990-05-15',
      gender: Gender.FEMALE,
      address: {
        street: '456 Main Street',
        city: 'Boston',
        state: 'MA',
        zip: '02101'
      },
      emergency_contact: {
        name: 'John Smith',
        phone: '+1234567891',
        relationship: 'spouse'
      },
      insurance_info: {
        provider: 'Blue Cross',
        policy_number: 'BC123456789'
      },
      marketing_opt_in: false,
      data_retention_consent: true,
      hipaa_consent: true
    };

    it('should register patient successfully', async () => {
      mockPatientModel.findOne.mockResolvedValue(null);
      mockPatientModel.create.mockReturnValue(mockPatient);
      mockPatientModel.save.mockResolvedValue(mockPatient);
      mockVerificationTokenModel.create.mockResolvedValue(mockVerificationToken);

      const result = await service.registerPatient(validRegisterDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Patient registered successfully. Verification email sent.');
      expect(result.data.patient_id).toBe(mockPatient._id);
      expect(result.data.email).toBe(mockPatient.email);
    });

    it('should throw error when password confirmation does not match', async () => {
      const invalidDto = { ...validRegisterDto, confirm_password: 'DifferentPassword123!' };

      await expect(service.registerPatient(invalidDto)).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Password confirmation does not match',
          errors: {
            confirm_password: ['Password confirmation does not match']
          }
        }, HttpStatus.BAD_REQUEST)
      );
    });

    it('should throw error when date of birth is invalid', async () => {
      const invalidDto = { ...validRegisterDto, date_of_birth: '2025-05-15' };

      await expect(service.registerPatient(invalidDto)).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Date of birth validation failed',
          errors: {
            date_of_birth: ['Date of birth must be in the past']
          }
        }, HttpStatus.BAD_REQUEST)
      );
    });

    it('should throw error when email already exists', async () => {
      mockPatientModel.findOne.mockResolvedValue(mockPatient);

      await expect(service.registerPatient(validRegisterDto)).rejects.toThrow(
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
      mockPatientModel.findOne
        .mockResolvedValueOnce(null) // First call for email check
        .mockResolvedValueOnce(mockPatient); // Second call for phone check

      await expect(service.registerPatient(validRegisterDto)).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Phone number already registered',
          errors: {
            phone_number: ['Phone number is already registered']
          }
        }, HttpStatus.CONFLICT)
      );
    });
  });

  describe('verifyEmail', () => {
    const validVerificationDto: VerificationDto = {
      token: 'valid-email-token'
    };

    it('should verify email successfully', async () => {
      mockVerificationTokenModel.findOne.mockResolvedValue(mockVerificationToken);
      mockPatientModel.updateOne.mockResolvedValue({ modifiedCount: 1 });
      mockVerificationTokenModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await service.verifyEmail(validVerificationDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email verified successfully');
      expect(result.type).toBe('email');
    });

    it('should throw error when token is invalid', async () => {
      mockVerificationTokenModel.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail(validVerificationDto)).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Invalid or expired verification token',
          error_code: 'INVALID_TOKEN'
        }, HttpStatus.BAD_REQUEST)
      );
    });
  });

  describe('verifyPhone', () => {
    const validVerificationDto: VerificationDto = {
      token: '123456'
    };

    it('should verify phone successfully', async () => {
      const phoneToken = { ...mockVerificationToken, type: VerificationType.PHONE };
      mockVerificationTokenModel.findOne.mockResolvedValue(phoneToken);
      mockPatientModel.updateOne.mockResolvedValue({ modifiedCount: 1 });
      mockVerificationTokenModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await service.verifyPhone(validVerificationDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Phone number verified successfully');
      expect(result.type).toBe('phone');
    });

    it('should throw error when OTP is invalid', async () => {
      mockVerificationTokenModel.findOne.mockResolvedValue(null);

      await expect(service.verifyPhone(validVerificationDto)).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Invalid or expired verification token',
          error_code: 'INVALID_TOKEN'
        }, HttpStatus.BAD_REQUEST)
      );
    });
  });

  describe('getPatientById', () => {
    it('should get patient successfully with masked data', async () => {
      mockPatientModel.findById.mockResolvedValue(mockPatient);

      const result = await service.getPatientById('507f1f77bcf86cd799439011');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should throw error when patient not found', async () => {
      mockPatientModel.findById.mockResolvedValue(null);

      await expect(service.getPatientById('invalid-id')).rejects.toThrow(
        new HttpException({
          success: false,
          message: 'Patient not found',
          error_code: 'PATIENT_NOT_FOUND'
        }, HttpStatus.NOT_FOUND)
      );
    });
  });
}); 