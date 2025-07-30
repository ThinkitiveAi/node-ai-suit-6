import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { ApiProperty } from "@nestjs/swagger";

export type PatientSessionDocument = PatientSession & Document;

@Schema({ timestamps: true })
export class DeviceInfo {
  @ApiProperty({ description: "Device type", example: "mobile" })
  @Prop()
  device_type: string;

  @ApiProperty({ description: "Device name", example: "iPhone 12" })
  @Prop()
  device_name: string;

  @ApiProperty({ description: "App version", example: "1.0.0" })
  @Prop()
  app_version: string;

  @ApiProperty({ description: "Operating system", example: "iOS 15.0" })
  @Prop()
  os_version: string;

  @ApiProperty({ description: "Browser information", example: "Safari/15.0" })
  @Prop()
  browser_info: string;

  @ApiProperty({
    description: "Device fingerprint",
    example: "unique-device-id",
  })
  @Prop()
  device_fingerprint: string;
}

@Schema({ timestamps: true })
export class LocationInfo {
  @ApiProperty({ description: "Country", example: "US" })
  @Prop()
  country: string;

  @ApiProperty({ description: "State/Province", example: "MA" })
  @Prop()
  state: string;

  @ApiProperty({ description: "City", example: "Boston" })
  @Prop()
  city: string;

  @ApiProperty({ description: "IP address", example: "192.168.1.1" })
  @Prop()
  ip_address: string;

  @ApiProperty({
    description: "Geographic coordinates",
    example: [42.3601, -71.0589],
  })
  @Prop()
  coordinates: number[];
}

@Schema({ timestamps: true })
export class PatientSession {
  @ApiProperty({ description: "Session ID" })
  _id: Types.ObjectId;

  @ApiProperty({ description: "Patient ID" })
  @Prop({ required: true, type: Types.ObjectId, ref: "Patient" })
  patient_id: Types.ObjectId;

  @ApiProperty({ description: "Hashed refresh token" })
  @Prop({ required: false })
  refresh_token_hash: string;

  @ApiProperty({ description: "Device information" })
  @Prop({ type: DeviceInfo })
  device_info: DeviceInfo;

  @ApiProperty({ description: "IP address", example: "192.168.1.1" })
  @Prop({ required: true })
  ip_address: string;

  @ApiProperty({ description: "User agent string" })
  @Prop({ required: true })
  user_agent: string;

  @ApiProperty({ description: "Session expiry timestamp" })
  @Prop({ required: true })
  expires_at: Date;

  @ApiProperty({ description: "Is session revoked" })
  @Prop({ default: false })
  is_revoked: boolean;

  @ApiProperty({ description: "Last used timestamp" })
  @Prop({ default: Date.now })
  last_used_at: Date;

  @ApiProperty({ description: "Location information" })
  @Prop({ type: LocationInfo })
  location_info?: LocationInfo;

  @ApiProperty({ description: "Session created timestamp" })
  createdAt: Date;

  @ApiProperty({ description: "Session updated timestamp" })
  updatedAt: Date;
}

export const PatientSessionSchema =
  SchemaFactory.createForClass(PatientSession);

// Add indexes for better query performance
PatientSessionSchema.index({ patient_id: 1 });
PatientSessionSchema.index({ refresh_token_hash: 1 });
PatientSessionSchema.index({ expires_at: 1 });
PatientSessionSchema.index({ is_revoked: 1 });
PatientSessionSchema.index({ ip_address: 1 });

// TTL index to automatically delete expired sessions
PatientSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
