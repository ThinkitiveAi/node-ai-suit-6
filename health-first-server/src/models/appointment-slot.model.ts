import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type AppointmentSlotDocument = AppointmentSlot & Document;

export enum SlotStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked',
}

@Schema({ timestamps: true })
export class AppointmentSlot {
  @ApiProperty({ description: 'Slot ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'Availability ID reference' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'ProviderAvailability' })
  availability_id: Types.ObjectId;

  @ApiProperty({ description: 'Provider ID reference' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'Provider' })
  provider_id: Types.ObjectId;

  @ApiProperty({ description: 'Slot start time with timezone' })
  @Prop({ required: true })
  slot_start_time: Date;

  @ApiProperty({ description: 'Slot end time with timezone' })
  @Prop({ required: true })
  slot_end_time: Date;

  @ApiProperty({ description: 'Slot status', enum: SlotStatus })
  @Prop({ required: true, enum: SlotStatus, default: SlotStatus.AVAILABLE })
  status: SlotStatus;

  @ApiProperty({ description: 'Patient ID reference', required: false })
  @Prop({ required: false, type: Types.ObjectId, ref: 'Patient' })
  patient_id?: Types.ObjectId;

  @ApiProperty({ description: 'Appointment type' })
  @Prop({ required: true })
  appointment_type: string;

  @ApiProperty({ description: 'Unique booking reference' })
  @Prop({ required: true, unique: true })
  booking_reference: string;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

export const AppointmentSlotSchema = SchemaFactory.createForClass(AppointmentSlot);

// Add indexes for better query performance
AppointmentSlotSchema.index({ availability_id: 1 });
AppointmentSlotSchema.index({ provider_id: 1 });
AppointmentSlotSchema.index({ patient_id: 1 });
AppointmentSlotSchema.index({ status: 1 });
AppointmentSlotSchema.index({ slot_start_time: 1 });
AppointmentSlotSchema.index({ slot_end_time: 1 });
AppointmentSlotSchema.index({ booking_reference: 1 });
AppointmentSlotSchema.index({ createdAt: 1 }); 