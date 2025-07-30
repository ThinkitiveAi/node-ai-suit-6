import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsEmail, 
  IsNotEmpty, 
  MinLength, 
  MaxLength, 
  Matches,
  ValidateNested,
  IsOptional,
  IsObject,
  IsArray,
  IsEnum,
  IsDateString,
  IsBoolean,
  ValidateIf
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Gender } from '../models/patient.model';

export class AddressDto {
  @ApiProperty({ 
    description: 'Street address', 
    example: '456 Main Street',
    minLength: 1,
    maxLength: 200
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  street: string;

  @ApiProperty({ 
    description: 'City', 
    example: 'Boston',
    minLength: 1,
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({ 
    description: 'State', 
    example: 'MA',
    minLength: 1,
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  state: string;

  @ApiProperty({ 
    description: 'ZIP code', 
    example: '02101',
    pattern: '^[0-9]{5}(-[0-9]{4})?$'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{5}(-[0-9]{4})?$/, {
    message: 'ZIP code must be in format 12345 or 12345-6789'
  })
  zip: string;
}

export class EmergencyContactDto {
  @ApiProperty({ 
    description: 'Emergency contact name', 
    example: 'John Smith',
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ 
    description: 'Emergency contact phone', 
    example: '+1234567891',
    pattern: '^\\+[1-9]\\d{1,14}$'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in international format (e.g., +1234567890)'
  })
  phone: string;

  @ApiProperty({ 
    description: 'Relationship to patient', 
    example: 'spouse',
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  relationship: string;
}

export class InsuranceInfoDto {
  @ApiProperty({ 
    description: 'Insurance provider', 
    example: 'Blue Cross'
  })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ 
    description: 'Policy number', 
    example: 'BC123456789'
  })
  @IsString()
  @IsNotEmpty()
  policy_number: string;
}

export class RegisterPatientDto {
  @ApiProperty({ 
    description: 'First name', 
    example: 'Jane',
    minLength: 2,
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  first_name: string;

  @ApiProperty({ 
    description: 'Last name', 
    example: 'Smith',
    minLength: 2,
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  last_name: string;

  @ApiProperty({ 
    description: 'Email address', 
    example: 'jane.smith@email.com'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    description: 'Phone number', 
    example: '+1234567890',
    pattern: '^\\+[1-9]\\d{1,14}$'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in international format (e.g., +1234567890)'
  })
  phone_number: string;

  @ApiProperty({ 
    description: 'Password', 
    example: 'SecurePassword123!',
    minLength: 8
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character'
    }
  )
  password: string;

  @ApiProperty({ 
    description: 'Confirm password', 
    example: 'SecurePassword123!'
  })
  @IsString()
  @IsNotEmpty()
  confirm_password: string;

  @ApiProperty({ 
    description: 'Date of birth', 
    example: '1990-05-15'
  })
  @IsDateString()
  @IsNotEmpty()
  date_of_birth: string;

  @ApiProperty({ 
    description: 'Gender', 
    enum: Gender,
    example: 'female'
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ description: 'Patient address' })
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({ description: 'Emergency contact information', required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergency_contact?: EmergencyContactDto;

  @ApiProperty({ 
    description: 'Medical history', 
    example: ['Diabetes', 'Hypertension'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medical_history?: string[];

  @ApiProperty({ description: 'Insurance information', required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => InsuranceInfoDto)
  insurance_info?: InsuranceInfoDto;

  @ApiProperty({ 
    description: 'Marketing communications opt-in', 
    example: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  marketing_opt_in?: boolean;

  @ApiProperty({ 
    description: 'Data retention consent', 
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  data_retention_consent?: boolean;

  @ApiProperty({ 
    description: 'HIPAA consent', 
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  hipaa_consent?: boolean;
}

export class PatientResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data: {
    patient_id: string;
    email: string;
    phone_number: string;
    email_verified: boolean;
    phone_verified: boolean;
  };
}

export class ValidationErrorDto {
  @ApiProperty({ description: 'Error status' })
  success: boolean;

  @ApiProperty({ description: 'Error message' })
  message: string;

  @ApiProperty({ description: 'Validation errors' })
  errors: Record<string, string[]>;
}

export class VerificationDto {
  @ApiProperty({ 
    description: 'Verification token', 
    example: 'uuid-token-here'
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class VerificationResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Verification type' })
  type: 'email' | 'phone';
} 