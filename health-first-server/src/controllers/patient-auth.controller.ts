import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTooManyRequestsResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Request } from "express";
import { PatientAuthService } from "../services/patient-auth.service";
import {
  LoginPatientDto,
  RefreshTokenDto,
  LogoutDto,
  LogoutAllDto,
  PatientAuthResponseDto,
  RefreshTokenResponseDto,
  SessionsResponseDto,
  AuthErrorDto,
} from "../dtos/patient-auth.dto";

@ApiTags("Patient Authentication")
@Controller("v1/patient")
@UseInterceptors(ClassSerializerInterceptor)
export class PatientAuthController {
  constructor(private readonly patientAuthService: PatientAuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Patient login",
    description: "Authenticate patient with email/phone and password",
  })
  @ApiBody({
    type: LoginPatientDto,
    description: "Login credentials and device information",
  })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    type: PatientAuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Invalid request data",
    type: AuthErrorDto,
  })
  @ApiUnauthorizedResponse({
    description: "Invalid credentials",
    type: AuthErrorDto,
  })
  @ApiForbiddenResponse({
    description: "Account locked or email not verified",
    type: AuthErrorDto,
  })
  @ApiTooManyRequestsResponse({
    description: "Too many login attempts",
    type: AuthErrorDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AuthErrorDto,
  })
  async loginPatient(
    @Body() loginDto: LoginPatientDto,
    @Req() req: Request
  ): Promise<PatientAuthResponseDto> {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";

      return this.patientAuthService.loginPatient(
        loginDto,
        ipAddress,
        userAgent
      );
    } catch (error) {
      console.error("Patient login error:", error);
      throw error;
    }
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Refresh access token",
    description: "Refresh access token using refresh token",
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: "Refresh token",
  })
  @ApiResponse({
    status: 200,
    description: "Token refreshed successfully",
    type: RefreshTokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "Invalid refresh token",
    type: AuthErrorDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AuthErrorDto,
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request
  ): Promise<RefreshTokenResponseDto> {
    const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    return this.patientAuthService.refreshToken(
      refreshTokenDto,
      ipAddress,
      userAgent
    );
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Patient logout",
    description: "Logout patient and revoke current session",
  })
  @ApiBody({
    type: LogoutDto,
    description: "Refresh token to revoke",
  })
  @ApiResponse({
    status: 200,
    description: "Logout successful",
  })
  @ApiUnauthorizedResponse({
    description: "Invalid refresh token",
    type: AuthErrorDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AuthErrorDto,
  })
  async logoutPatient(
    @Body() logoutDto: LogoutDto,
    @Req() req: Request
  ): Promise<any> {
    const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    return this.patientAuthService.logoutPatient(
      logoutDto,
      ipAddress,
      userAgent
    );
  }

  @Post("logout-all")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Logout from all devices",
    description:
      "Logout patient from all devices (requires password confirmation)",
  })
  @ApiBody({
    type: LogoutAllDto,
    description: "Current password for security",
  })
  @ApiResponse({
    status: 200,
    description: "Logged out from all devices successfully",
  })
  @ApiUnauthorizedResponse({
    description: "Invalid password",
    type: AuthErrorDto,
  })
  @ApiNotFoundResponse({
    description: "Patient not found",
    type: AuthErrorDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AuthErrorDto,
  })
  async logoutAllDevices(
    @Body() logoutAllDto: LogoutAllDto,
    @Req() req: Request
  ): Promise<any> {
    const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Extract patient ID from JWT token (this would be set by auth middleware)
    const patientId = (req as any).user?.sub;

    return this.patientAuthService.logoutAllDevices(
      logoutAllDto,
      patientId,
      ipAddress,
      userAgent
    );
  }

  @Get("sessions")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get active sessions",
    description: "Get list of active sessions for the authenticated patient",
  })
  @ApiResponse({
    status: 200,
    description: "Active sessions retrieved successfully",
    type: SessionsResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
    type: AuthErrorDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AuthErrorDto,
  })
  async getActiveSessions(@Req() req: Request): Promise<SessionsResponseDto> {
    const patientId = (req as any).user?.sub;
    const sessionId = (req as any).user?.session_id;

    return this.patientAuthService.getActiveSessions(patientId, sessionId);
  }

  @Delete("sessions/:sessionId")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Revoke specific session",
    description: "Revoke a specific session for the authenticated patient",
  })
  @ApiParam({
    name: "sessionId",
    description: "Session ID to revoke",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiResponse({
    status: 200,
    description: "Session revoked successfully",
  })
  @ApiUnauthorizedResponse({
    description: "Unauthorized",
    type: AuthErrorDto,
  })
  @ApiNotFoundResponse({
    description: "Session not found",
    type: AuthErrorDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: AuthErrorDto,
  })
  async revokeSession(
    @Param("sessionId") sessionId: string,
    @Req() req: Request
  ): Promise<any> {
    const patientId = (req as any).user?.sub;
    const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    return this.patientAuthService.revokeSession(
      sessionId,
      patientId,
      ipAddress,
      userAgent
    );
  }

  @Get("test-patients")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get test patients",
    description: "Get list of patients for testing purposes",
  })
  @ApiResponse({
    status: 200,
    description: "Test patients retrieved successfully",
  })
  async getTestPatients(): Promise<any> {
    try {
      const patients = await this.patientAuthService.getTestPatients();
      return {
        success: true,
        message: "Test patients retrieved successfully",
        data: patients,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error retrieving test patients",
        error: error.message,
      };
    }
  }

  @Get("test")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Test endpoint for debugging",
    description: "Simple test endpoint to check if service is working",
  })
  @ApiResponse({
    status: 200,
    description: "Test successful",
  })
  async test(): Promise<any> {
    try {
      return this.patientAuthService.testMethod();
    } catch (error) {
      return {
        success: false,
        message: "Test method error",
        error: error.message,
      };
    }
  }

  @Post("verify-email/:patientId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Verify patient email (for testing)",
    description: "Manually verify a patient email for testing purposes",
  })
  @ApiParam({
    name: "patientId",
    description: "Patient ID to verify",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiResponse({
    status: 200,
    description: "Email verified successfully",
  })
  async verifyEmailForTesting(
    @Param("patientId") patientId: string
  ): Promise<any> {
    try {
      const result = await this.patientAuthService.verifyEmailForTesting(
        patientId
      );
      return {
        success: true,
        message: "Email verified successfully for testing",
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error verifying email",
        error: error.message,
      };
    }
  }
}
