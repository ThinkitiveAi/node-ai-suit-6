import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ProviderAvailabilityDocument = ProviderAvailability & Document;

export enum RecurrencePattern {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum SlotStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked',
  MAINTENANCE = 'maintenance',
}

export enum AppointmentType {
  CONSULTATION = 'consultation',
  FOLLOW_UP = 'follow_up',
  EMERGENCY = 'emergency',
  TELEMEDICINE = 'telemedicine',
}

export enum LocationType {
  CLINIC = 'clinic',
  HOSPITAL = 'hospital',
  TELEMEDICINE = 'telemedicine',
  HOME_VISIT = 'home_visit',
}

@Schema({ timestamps: true })
export class Location {
  @ApiProperty({ description: 'Location type', enum: LocationType })
  @Prop({ required: true, enum: LocationType })
  type: LocationType;

  @ApiProperty({ description: 'Address for physical location', required: false })
  @Prop({ required: false, maxlength: 500 })
  address?: string;

  @ApiProperty({ description: 'Room number', required: false })
  @Prop({ required: false, maxlength: 50 })
  room_number?: string;
}

@Schema({ timestamps: true })
export class Pricing {
  @ApiProperty({ description: 'Base fee for appointment' })
  @Prop({ required: true, min: 0 })
  base_fee: number;

  @ApiProperty({ description: 'Whether insurance is accepted' })
  @Prop({ required: true, default: false })
  insurance_accepted: boolean;

  @ApiProperty({ description: 'Currency code', default: 'USD' })
  @Prop({ required: true, default: 'USD', maxlength: 3 })
  currency: string;
}

@Schema({ timestamps: true })
export class ProviderAvailability {
  @ApiProperty({ description: 'Availability ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'Provider ID' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'Provider' })
  provider_id: Types.ObjectId;

  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  @Prop({ required: true })
  date: string;

  @ApiProperty({ description: 'Start time in HH:mm format (24-hour)' })
  @Prop({ required: true })
  start_time: string;

  @ApiProperty({ description: 'End time in HH:mm format (24-hour)' })
  @Prop({ required: true })
  end_time: string;

  @ApiProperty({ description: 'Timezone', example: 'America/New_York' })
  @Prop({ required: true })
  timezone: string;

  @ApiProperty({ description: 'Whether this is a recurring slot' })
  @Prop({ required: true, default: false })
  is_recurring: boolean;

  @ApiProperty({ description: 'Recurrence pattern', enum: RecurrencePattern, required: false })
  @Prop({ required: false, enum: RecurrencePattern })
  recurrence_pattern?: RecurrencePattern;

  @ApiProperty({ description: 'Recurrence end date', required: false })
  @Prop({ required: false })
  recurrence_end_date?: string;

  @ApiProperty({ description: 'Slot duration in minutes', default: 30 })
  @Prop({ required: true, default: 30, min: 15, max: 480 })
  slot_duration: number;

  @ApiProperty({ description: 'Break duration in minutes', default: 0 })
  @Prop({ required: true, default: 0, min: 0, max: 120 })
  break_duration: number;

  @ApiProperty({ description: 'Slot status', enum: SlotStatus, default: 'available' })
  @Prop({ required: true, enum: SlotStatus, default: SlotStatus.AVAILABLE })
  status: SlotStatus;

  @ApiProperty({ description: 'Maximum appointments per slot', default: 1 })
  @Prop({ required: true, default: 1, min: 1, max: 10 })
  max_appointments_per_slot: number;

  @ApiProperty({ description: 'Current appointments count', default: 0 })
  @Prop({ required: true, default: 0, min: 0 })
  current_appointments: number;

  @ApiProperty({ description: 'Appointment type', enum: AppointmentType, default: 'consultation' })
  @Prop({ required: true, enum: AppointmentType, default: AppointmentType.CONSULTATION })
  appointment_type: AppointmentType;

  @ApiProperty({ description: 'Location information' })
  @Prop({ required: true, type: Location })
  location: Location;

  @ApiProperty({ description: 'Pricing information', required: false })
  @Prop({ required: false, type: Pricing })
  pricing?: Pricing;

  @ApiProperty({ description: 'Additional notes', maxLength: 500 })
  @Prop({ required: false, maxlength: 500 })
  notes?: string;

  @ApiProperty({ description: 'Special requirements', type: [String] })
  @Prop({ required: false, type: [String] })
  special_requirements?: string[];

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

export const ProviderAvailabilitySchema = SchemaFactory.createForClass(ProviderAvailability);

// Add indexes for better query performance
ProviderAvailabilitySchema.index({ provider_id: 1, date: 1 });
ProviderAvailabilitySchema.index({ provider_id: 1, status: 1 });
ProviderAvailabilitySchema.index({ date: 1, status: 1 });
ProviderAvailabilitySchema.index({ appointment_type: 1 });
ProviderAvailabilitySchema.index({ 'location.type': 1 });
ProviderAvailabilitySchema.index({ is_recurring: 1 });
ProviderAvailabilitySchema.index({ createdAt: 1 }); 