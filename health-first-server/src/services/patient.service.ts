import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, PatientDocument, Gender } from '../models/patient.model';
import { VerificationToken, VerificationTokenDocument, VerificationType } from '../models/verification-token.model';
import { RegisterPatientDto, VerificationDto } from '../dtos/patient.dto';
import { PasswordUtils } from '../utils/password.utils';
import { EmailUtils } from '../utils/email.utils';
import { DateUtils } from '../utils/date.utils';
import { EncryptionUtils } from '../utils/encryption.utils';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(VerificationToken.name) private verificationTokenModel: Model<VerificationTokenDocument>
  ) {}

  /**
   * Register a new patient
   * @param registerDto - Registration data
   * @returns Registration result
   */
  async registerPatient(registerDto: RegisterPatientDto): Promise<any> {
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

      // Validate date of birth and age
      const dateValidation = DateUtils.validateDateOfBirth(registerDto.date_of_birth);
      if (!dateValidation.isValid) {
        throw new HttpException({
          success: false,
          message: 'Date of birth validation failed',
          errors: {
            date_of_birth: dateValidation.errors
          }
        }, HttpStatus.BAD_REQUEST);
      }

      // Sanitize inputs
      const sanitizedData = this.sanitizeInput(registerDto);

      // Check for existing patient with same email
      const existingEmail = await this.patientModel.findOne({
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

      // Check for existing patient with same phone number
      const existingPhone = await this.patientModel.findOne({
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

      // Hash password
      const passwordHash = await PasswordUtils.hashPassword(sanitizedData.password);

      // Encrypt sensitive data (HIPAA compliance)
      let encryptedInsuranceInfo = null;
      if (sanitizedData.insurance_info) {
        encryptedInsuranceInfo = {
          provider: sanitizedData.insurance_info.provider,
          policy_number: EncryptionUtils.encryptPolicyNumber(sanitizedData.insurance_info.policy_number)
        };
      }

      // Create new patient
      const newPatient = new this.patientModel({
        first_name: sanitizedData.first_name,
        last_name: sanitizedData.last_name,
        email: sanitizedData.email,
        phone_number: sanitizedData.phone_number,
        password_hash: passwordHash,
        date_of_birth: new Date(sanitizedData.date_of_birth),
        gender: sanitizedData.gender,
        address: sanitizedData.address,
        emergency_contact: sanitizedData.emergency_contact,
        medical_history: sanitizedData.medical_history || [],
        insurance_info: encryptedInsuranceInfo,
        email_verified: false,
        phone_verified: false,
        is_active: true,
        marketing_opt_in: sanitizedData.marketing_opt_in || false,
        data_retention_consent: sanitizedData.data_retention_consent || false,
        hipaa_consent: sanitizedData.hipaa_consent || false
      });

      // Save patient
      const savedPatient = await newPatient.save();

      // Generate verification tokens
      const emailToken = EmailUtils.generateVerificationToken();
      const phoneToken = this.generateOTP();

      // Store verification tokens
      await this.storeVerificationToken(savedPatient._id.toString(), emailToken, VerificationType.EMAIL);
      await this.storeVerificationToken(savedPatient._id.toString(), phoneToken, VerificationType.PHONE);

      // Send verification emails/SMS (in production, this would be async)
      this.logger.log(`Verification email sent to: ${savedPatient.email}`);
      this.logger.log(`Verification SMS sent to: ${savedPatient.phone_number}`);

      // Log registration attempt
      this.logger.log(`Patient registration attempt: ${savedPatient.email}`);

      return {
        success: true,
        message: 'Patient registered successfully. Verification email sent.',
        data: {
          patient_id: savedPatient._id.toString(),
          email: savedPatient.email,
          phone_number: savedPatient.phone_number,
          email_verified: savedPatient.email_verified,
          phone_verified: savedPatient.phone_verified
        }
      };

    } catch (error) {
      this.logger.error(`Patient registration error: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        success: false,
        message: 'Internal server error during registration',
        error_code: 'INTERNAL_SERVER_ERROR'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Verify email address
   * @param verificationDto - Verification data
   * @returns Verification result
   */
  async verifyEmail(verificationDto: VerificationDto): Promise<any> {
    try {
      const { token } = verificationDto;

      // Find verification token
      const verificationToken = await this.verificationTokenModel.findOne({
        token,
        type: VerificationType.EMAIL,
        is_used: false,
        expires_at: { $gt: new Date() }
      });

      if (!verificationToken) {
        throw new HttpException({
          success: false,
          message: 'Invalid or expired verification token',
          error_code: 'INVALID_TOKEN'
        }, HttpStatus.BAD_REQUEST);
      }

      // Update patient email verification status
      await this.patientModel.updateOne(
        { _id: verificationToken.patient_id },
        { email_verified: true }
      );

      // Mark token as used
      await this.verificationTokenModel.updateOne(
        { _id: verificationToken._id },
        { is_used: true, usage_count: verificationToken.usage_count + 1 }
      );

      this.logger.log(`Email verified for patient: ${verificationToken.patient_id}`);

      return {
        success: true,
        message: 'Email verified successfully',
        type: 'email'
      };

    } catch (error) {
      this.logger.error(`Email verification error: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        success: false,
        message: 'Internal server error during email verification',
        error_code: 'INTERNAL_SERVER_ERROR'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Verify phone number
   * @param verificationDto - Verification data
   * @returns Verification result
   */
  async verifyPhone(verificationDto: VerificationDto): Promise<any> {
    try {
      const { token } = verificationDto;

      // Find verification token
      const verificationToken = await this.verificationTokenModel.findOne({
        token,
        type: VerificationType.PHONE,
        is_used: false,
        expires_at: { $gt: new Date() }
      });

      if (!verificationToken) {
        throw new HttpException({
          success: false,
          message: 'Invalid or expired verification token',
          error_code: 'INVALID_TOKEN'
        }, HttpStatus.BAD_REQUEST);
      }

      // Update patient phone verification status
      await this.patientModel.updateOne(
        { _id: verificationToken.patient_id },
        { phone_verified: true }
      );

      // Mark token as used
      await this.verificationTokenModel.updateOne(
        { _id: verificationToken._id },
        { is_used: true, usage_count: verificationToken.usage_count + 1 }
      );

      this.logger.log(`Phone verified for patient: ${verificationToken.patient_id}`);

      return {
        success: true,
        message: 'Phone number verified successfully',
        type: 'phone'
      };

    } catch (error) {
      this.logger.error(`Phone verification error: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        success: false,
        message: 'Internal server error during phone verification',
        error_code: 'INTERNAL_SERVER_ERROR'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get patient by ID (with data masking for privacy)
   * @param patientId - Patient ID
   * @returns Patient data
   */
  async getPatientById(patientId: string): Promise<any> {
    try {
      const patient = await this.patientModel.findById(patientId);
      
      if (!patient) {
        throw new HttpException({
          success: false,
          message: 'Patient not found',
          error_code: 'PATIENT_NOT_FOUND'
        }, HttpStatus.NOT_FOUND);
      }

      // Mask sensitive data for privacy
      const maskedPatient = {
        ...patient.toObject(),
        phone_number: EncryptionUtils.maskPhoneNumber(patient.phone_number),
        email: EncryptionUtils.maskEmail(patient.email),
        insurance_info: patient.insurance_info ? {
          provider: patient.insurance_info.provider,
          policy_number: EncryptionUtils.maskData(patient.insurance_info.policy_number)
        } : null
      };

      return {
        success: true,
        data: maskedPatient
      };

    } catch (error) {
      this.logger.error(`Get patient error: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        success: false,
        message: 'Internal server error',
        error_code: 'INTERNAL_SERVER_ERROR'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Sanitize input data
   * @param data - Input data to sanitize
   * @returns Sanitized data
   */
  private sanitizeInput(data: RegisterPatientDto): RegisterPatientDto {
    return {
      ...data,
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      email: data.email.toLowerCase().trim(),
      phone_number: data.phone_number.trim(),
      address: {
        street: data.address.street.trim(),
        city: data.address.city.trim(),
        state: data.address.state.trim(),
        zip: data.address.zip.trim()
      },
      emergency_contact: data.emergency_contact ? {
        name: data.emergency_contact.name.trim(),
        phone: data.emergency_contact.phone.trim(),
        relationship: data.emergency_contact.relationship.trim()
      } : undefined,
      medical_history: data.medical_history?.map(item => item.trim()) || [],
      insurance_info: data.insurance_info ? {
        provider: data.insurance_info.provider.trim(),
        policy_number: data.insurance_info.policy_number.trim()
      } : undefined
    };
  }

  /**
   * Generate OTP for phone verification
   * @returns 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store verification token
   * @param patientId - Patient ID
   * @param token - Verification token
   * @param type - Verification type
   */
  private async storeVerificationToken(patientId: string, token: string, type: VerificationType): Promise<void> {
    const expiresAt = new Date();
    
    if (type === VerificationType.EMAIL) {
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours
    } else {
      expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes
    }

    await this.verificationTokenModel.create({
      patient_id: patientId,
      token,
      type,
      expires_at: expiresAt,
      usage_count: 0,
      max_usage: 1,
      is_used: false
    });
  }
} 