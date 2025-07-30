import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional,
  IsBoolean,
  IsObject,
  ValidateNested,
  IsEmail
} from 'class-validator';
import { Type } from 'class-transformer';

export class DeviceInfoDto {
  @ApiProperty({ 
    description: 'Device type', 
    example: 'mobile',
    required: false
  })
  @IsOptional()
  @IsString()
  device_type?: string;

  @ApiProperty({ 
    description: 'Device name', 
    example: 'iPhone 12',
    required: false
  })
  @IsOptional()
  @IsString()
  device_name?: string;

  @ApiProperty({ 
    description: 'App version', 
    example: '1.0.0',
    required: false
  })
  @IsOptional()
  @IsString()
  app_version?: string;

  @ApiProperty({ 
    description: 'Operating system', 
    example: 'iOS 15.0',
    required: false
  })
  @IsOptional()
  @IsString()
  os_version?: string;

  @ApiProperty({ 
    description: 'Browser information', 
    example: 'Safari/15.0',
    required: false
  })
  @IsOptional()
  @IsString()
  browser_info?: string;

  @ApiProperty({ 
    description: 'Device fingerprint', 
    example: 'unique-device-id',
    required: false
  })
  @IsOptional()
  @IsString()
  device_fingerprint?: string;
}

export class LoginPatientDto {
  @ApiProperty({ 
    description: 'Email or phone number', 
    example: 'jane.smith@email.com'
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ 
    description: 'Password', 
    example: 'SecurePassword123!'
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ 
    description: 'Remember me option', 
    example: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  remember_me?: boolean;

  @ApiProperty({ 
    description: 'Device information',
    required: false
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  device_info?: DeviceInfoDto;
}

export class RefreshTokenDto {
  @ApiProperty({ 
    description: 'Refresh token', 
    example: 'jwt-refresh-token-here'
  })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

export class LogoutDto {
  @ApiProperty({ 
    description: 'Refresh token to revoke', 
    example: 'jwt-refresh-token-here'
  })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

export class LogoutAllDto {
  @ApiProperty({ 
    description: 'Current password for security', 
    example: 'SecurePassword123!'
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class PatientAuthResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Authentication data' })
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    patient: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
      date_of_birth: string;
      email_verified: boolean;
      phone_verified: boolean;
      is_active: boolean;
      last_login: string;
    };
  };
}

export class RefreshTokenResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'New token data' })
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };
}

export class SessionDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiProperty({ description: 'Device information' })
  device_info: DeviceInfoDto;

  @ApiProperty({ description: 'IP address' })
  ip_address: string;

  @ApiProperty({ description: 'Last used timestamp' })
  last_used_at: string;

  @ApiProperty({ description: 'Session created timestamp' })
  created_at: string;

  @ApiProperty({ description: 'Is current session' })
  is_current: boolean;
}

export class SessionsResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Active sessions' })
  data: {
    sessions: SessionDto[];
    total_sessions: number;
  };
}

export class AuthErrorDto {
  @ApiProperty({ description: 'Error status' })
  success: boolean;

  @ApiProperty({ description: 'Error message' })
  message: string;

  @ApiProperty({ description: 'Error code' })
  error_code: string;

  @ApiProperty({ description: 'Additional error data', required: false })
  verification_required?: boolean;

  @ApiProperty({ description: 'Account locked until', required: false })
  locked_until?: string;

  @ApiProperty({ description: 'Remaining attempts', required: false })
  remaining_attempts?: number;
} 