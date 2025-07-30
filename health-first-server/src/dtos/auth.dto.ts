import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class LoginDto {
  @ApiProperty({ 
    description: 'Email or phone number', 
    example: 'john.doe@clinic.com',
    oneOf: [
      { type: 'string', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
      { type: 'string', pattern: '^\\+[1-9]\\d{1,14}$' }
    ]
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

export class ProviderInfoDto {
  @ApiProperty({ description: 'Provider ID' })
  id: string;

  @ApiProperty({ description: 'First name' })
  first_name: string;

  @ApiProperty({ description: 'Last name' })
  last_name: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'Specialization' })
  specialization: string;

  @ApiProperty({ description: 'Verification status' })
  verification_status: string;

  @ApiProperty({ description: 'Active status' })
  is_active: boolean;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    provider: ProviderInfoDto;
  };
}

export class RefreshResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };
}

export class LogoutResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;
}

export class AuthErrorDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Error message' })
  message: string;

  @ApiProperty({ description: 'Error code' })
  error_code: string;
} 