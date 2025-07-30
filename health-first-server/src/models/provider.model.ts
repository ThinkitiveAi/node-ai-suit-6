import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ProviderDocument = Provider & Document;

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class ClinicAddress {
  @ApiProperty({ description: 'Street address', example: '123 Medical Center Dr' })
  @Prop({ required: true, maxlength: 200 })
  street: string;

  @ApiProperty({ description: 'City', example: 'New York' })
  @Prop({ required: true, maxlength: 100 })
  city: string;

  @ApiProperty({ description: 'State', example: 'NY' })
  @Prop({ required: true, maxlength: 50 })
  state: string;

  @ApiProperty({ description: 'ZIP code', example: '10001' })
  @Prop({ required: true })
  zip: string;
}

@Schema({ timestamps: true })
export class Provider {
  @ApiProperty({ description: 'Provider ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'First name', example: 'John' })
  @Prop({ required: true, minlength: 2, maxlength: 50, trim: true })
  first_name: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @Prop({ required: true, minlength: 2, maxlength: 50, trim: true })
  last_name: string;

  @ApiProperty({ description: 'Email address', example: 'john.doe@clinic.com' })
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @ApiProperty({ description: 'Phone number', example: '+1234567890' })
  @Prop({ required: true, trim: true })
  phone_number: string;

  @ApiProperty({ description: 'Hashed password' })
  @Prop({ required: true })
  password_hash: string;

  @ApiProperty({ description: 'Medical specialization', example: 'Cardiology' })
  @Prop({ required: true, minlength: 3, maxlength: 100, trim: true })
  specialization: string;

  @ApiProperty({ description: 'License number', example: 'MD123456789' })
  @Prop({ required: true, trim: true })
  license_number: string;

  @ApiProperty({ description: 'Years of experience', example: 10 })
  @Prop({ required: true, min: 0, max: 50 })
  years_of_experience: number;

  @ApiProperty({ description: 'Clinic address' })
  @Prop({ required: true, type: ClinicAddress })
  clinic_address: ClinicAddress;

  @ApiProperty({ description: 'Verification status', enum: VerificationStatus })
  @Prop({ 
    required: true, 
    enum: VerificationStatus, 
    default: VerificationStatus.PENDING 
  })
  verification_status: VerificationStatus;

  @ApiProperty({ description: 'License document URL', required: false })
  @Prop({ required: false })
  license_document_url?: string;

  @ApiProperty({ description: 'Active status' })
  @Prop({ default: true })
  is_active: boolean;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Last login timestamp' })
  @Prop({ required: false })
  last_login?: Date;

  @ApiProperty({ description: 'Failed login attempts count' })
  @Prop({ default: 0 })
  failed_login_attempts: number;

  @ApiProperty({ description: 'Account locked until timestamp' })
  @Prop({ required: false })
  locked_until?: Date;

  @ApiProperty({ description: 'Total login count' })
  @Prop({ default: 0 })
  login_count: number;
}

export const ProviderSchema = SchemaFactory.createForClass(Provider);

// Add indexes for better query performance
ProviderSchema.index({ email: 1 });
ProviderSchema.index({ phone_number: 1 });
ProviderSchema.index({ license_number: 1 });
ProviderSchema.index({ verification_status: 1 });
ProviderSchema.index({ is_active: 1 }); 