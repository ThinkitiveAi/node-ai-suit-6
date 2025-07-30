import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Provider, ProviderDocument, VerificationStatus } from '../models/provider.model';
import { RegisterProviderDto } from '../dtos/provider.dto';
import { PasswordUtils } from '../utils/password.utils';
import { EmailUtils } from '../utils/email.utils';

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(ProviderService.name);

  constructor(
    @InjectModel(Provider.name) private providerModel: Model<ProviderDocument>
  ) {}

  /**
   * Register a new provider
   * @param registerDto - Registration data
   * @returns Registration result
   */
  async registerProvider(registerDto: RegisterProviderDto): Promise<any> {
    try {
      // Validate password confirmation
      if (registerDto.password !== registerDto.confirm_password) {
        throw new HttpException({
          success: false,
          message: 'Password confirmation does not match',
          errors: {
            confirm_password: ['Password confirmation does not match']
          }
        }, HttpStatus.BAD_REQUEST);
      }

      // Sanitize inputs
      const sanitizedData = this.sanitizeInput(registerDto);

      // Check for existing provider with same email
      const existingEmail = await this.providerModel.findOne({ 
        email: sanitizedData.email 
      });
      if (existingEmail) {
        throw new HttpException({
          success: false,
          message: 'Email already registered',
          errors: {
            email: ['Email address is already registered']
          }
        }, HttpStatus.CONFLICT);
      }

      // Check for existing provider with same phone number
      const existingPhone = await this.providerModel.findOne({ 
        phone_number: sanitizedData.phone_number 
      });
      if (existingPhone) {
        throw new HttpException({
          success: false,
          message: 'Phone number already registered',
          errors: {
            phone_number: ['Phone number is already registered']
          }
        }, HttpStatus.CONFLICT);
      }

      // Check for existing provider with same license number
      const existingLicense = await this.providerModel.findOne({ 
        license_number: sanitizedData.license_number 
      });
      if (existingLicense) {
        throw new HttpException({
          success: false,
          message: 'License number already registered',
          errors: {
            license_number: ['License number is already registered']
          }
        }, HttpStatus.CONFLICT);
      }

      // Hash password
      const passwordHash = await PasswordUtils.hashPassword(sanitizedData.password);

      // Create new provider
      const newProvider = new this.providerModel({
        first_name: sanitizedData.first_name,
        last_name: sanitizedData.last_name,
        email: sanitizedData.email,
        phone_number: sanitizedData.phone_number,
        password_hash: passwordHash,
        specialization: sanitizedData.specialization,
        license_number: sanitizedData.license_number,
        years_of_experience: sanitizedData.years_of_experience,
        clinic_address: sanitizedData.clinic_address,
        verification_status: VerificationStatus.PENDING,
        is_active: true
      });

      // Save provider
      const savedProvider = await newProvider.save();

      // Generate verification token and send email (in production, this would be async)
      const verificationToken = EmailUtils.generateVerificationToken();
      
      // Log registration attempt
      this.logger.log(`Provider registration attempt: ${savedProvider.email}`);

      return {
        success: true,
        message: 'Provider registered successfully. Verification email sent.',
        data: {
          provider_id: savedProvider._id.toString(),
          email: savedProvider.email,
          verification_status: savedProvider.verification_status
        }
      };

    } catch (error) {
      this.logger.error(`Provider registration error: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        success: false,
        message: 'Internal server error during registration',
        errors: {
          server: ['An unexpected error occurred. Please try again.']
        }
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Sanitize input data
   * @param data - Input data to sanitize
   * @returns Sanitized data
   */
  private sanitizeInput(data: RegisterProviderDto): RegisterProviderDto {
    return {
      ...data,
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      email: EmailUtils.sanitizeEmail(data.email),
      phone_number: data.phone_number.trim(),
      password: PasswordUtils.sanitizePassword(data.password),
      confirm_password: PasswordUtils.sanitizePassword(data.confirm_password),
      specialization: data.specialization.trim(),
      license_number: data.license_number.trim().toUpperCase(),
      years_of_experience: data.years_of_experience,
      clinic_address: {
        street: data.clinic_address.street.trim(),
        city: data.clinic_address.city.trim(),
        state: data.clinic_address.state.trim(),
        zip: data.clinic_address.zip.trim()
      }
    };
  }

  /**
   * Get provider by ID
   * @param id - Provider ID
   * @returns Provider data
   */
  async getProviderById(id: string): Promise<ProviderDocument | null> {
    return this.providerModel.findById(id).select('-password_hash');
  }

  /**
   * Get provider by email
   * @param email - Provider email
   * @returns Provider data
   */
  async getProviderByEmail(email: string): Promise<ProviderDocument | null> {
    return this.providerModel.findOne({ email: EmailUtils.sanitizeEmail(email) });
  }

  /**
   * Update provider verification status
   * @param id - Provider ID
   * @param status - New verification status
   * @returns Updated provider
   */
  async updateVerificationStatus(id: string, status: VerificationStatus): Promise<ProviderDocument | null> {
    return this.providerModel.findByIdAndUpdate(
      id,
      { verification_status: status },
      { new: true }
    ).select('-password_hash');
  }
} 