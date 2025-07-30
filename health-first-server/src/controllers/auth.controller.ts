import { 
  Controller, 
  Post, 
  Body, 
  HttpStatus, 
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Request
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTooManyRequestsResponse,
  ApiInternalServerErrorResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { 
  LoginDto, 
  RefreshTokenDto, 
  LogoutDto,
  LoginResponseDto,
  RefreshResponseDto,
  LogoutResponseDto,
  AuthErrorDto
} from '../dtos/auth.dto';
import { AuthMiddleware, AuthenticatedRequest } from '../middlewares/auth.middleware';

@ApiTags('Authentication')
@Controller('v1/provider')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Provider login',
    description: 'Authenticate provider with email/phone and password'
  })
  @ApiBody({ 
    type: LoginDto,
    description: 'Login credentials'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    type: LoginResponseDto
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid request format',
    type: AuthErrorDto
  })
  @ApiUnauthorizedResponse({ 
    description: 'Invalid credentials',
    type: AuthErrorDto
  })
  @ApiForbiddenResponse({ 
    description: 'Account locked, deactivated, or not verified',
    type: AuthErrorDto
  })
  @ApiTooManyRequestsResponse({ 
    description: 'Too many failed login attempts',
    type: AuthErrorDto
  })
  @ApiInternalServerErrorResponse({ 
    description: 'Internal server error',
    type: AuthErrorDto
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Refresh access token',
    description: 'Get new access token using refresh token'
  })
  @ApiBody({ 
    type: RefreshTokenDto,
    description: 'Refresh token'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    type: RefreshResponseDto
  })
  @ApiUnauthorizedResponse({ 
    description: 'Invalid or expired refresh token',
    type: AuthErrorDto
  })
  @ApiInternalServerErrorResponse({ 
    description: 'Internal server error',
    type: AuthErrorDto
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshResponseDto> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Provider logout',
    description: 'Logout provider by revoking refresh token'
  })
  @ApiBody({ 
    type: LogoutDto,
    description: 'Refresh token to revoke'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout successful',
    type: LogoutResponseDto
  })
  @ApiUnauthorizedResponse({ 
    description: 'Invalid refresh token',
    type: AuthErrorDto
  })
  @ApiInternalServerErrorResponse({ 
    description: 'Internal server error',
    type: AuthErrorDto
  })
  async logout(@Body() logoutDto: LogoutDto): Promise<LogoutResponseDto> {
    return this.authService.logout(logoutDto);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Logout from all sessions',
    description: 'Logout provider from all active sessions'
  })
  @ApiBearerAuth()
  @ApiResponse({ 
    status: 200, 
    description: 'Logged out from all sessions',
    type: LogoutResponseDto
  })
  @ApiUnauthorizedResponse({ 
    description: 'Invalid access token',
    type: AuthErrorDto
  })
  @ApiInternalServerErrorResponse({ 
    description: 'Internal server error',
    type: AuthErrorDto
  })
  async logoutAll(@Request() req: AuthenticatedRequest): Promise<LogoutResponseDto> {
    return this.authService.logoutAll(req.provider.id);
  }
} 