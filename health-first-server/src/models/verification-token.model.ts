import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type VerificationTokenDocument = VerificationToken & Document;

export enum VerificationType {
  EMAIL = 'email',
  PHONE = 'phone'
}

@Schema({ timestamps: true })
export class VerificationToken {
  @ApiProperty({ description: 'Verification token ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'Patient ID' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'Patient' })
  patient_id: Types.ObjectId;

  @ApiProperty({ description: 'Verification token' })
  @Prop({ required: true, unique: true })
  token: string;

  @ApiProperty({ description: 'Verification type' })
  @Prop({ required: true, enum: VerificationType })
  type: VerificationType;

  @ApiProperty({ description: 'Token expiry timestamp' })
  @Prop({ required: true })
  expires_at: Date;

  @ApiProperty({ description: 'Token usage count' })
  @Prop({ default: 0 })
  usage_count: number;

  @ApiProperty({ description: 'Maximum allowed usage' })
  @Prop({ default: 1 })
  max_usage: number;

  @ApiProperty({ description: 'Is token used' })
  @Prop({ default: false })
  is_used: boolean;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

export const VerificationTokenSchema = SchemaFactory.createForClass(VerificationToken);

// Add indexes for better query performance
VerificationTokenSchema.index({ patient_id: 1 });
VerificationTokenSchema.index({ token: 1 });
VerificationTokenSchema.index({ type: 1 });
VerificationTokenSchema.index({ expires_at: 1 });
VerificationTokenSchema.index({ is_used: 1 });

// TTL index to automatically delete expired tokens
VerificationTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); 