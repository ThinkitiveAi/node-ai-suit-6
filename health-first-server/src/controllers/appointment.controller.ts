import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Query,
  Param,
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
  ApiQuery,
  ApiParam,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
} from "@nestjs/swagger";
import { AppointmentService } from "../services/appointment.service";
import {
  BookAppointmentDto,
  GetPatientAppointmentsQueryDto,
  CancelAppointmentDto,
  BookAppointmentResponseDto,
  GetPatientAppointmentsResponseDto,
  CancelAppointmentResponseDto,
  ValidationErrorDto,
} from "../dtos/appointment.dto";

@ApiTags("Appointment Management")
@Controller("v1/appointments")
@UseInterceptors(ClassSerializerInterceptor)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post("book")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Book an appointment",
    description: "Book an available appointment slot for a patient",
  })
  @ApiBody({
    type: BookAppointmentDto,
    description: "Appointment booking data",
  })
  @ApiResponse({
    status: 201,
    description: "Appointment booked successfully",
    type: BookAppointmentResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Bad request - Invalid input data or slot not available",
    type: ValidationErrorDto,
  })
  @ApiNotFoundResponse({
    description: "Patient, provider, or slot not found",
    type: ValidationErrorDto,
  })
  @ApiConflictResponse({
    description: "Conflict - Slot already booked or not available",
    type: ValidationErrorDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: ValidationErrorDto,
  })
  async bookAppointment(
    @Body() bookDto: BookAppointmentDto
  ): Promise<BookAppointmentResponseDto> {
    return this.appointmentService.bookAppointment(bookDto);
  }

  @Get("patient/:patientId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get patient appointments",
    description:
      "Get all appointments for a specific patient with filtering and pagination",
  })
  @ApiParam({
    name: "patientId",
    description: "Patient ID",
    example: "688a08b87a695b7b955e5c85",
  })
  @ApiQuery({
    name: "start_date",
    description: "Start date filter (YYYY-MM-DD)",
    required: false,
    example: "2025-01-01",
  })
  @ApiQuery({
    name: "end_date",
    description: "End date filter (YYYY-MM-DD)",
    required: false,
    example: "2025-12-31",
  })
  @ApiQuery({
    name: "status",
    description: "Appointment status filter",
    required: false,
    enum: ["booked", "confirmed", "cancelled", "completed", "no_show"],
  })
  @ApiQuery({
    name: "appointment_type",
    description: "Appointment type filter",
    required: false,
    enum: ["consultation", "follow_up", "emergency", "telemedicine"],
  })
  @ApiQuery({
    name: "page",
    description: "Page number for pagination",
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    description: "Number of items per page",
    required: false,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: "Patient appointments retrieved successfully",
    type: GetPatientAppointmentsResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Patient not found",
    type: ValidationErrorDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: ValidationErrorDto,
  })
  async getPatientAppointments(
    @Param("patientId") patientId: string,
    @Query() query: GetPatientAppointmentsQueryDto
  ): Promise<GetPatientAppointmentsResponseDto> {
    return this.appointmentService.getPatientAppointments(patientId, query);
  }

  @Put(":appointmentId/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Cancel an appointment",
    description: "Cancel a booked appointment for a patient",
  })
  @ApiParam({
    name: "appointmentId",
    description: "Appointment ID",
    example: "688b5140cc9b9a54f93c7cce",
  })
  @ApiBody({
    type: CancelAppointmentDto,
    description: "Cancellation data",
  })
  @ApiResponse({
    status: 200,
    description: "Appointment cancelled successfully",
    type: CancelAppointmentResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Bad request - Appointment cannot be cancelled",
    type: ValidationErrorDto,
  })
  @ApiNotFoundResponse({
    description: "Appointment not found",
    type: ValidationErrorDto,
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    type: ValidationErrorDto,
  })
  async cancelAppointment(
    @Param("appointmentId") appointmentId: string,
    @Body() cancelDto: CancelAppointmentDto
  ): Promise<CancelAppointmentResponseDto> {
    // In a real implementation, you would get the patient ID from the authenticated user
    // For now, we'll use a valid ObjectId format for testing
    const patientId = "688a08b87a695b7b955e5c85"; // This should be extracted from JWT

    return this.appointmentService.cancelAppointment(
      appointmentId,
      patientId,
      cancelDto
    );
  }
}
