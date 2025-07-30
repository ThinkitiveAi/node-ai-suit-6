import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type SecurityLogDocument = SecurityLog & Document;

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  SESSION_EXPIRED = 'session_expired',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  PASSWORD_CHANGED = 'password_changed',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DEVICE_VERIFICATION = 'device_verification',
  SESSION_REVOKED = 'session_revoked',
  REFRESH_TOKEN_USED = 'refresh_token_used',
  MULTI_FACTOR_AUTH = 'multi_factor_auth'
}

export enum SecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Schema({ timestamps: true })
export class SecurityLog {
  @ApiProperty({ description: 'Security log ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'Patient ID (optional for failed attempts)' })
  @Prop({ type: Types.ObjectId, ref: 'Patient' })
  patient_id?: Types.ObjectId;

  @ApiProperty({ description: 'Event type' })
  @Prop({ required: true, enum: SecurityEventType })
  event_type: SecurityEventType;

  @ApiProperty({ description: 'Security level' })
  @Prop({ required: true, enum: SecurityLevel })
  security_level: SecurityLevel;

  @ApiProperty({ description: 'IP address', example: '192.168.1.1' })
  @Prop({ required: true })
  ip_address: string;

  @ApiProperty({ description: 'User agent string' })
  @Prop()
  user_agent: string;

  @ApiProperty({ description: 'Device information' })
  @Prop({ type: Object })
  device_info?: any;

  @ApiProperty({ description: 'Location information' })
  @Prop({ type: Object })
  location_info?: any;

  @ApiProperty({ description: 'Event details' })
  @Prop({ type: Object })
  event_details?: any;

  @ApiProperty({ description: 'Risk score', example: 75 })
  @Prop({ default: 0 })
  risk_score: number;

  @ApiProperty({ description: 'Is suspicious activity' })
  @Prop({ default: false })
  is_suspicious: boolean;

  @ApiProperty({ description: 'Session ID (if applicable)' })
  @Prop({ type: Types.ObjectId, ref: 'PatientSession' })
  session_id?: Types.ObjectId;

  @ApiProperty({ description: 'Identifier used (email/phone)', example: 'jane.smith@email.com' })
  @Prop()
  identifier?: string;

  @ApiProperty({ description: 'Failure reason (for failed attempts)' })
  @Prop()
  failure_reason?: string;

  @ApiProperty({ description: 'Additional metadata' })
  @Prop({ type: Object })
  metadata?: any;

  @ApiProperty({ description: 'Log created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Log updated timestamp' })
  updatedAt: Date;
}

export const SecurityLogSchema = SchemaFactory.createForClass(SecurityLog);

// Add indexes for better query performance
SecurityLogSchema.index({ patient_id: 1 });
SecurityLogSchema.index({ event_type: 1 });
SecurityLogSchema.index({ security_level: 1 });
SecurityLogSchema.index({ ip_address: 1 });
SecurityLogSchema.index({ createdAt: 1 });
SecurityLogSchema.index({ is_suspicious: 1 });
SecurityLogSchema.index({ risk_score: 1 });

// TTL index to automatically delete old logs (retain for 7 years for HIPAA)
SecurityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 365 * 24 * 60 * 60 }); 