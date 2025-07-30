import { 
  Controller, 
  Post, 
  Get,
  Body, 
  Param,
  HttpStatus, 
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody,
  ApiParam,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiTooManyRequestsResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse
} from '@nestjs/swagger';
import { PatientService } from '../services/patient.service';
import { 
  RegisterPatientDto, 
  VerificationDto,
  PatientResponseDto,
  ValidationErrorDto,
  VerificationResponseDto
} from '../dtos/patient.dto';

@ApiTags('Patient Registration')
@Controller('v1/patient')
@UseInterceptors(ClassSerializerInterceptor)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register a new patient',
    description: 'Register a new patient with comprehensive validation and HIPAA compliance'
  })
  @ApiBody({ 
    type: RegisterPatientDto,
    description: 'Patient registration data'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Patient registered successfully',
    type: PatientResponseDto
  })
  @ApiBadRequestResponse({ 
    description: 'Validation failed',
    type: ValidationErrorDto
  })
  @ApiConflictResponse({ 
    description: 'Email or phone number already registered',
    type: ValidationErrorDto
  })
  @ApiTooManyRequestsResponse({ 
    description: 'Too many registration attempts',
    type: ValidationErrorDto
  })
  @ApiInternalServerErrorResponse({ 
    description: 'Internal server error',
    type: ValidationErrorDto
  })
  async registerPatient(@Body() registerDto: RegisterPatientDto): Promise<PatientResponseDto> {
    return this.patientService.registerPatient(registerDto);
  }

  @Post('verify/email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verify email address',
    description: 'Verify patient email address using verification token'
  })
  @ApiBody({ 
    type: VerificationDto,
    description: 'Email verification token'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Email verified successfully',
    type: VerificationResponseDto
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid or expired token',
    type: ValidationErrorDto
  })
  @ApiInternalServerErrorResponse({ 
    description: 'Internal server error',
    type: ValidationErrorDto
  })
  async verifyEmail(@Body() verificationDto: VerificationDto): Promise<VerificationResponseDto> {
    return this.patientService.verifyEmail(verificationDto);
  }

  @Post('verify/phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verify phone number',
    description: 'Verify patient phone number using OTP token'
  })
  @ApiBody({ 
    type: VerificationDto,
    description: 'Phone verification OTP'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Phone number verified successfully',
    type: VerificationResponseDto
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid or expired OTP',
    type: ValidationErrorDto
  })
  @ApiInternalServerErrorResponse({ 
    description: 'Internal server error',
    type: ValidationErrorDto
  })
  async verifyPhone(@Body() verificationDto: VerificationDto): Promise<VerificationResponseDto> {
    return this.patientService.verifyPhone(verificationDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get patient by ID',
    description: 'Get patient information with data masking for privacy'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Patient ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Patient information retrieved successfully'
  })
  @ApiNotFoundResponse({ 
    description: 'Patient not found',
    type: ValidationErrorDto
  })
  @ApiInternalServerErrorResponse({ 
    description: 'Internal server error',
    type: ValidationErrorDto
  })
  async getPatientById(@Param('id') id: string): Promise<any> {
    return this.patientService.getPatientById(id);
  }
} 