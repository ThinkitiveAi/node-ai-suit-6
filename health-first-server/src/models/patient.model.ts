import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PatientDocument = Patient & Document;

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say'
}

@Schema({ timestamps: true })
export class Address {
  @ApiProperty({ 
    description: 'Street address', 
    example: '456 Main Street',
    maxLength: 200
  })
  @Prop({ required: true, maxlength: 200 })
  street: string;

  @ApiProperty({ 
    description: 'City', 
    example: 'Boston',
    maxLength: 100
  })
  @Prop({ required: true, maxlength: 100 })
  city: string;

  @ApiProperty({ 
    description: 'State', 
    example: 'MA',
    maxLength: 50
  })
  @Prop({ required: true, maxlength: 50 })
  state: string;

  @ApiProperty({ 
    description: 'ZIP code', 
    example: '02101',
    pattern: '^[0-9]{5}(-[0-9]{4})?$'
  })
  @Prop({ required: true })
  zip: string;
}

@Schema({ timestamps: true })
export class EmergencyContact {
  @ApiProperty({ 
    description: 'Emergency contact name', 
    example: 'John Smith',
    maxLength: 100
  })
  @Prop({ maxlength: 100 })
  name: string;

  @ApiProperty({ 
    description: 'Emergency contact phone', 
    example: '+1234567891',
    pattern: '^\\+[1-9]\\d{1,14}$'
  })
  @Prop()
  phone: string;

  @ApiProperty({ 
    description: 'Relationship to patient', 
    example: 'spouse',
    maxLength: 50
  })
  @Prop({ maxlength: 50 })
  relationship: string;
}

@Schema({ timestamps: true })
export class InsuranceInfo {
  @ApiProperty({ 
    description: 'Insurance provider', 
    example: 'Blue Cross'
  })
  @Prop()
  provider: string;

  @ApiProperty({ 
    description: 'Policy number (encrypted)', 
    example: 'BC123456789'
  })
  @Prop()
  policy_number: string;
}

@Schema({ timestamps: true })
export class Patient {
  @ApiProperty({ description: 'Patient ID' })
  _id: Types.ObjectId;

  @ApiProperty({ 
    description: 'First name', 
    example: 'Jane',
    minLength: 2,
    maxLength: 50
  })
  @Prop({ required: true, minlength: 2, maxlength: 50, trim: true })
  first_name: string;

  @ApiProperty({ 
    description: 'Last name', 
    example: 'Smith',
    minLength: 2,
    maxLength: 50
  })
  @Prop({ required: true, minlength: 2, maxlength: 50, trim: true })
  last_name: string;

  @ApiProperty({ 
    description: 'Email address', 
    example: 'jane.smith@email.com'
  })
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @ApiProperty({ 
    description: 'Phone number', 
    example: '+1234567890'
  })
  @Prop({ required: true, unique: true, trim: true })
  phone_number: string;

  @ApiProperty({ description: 'Hashed password' })
  @Prop({ required: true })
  password_hash: string;

  @ApiProperty({ 
    description: 'Date of birth', 
    example: '1990-05-15'
  })
  @Prop({ required: true })
  date_of_birth: Date;

  @ApiProperty({ 
    description: 'Gender', 
    enum: Gender,
    example: 'female'
  })
  @Prop({ required: true, enum: Gender })
  gender: Gender;

  @ApiProperty({ description: 'Patient address' })
  @Prop({ required: true, type: Address })
  address: Address;

  @ApiProperty({ description: 'Emergency contact information' })
  @Prop({ required: false, type: EmergencyContact })
  emergency_contact?: EmergencyContact;

  @ApiProperty({ 
    description: 'Medical history', 
    example: ['Diabetes', 'Hypertension']
  })
  @Prop({ type: [String], default: [] })
  medical_history: string[];

  @ApiProperty({ description: 'Insurance information' })
  @Prop({ required: false, type: InsuranceInfo })
  insurance_info?: InsuranceInfo;

  @ApiProperty({ description: 'Email verification status' })
  @Prop({ default: false })
  email_verified: boolean;

  @ApiProperty({ description: 'Phone verification status' })
  @Prop({ default: false })
  phone_verified: boolean;

  @ApiProperty({ description: 'Account active status' })
  @Prop({ default: true })
  is_active: boolean;

  @ApiProperty({ description: 'Marketing communications opt-in' })
  @Prop({ default: false })
  marketing_opt_in: boolean;

  @ApiProperty({ description: 'Data retention consent' })
  @Prop({ default: false })
  data_retention_consent: boolean;

  @ApiProperty({ description: 'HIPAA consent' })
  @Prop({ default: false })
  hipaa_consent: boolean;

  @ApiProperty({ description: 'Last login timestamp' })
  @Prop()
  last_login: Date;

  @ApiProperty({ description: 'Login count' })
  @Prop({ default: 0 })
  login_count: number;

  @ApiProperty({ description: 'Failed login attempts' })
  @Prop({ default: 0 })
  failed_login_attempts: number;

  @ApiProperty({ description: 'Account locked until timestamp' })
  @Prop()
  locked_until: Date;

  @ApiProperty({ description: 'Last failed login attempt' })
  @Prop()
  last_failed_attempt: Date;

  @ApiProperty({ description: 'Suspicious activity score' })
  @Prop({ default: 0 })
  suspicious_activity_score: number;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);

// Add indexes for better query performance
PatientSchema.index({ email: 1 });
PatientSchema.index({ phone_number: 1 });
PatientSchema.index({ is_active: 1 });
PatientSchema.index({ createdAt: 1 });
PatientSchema.index({ email_verified: 1 });
PatientSchema.index({ phone_verified: 1 });

// Virtual for age calculation
PatientSchema.virtual('age').get(function() {
  if (!this.date_of_birth) return null;
  const today = new Date();
  const birthDate = new Date(this.date_of_birth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Ensure virtual fields are serialized
PatientSchema.set('toJSON', { virtuals: true });
PatientSchema.set('toObject', { virtuals: true }); 