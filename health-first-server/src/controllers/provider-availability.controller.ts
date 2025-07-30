import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery,
  ApiBearerAuth
} from '@nestjs/swagger';
import { ProviderAvailabilityService } from '../services/provider-availability.service';
import { 
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  GetAvailabilityQueryDto,
  SearchAvailabilityQueryDto,
  DeleteAvailabilityQueryDto,
  CreateAvailabilityResponseDto,
  GetAvailabilityResponseDto,
  SearchAvailabilityResponseDto
} from '../dtos/provider-availability.dto';
import { AuthMiddleware } from '../middlewares/auth.middleware';

@ApiTags('Provider Availability Management')
@Controller('api/v1/provider')
@UseGuards(AuthMiddleware)
@ApiBearerAuth()
export class ProviderAvailabilityController {
  constructor(
    private readonly availabilityService: ProviderAvailabilityService
  ) {}

  @Post('availability')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create availability slots',
    description: 'Create availability slots for a healthcare provider. Supports recurring patterns and generates appointment slots automatically.'
  })
  @ApiResponse({
    status: 201,
    description: 'Availability slots created successfully',
    type: CreateAvailabilityResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token'
  })
  @ApiResponse({
    status: 404,
    description: 'Provider not found'
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Time conflict with existing availability'
  })
  async createAvailability(
    @Body() createDto: CreateAvailabilityDto
  ): Promise<CreateAvailabilityResponseDto> {
    // In a real implementation, you would get the provider ID from the authenticated user
    // For now, we'll use a placeholder - this should come from the JWT token
    const providerId = 'placeholder-provider-id'; // This should be extracted from JWT
    
    return this.availabilityService.createAvailability(providerId, createDto);
  }

  @Get(':provider_id/availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get provider availability',
    description: 'Retrieve availability slots for a specific provider within a date range.'
  })
  @ApiParam({
    name: 'provider_id',
    description: 'Provider ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiQuery({
    name: 'start_date',
    description: 'Start date in YYYY-MM-DD format',
    example: '2024-02-15'
  })
  @ApiQuery({
    name: 'end_date',
    description: 'End date in YYYY-MM-DD format',
    example: '2024-02-20'
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by slot status',
    required: false,
    enum: ['available', 'booked', 'cancelled', 'blocked', 'maintenance']
  })
  @ApiQuery({
    name: 'appointment_type',
    description: 'Filter by appointment type',
    required: false,
    enum: ['consultation', 'follow_up', 'emergency', 'telemedicine']
  })
  @ApiQuery({
    name: 'timezone',
    description: 'Timezone for time display',
    required: false,
    example: 'America/New_York'
  })
  @ApiResponse({
    status: 200,
    description: 'Provider availability retrieved successfully',
    type: GetAvailabilityResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid query parameters'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token'
  })
  @ApiResponse({
    status: 404,
    description: 'Provider not found'
  })
  async getProviderAvailability(
    @Param('provider_id') providerId: string,
    @Query() query: GetAvailabilityQueryDto
  ): Promise<GetAvailabilityResponseDto> {
    return this.availabilityService.getProviderAvailability(providerId, query);
  }

  @Put('availability/:slot_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update availability slot',
    description: 'Update a specific availability slot. Cannot update booked slots.'
  })
  @ApiParam({
    name: 'slot_id',
    description: 'Slot ID to update',
    example: '507f1f77bcf86cd799439012'
  })
  @ApiResponse({
    status: 200,
    description: 'Slot updated successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Cannot update booked slot'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token'
  })
  @ApiResponse({
    status: 404,
    description: 'Slot not found'
  })
  async updateAvailabilitySlot(
    @Param('slot_id') slotId: string,
    @Body() updateDto: UpdateAvailabilityDto
  ): Promise<any> {
    // In a real implementation, you would get the provider ID from the authenticated user
    const providerId = 'placeholder-provider-id'; // This should be extracted from JWT
    
    return this.availabilityService.updateAvailabilitySlot(slotId, providerId, updateDto);
  }

  @Delete('availability/:slot_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete availability slot',
    description: 'Delete a specific availability slot. Cannot delete booked slots.'
  })
  @ApiParam({
    name: 'slot_id',
    description: 'Slot ID to delete',
    example: '507f1f77bcf86cd799439012'
  })
  @ApiQuery({
    name: 'delete_recurring',
    description: 'Delete all recurring instances',
    required: false,
    type: Boolean
  })
  @ApiQuery({
    name: 'reason',
    description: 'Reason for deletion',
    required: false,
    type: String
  })
  @ApiResponse({
    status: 200,
    description: 'Slot deleted successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Cannot delete booked slot'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token'
  })
  @ApiResponse({
    status: 404,
    description: 'Slot not found'
  })
  async deleteAvailabilitySlot(
    @Param('slot_id') slotId: string,
    @Query() query: DeleteAvailabilityQueryDto
  ): Promise<any> {
    // In a real implementation, you would get the provider ID from the authenticated user
    const providerId = 'placeholder-provider-id'; // This should be extracted from JWT
    
    return this.availabilityService.deleteAvailabilitySlot(slotId, providerId, query);
  }
}

@ApiTags('Patient Search')
@Controller('api/v1/availability')
export class AvailabilitySearchController {
  constructor(
    private readonly availabilityService: ProviderAvailabilityService
  ) {}

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search for available slots',
    description: 'Search for available appointment slots based on various criteria like date, specialization, location, etc.'
  })
  @ApiQuery({
    name: 'date',
    description: 'Specific date in YYYY-MM-DD format',
    required: false,
    example: '2024-02-15'
  })
  @ApiQuery({
    name: 'start_date',
    description: 'Start date for date range search',
    required: false,
    example: '2024-02-15'
  })
  @ApiQuery({
    name: 'end_date',
    description: 'End date for date range search',
    required: false,
    example: '2024-02-20'
  })
  @ApiQuery({
    name: 'specialization',
    description: 'Medical specialization',
    required: false,
    example: 'cardiology'
  })
  @ApiQuery({
    name: 'location',
    description: 'Location (city, state, or zip)',
    required: false,
    example: 'New York, NY'
  })
  @ApiQuery({
    name: 'appointment_type',
    description: 'Type of appointment',
    required: false,
    enum: ['consultation', 'follow_up', 'emergency', 'telemedicine']
  })
  @ApiQuery({
    name: 'insurance_accepted',
    description: 'Whether insurance is accepted',
    required: false,
    type: Boolean
  })
  @ApiQuery({
    name: 'max_price',
    description: 'Maximum price for appointment',
    required: false,
    type: Number
  })
  @ApiQuery({
    name: 'timezone',
    description: 'Timezone for time display',
    required: false,
    example: 'America/New_York'
  })
  @ApiQuery({
    name: 'available_only',
    description: 'Show only available slots (default: true)',
    required: false,
    type: Boolean
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    type: SearchAvailabilityResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid query parameters'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async searchAvailability(
    @Query() query: SearchAvailabilityQueryDto
  ): Promise<SearchAvailabilityResponseDto> {
    return this.availabilityService.searchAvailability(query);
  }
} 