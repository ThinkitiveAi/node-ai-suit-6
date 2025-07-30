import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsEmail, 
  IsNotEmpty, 
  MinLength, 
  MaxLength, 
  IsNumber, 
  Min, 
  Max, 
  Matches,
  ValidateNested,
  IsOptional,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';

export class ClinicAddressDto {
  @ApiProperty({ 
    description: 'Street address', 
    example: '123 Medical Center Dr',
    minLength: 1,
    maxLength: 200
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  street: string;

  @ApiProperty({ 
    description: 'City', 
    example: 'New York',
    minLength: 1,
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({ 
    description: 'State', 
    example: 'NY',
    minLength: 1,
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  state: string;

  @ApiProperty({ 
    description: 'ZIP code', 
    example: '10001',
    pattern: '^[0-9]{5}(-[0-9]{4})?$'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{5}(-[0-9]{4})?$/, {
    message: 'ZIP code must be in format 12345 or 12345-6789'
  })
  zip: string;
}

export class RegisterProviderDto {
  @ApiProperty({ 
    description: 'First name', 
    example: 'John',
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
    example: 'Doe',
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
    example: 'john.doe@clinic.com'
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
    description: 'Medical specialization', 
    example: 'Cardiology',
    minLength: 3,
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  specialization: string;

  @ApiProperty({ 
    description: 'License number', 
    example: 'MD123456789'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9]+$/, {
    message: 'License number must contain only uppercase letters and numbers'
  })
  license_number: string;

  @ApiProperty({ 
    description: 'Years of experience', 
    example: 10,
    minimum: 0,
    maximum: 50
  })
  @IsNumber()
  @Min(0)
  @Max(50)
  years_of_experience: number;

  @ApiProperty({ description: 'Clinic address' })
  @IsObject()
  @ValidateNested()
  @Type(() => ClinicAddressDto)
  clinic_address: ClinicAddressDto;
}

export class ProviderResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data: {
    provider_id: string;
    email: string;
    verification_status: string;
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