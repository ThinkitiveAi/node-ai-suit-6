import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsArray,
  ValidateNested,
  IsObject,
  Matches,
  IsDateString,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import {
  RecurrencePattern,
  AppointmentType,
  LocationType,
  SlotStatus,
} from "../models/provider-availability.model";

export class LocationDto {
  @ApiProperty({ description: "Location type", enum: LocationType })
  @IsEnum(LocationType)
  type: LocationType;

  @ApiProperty({
    description: "Address for physical location",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  address?: string;

  @ApiProperty({ description: "Room number", required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  room_number?: string;
}

export class PricingDto {
  @ApiProperty({ description: "Base fee for appointment" })
  @IsNumber()
  @Min(0)
  base_fee: number;

  @ApiProperty({ description: "Whether insurance is accepted" })
  @IsBoolean()
  insurance_accepted: boolean;

  @ApiProperty({ description: "Currency code", default: "USD" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  currency?: string;
}

export class CreateAvailabilityDto {
  @ApiProperty({
    description: "Date in YYYY-MM-DD format",
    example: "2024-02-15",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format",
  })
  date: string;

  @ApiProperty({
    description: "Start time in HH:mm format (24-hour)",
    example: "09:00",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Start time must be in HH:mm format (24-hour)",
  })
  start_time: string;

  @ApiProperty({
    description: "End time in HH:mm format (24-hour)",
    example: "17:00",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "End time must be in HH:mm format (24-hour)",
  })
  end_time: string;

  @ApiProperty({ description: "Timezone", example: "America/New_York" })
  @IsString()
  @IsNotEmpty()
  timezone: string;

  @ApiProperty({ description: "Slot duration in minutes", default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(480)
  slot_duration?: number;

  @ApiProperty({ description: "Break duration in minutes", default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  break_duration?: number;

  @ApiProperty({
    description: "Whether this is a recurring slot",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;

  @ApiProperty({
    description: "Recurrence pattern",
    enum: RecurrencePattern,
    required: false,
  })
  @IsOptional()
  @IsEnum(RecurrencePattern)
  recurrence_pattern?: RecurrencePattern;

  @ApiProperty({ description: "Recurrence end date", required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Recurrence end date must be in YYYY-MM-DD format",
  })
  recurrence_end_date?: string;

  @ApiProperty({ description: "Maximum appointments per slot", default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  max_appointments_per_slot?: number;

  @ApiProperty({
    description: "Appointment type",
    enum: AppointmentType,
    default: "consultation",
  })
  @IsOptional()
  @IsEnum(AppointmentType)
  appointment_type?: AppointmentType;

  @ApiProperty({ description: "Location information" })
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({ description: "Pricing information", required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PricingDto)
  pricing?: PricingDto;

  @ApiProperty({
    description: "Special requirements",
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  special_requirements?: string[];

  @ApiProperty({
    description: "Additional notes",
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  notes?: string;
}

export class UpdateAvailabilityDto {
  @ApiProperty({
    description: "Start time in HH:mm format (24-hour)",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Start time must be in HH:mm format (24-hour)",
  })
  start_time?: string;

  @ApiProperty({
    description: "End time in HH:mm format (24-hour)",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "End time must be in HH:mm format (24-hour)",
  })
  end_time?: string;

  @ApiProperty({
    description: "Slot status",
    enum: SlotStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(SlotStatus)
  status?: SlotStatus;

  @ApiProperty({
    description: "Additional notes",
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  notes?: string;

  @ApiProperty({ description: "Pricing information", required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PricingDto)
  pricing?: PricingDto;
}

export class GetAvailabilityQueryDto {
  @ApiProperty({
    description: "Start date in YYYY-MM-DD format",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Start date must be in YYYY-MM-DD format",
  })
  start_date: string;

  @ApiProperty({ description: "End date in YYYY-MM-DD format", required: true })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "End date must be in YYYY-MM-DD format",
  })
  end_date: string;

  @ApiProperty({
    description: "Slot status filter",
    enum: SlotStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(SlotStatus)
  status?: SlotStatus;

  @ApiProperty({
    description: "Appointment type filter",
    enum: AppointmentType,
    required: false,
  })
  @IsOptional()
  @IsEnum(AppointmentType)
  appointment_type?: AppointmentType;

  @ApiProperty({ description: "Timezone for display", required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  timezone?: string;
}

export class SearchAvailabilityQueryDto {
  @ApiProperty({
    description: "Specific date in YYYY-MM-DD format",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format",
  })
  date?: string;

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

  @ApiProperty({ description: "Medical specialization", required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  specialization?: string;

  @ApiProperty({
    description: "Location (city, state, or zip)",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  location?: string;

  @ApiProperty({
    description: "Appointment type",
    enum: AppointmentType,
    required: false,
  })
  @IsOptional()
  @IsEnum(AppointmentType)
  appointment_type?: AppointmentType;

  @ApiProperty({
    description: "Whether insurance is accepted",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  insurance_accepted?: boolean;

  @ApiProperty({ description: "Maximum price", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_price?: number;

  @ApiProperty({ description: "Timezone", required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  timezone?: string;

  @ApiProperty({ description: "Show only available slots", default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  available_only?: boolean;
}

export class DeleteAvailabilityQueryDto {
  @ApiProperty({
    description: "Delete all recurring instances",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  delete_recurring?: boolean;

  @ApiProperty({ description: "Reason for deletion", required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  reason?: string;
}

// Response DTOs
export class AvailabilitySlotDto {
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
  location: LocationDto;

  @ApiProperty({ description: "Pricing information" })
  pricing?: PricingDto;

  @ApiProperty({ description: "Special requirements" })
  special_requirements?: string[];
}

export class DailyAvailabilityDto {
  @ApiProperty({ description: "Date" })
  date: string;

  @ApiProperty({ description: "Available slots for the day" })
  slots: AvailabilitySlotDto[];
}

export class AvailabilitySummaryDto {
  @ApiProperty({ description: "Total slots" })
  total_slots: number;

  @ApiProperty({ description: "Available slots" })
  available_slots: number;

  @ApiProperty({ description: "Booked slots" })
  booked_slots: number;

  @ApiProperty({ description: "Cancelled slots" })
  cancelled_slots: number;
}

export class GetAvailabilityResponseDto {
  @ApiProperty({ description: "Success status" })
  success: boolean;

  @ApiProperty({ description: "Response data" })
  data: {
    provider_id: string;
    availability_summary: AvailabilitySummaryDto;
    availability: DailyAvailabilityDto[];
  };
}

export class CreateAvailabilityResponseDto {
  @ApiProperty({ description: "Success status" })
  success: boolean;

  @ApiProperty({ description: "Response message" })
  message: string;

  @ApiProperty({ description: "Response data" })
  data: {
    availability_id: string;
    slots_created: number;
    date_range: {
      start: string;
      end: string;
    };
    total_appointments_available: number;
  };
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

export class SearchResultDto {
  @ApiProperty({ description: "Provider information" })
  provider: ProviderInfoDto;

  @ApiProperty({ description: "Available slots" })
  available_slots: AvailabilitySlotDto[];
}

export class SearchAvailabilityResponseDto {
  @ApiProperty({ description: "Success status" })
  success: boolean;

  @ApiProperty({ description: "Response data" })
  data: {
    search_criteria: {
      date?: string;
      specialization?: string;
      location?: string;
    };
    total_results: number;
    results: SearchResultDto[];
  };
}
