import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({ timestamps: true })
export class RefreshToken {
  @ApiProperty({ description: 'Refresh token ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'Provider ID' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'Provider' })
  provider_id: Types.ObjectId;

  @ApiProperty({ description: 'Hashed refresh token' })
  @Prop({ required: true })
  token_hash: string;

  @ApiProperty({ description: 'Token expiry timestamp' })
  @Prop({ required: true })
  expires_at: Date;

  @ApiProperty({ description: 'Token revocation status' })
  @Prop({ default: false })
  is_revoked: boolean;

  @ApiProperty({ description: 'Last used timestamp' })
  @Prop({ required: false })
  last_used_at?: Date;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Add indexes for better query performance
RefreshTokenSchema.index({ provider_id: 1 });
RefreshTokenSchema.index({ token_hash: 1 });
RefreshTokenSchema.index({ expires_at: 1 });
RefreshTokenSchema.index({ is_revoked: 1 }); 