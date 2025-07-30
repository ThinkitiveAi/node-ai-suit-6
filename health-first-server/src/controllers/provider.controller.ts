import {
  Controller,
  Post,
  Body,
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
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
} from "@nestjs/swagger";
import { ProviderService } from "../services/provider.service";
import {
  RegisterProviderDto,
  ProviderResponseDto,
  ValidationErrorDto,
} from "../dtos/provider.dto";

@ApiTags("Provider Registration")
@Controller("v1/provider")
@UseInterceptors(ClassSerializerInterceptor)
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Register a new healthcare provider",
    description:
      "Register a new healthcare provider with comprehensive validation and security measures",
  })
  @ApiBody({
    type: RegisterProviderDto,
    description: "Provider registration data",
  })
  @ApiResponse({
    status: 201,
    description: "Provider registered successfully",
    type: ProviderResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Validation errors or password mismatch",
    type: ValidationErrorDto,
  })
  @ApiConflictResponse({
    description: "Email, phone number, or license number already exists",
    type: ValidationErrorDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: ValidationErrorDto,
  })
  async registerProvider(
    @Body() registerDto: RegisterProviderDto
  ): Promise<ProviderResponseDto> {
    return this.providerService.registerProvider(registerDto);
  }
}
