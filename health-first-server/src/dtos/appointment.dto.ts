import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  MaxLength,
  IsEnum,
  IsArray,
  ValidateNested,
  IsObject,
  Matches,
  IsDateString,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export enum AppointmentStatus {
  BOOKED = "booked",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
  NO_SHOW = "no_show",
}

export enum AppointmentType {
  CONSULTATION = "consultation",
  FOLLOW_UP = "follow_up",
  EMERGENCY = "emergency",
  TELEMEDICINE = "telemedicine",
}

export class BookAppointmentDto {
  @ApiProperty({
    description: "Appointment slot ID to book",
    example: "688b5140cc9b9a54f93c7cce",
  })
  @IsString()
  @IsNotEmpty()
  slot_id: string;

  @ApiProperty({
    description: "Patient ID booking the appointment",
    example: "688a08b87a695b7b955e5c85",
  })
  @IsString()
  @IsNotEmpty()
  patient_id: string;

  @ApiProperty({
    description: "Appointment type",
    enum: AppointmentType,
    default: "consultation",
  })
  @IsOptional()
  @IsEnum(AppointmentType)
  appointment_type?: AppointmentType;

  @ApiProperty({
    description: "Additional notes for the appointment",
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({
    description: "Special requirements for the appointment",
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  special_requirements?: string[];
}

export class GetPatientAppointmentsQueryDto {
  @ApiProperty({
    description: "Start date in YYYY-MM-DD format",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Start date must be in YYYY-MM-DD format",
  })
  start_date?: string;

  @ApiProperty({
    description: "End date in YYYY-MM-DD format",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "End date must be in YYYY-MM-DD format",
  })
  end_date?: string;

  @ApiProperty({
    description: "Appointment status filter",
    enum: AppointmentStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiProperty({
    description: "Appointment type filter",
    enum: AppointmentType,
    required: false,
  })
  @IsOptional()
  @IsEnum(AppointmentType)
  appointment_type?: AppointmentType;

  @ApiProperty({
    description: "Page number for pagination",
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => {
    const num = parseInt(value);
    return isNaN(num) ? 1 : num;
  })
  page?: number;

  @ApiProperty({
    description: "Number of items per page",
    required: false,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => {
    const num = parseInt(value);
    return isNaN(num) ? 10 : num;
  })
  limit?: number;
}

export class AppointmentSlotDto {
  @ApiProperty({ description: "Slot ID" })
  slot_id: string;

  @ApiProperty({ description: "Start time" })
  start_time: string;

  @ApiProperty({ description: "End time" })
  end_time: string;

  @ApiProperty({ description: "Slot status" })
  status: string;

  @ApiProperty({ description: "Appointment type" })
  appointment_type: string;

  @ApiProperty({ description: "Location information" })
  location: {
    type: string;
    address?: string;
    room_number?: string;
  };

  @ApiProperty({ description: "Pricing information" })
  pricing?: {
    base_fee: number;
    insurance_accepted: boolean;
    currency: string;
  };

  @ApiProperty({ description: "Special requirements" })
  special_requirements?: string[];
}

export class ProviderInfoDto {
  @ApiProperty({ description: "Provider ID" })
  id: string;

  @ApiProperty({ description: "Provider name" })
  name: string;

  @ApiProperty({ description: "Medical specialization" })
  specialization: string;

  @ApiProperty({ description: "Years of experience" })
  years_of_experience: number;

  @ApiProperty({ description: "Provider rating" })
  rating: number;

  @ApiProperty({ description: "Clinic address" })
  clinic_address: string;
}

export class AppointmentDto {
  @ApiProperty({ description: "Appointment ID" })
  appointment_id: string;

  @ApiProperty({ description: "Booking reference" })
  booking_reference: string;

  @ApiProperty({ description: "Appointment date" })
  date: string;

  @ApiProperty({ description: "Start time" })
  start_time: string;

  @ApiProperty({ description: "End time" })
  end_time: string;

  @ApiProperty({ description: "Appointment status" })
  status: AppointmentStatus;

  @ApiProperty({ description: "Appointment type" })
  appointment_type: AppointmentType;

  @ApiProperty({ description: "Provider information" })
  provider: ProviderInfoDto;

  @ApiProperty({ description: "Location information" })
  location: {
    type: string;
    address?: string;
    room_number?: string;
  };

  @ApiProperty({ description: "Pricing information" })
  pricing?: {
    base_fee: number;
    insurance_accepted: boolean;
    currency: string;
  };

  @ApiProperty({ description: "Additional notes" })
  notes?: string;

  @ApiProperty({ description: "Special requirements" })
  special_requirements?: string[];

  @ApiProperty({ description: "Created at timestamp" })
  created_at: Date;

  @ApiProperty({ description: "Updated at timestamp" })
  updated_at: Date;
}

export class BookAppointmentResponseDto {
  @ApiProperty({ description: "Success status" })
  success: boolean;

  @ApiProperty({ description: "Response message" })
  message: string;

  @ApiProperty({ description: "Response data" })
  data: {
    appointment: AppointmentDto;
    booking_reference: string;
  };
}

export class GetPatientAppointmentsResponseDto {
  @ApiProperty({ description: "Success status" })
  success: boolean;

  @ApiProperty({ description: "Response data" })
  data: {
    appointments: AppointmentDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

export class CancelAppointmentDto {
  @ApiProperty({
    description: "Reason for cancellation",
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CancelAppointmentResponseDto {
  @ApiProperty({ description: "Success status" })
  success: boolean;

  @ApiProperty({ description: "Response message" })
  message: string;

  @ApiProperty({ description: "Response data" })
  data: {
    appointment_id: string;
    status: AppointmentStatus;
    cancelled_at: Date;
  };
}

export class ValidationErrorDto {
  @ApiProperty({ description: "Error message" })
  message: string;

  @ApiProperty({ description: "Error type" })
  error: string;

  @ApiProperty({ description: "HTTP status code" })
  statusCode: number;
}
