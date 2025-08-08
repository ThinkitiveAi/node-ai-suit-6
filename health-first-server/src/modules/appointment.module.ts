import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AppointmentController } from "../controllers/appointment.controller";
import { AppointmentService } from "../services/appointment.service";
import {
  AppointmentSlot,
  AppointmentSlotSchema,
} from "../models/appointment-slot.model";
import { Provider, ProviderSchema } from "../models/provider.model";
import { Patient, PatientSchema } from "../models/patient.model";
import {
  ProviderAvailability,
  ProviderAvailabilitySchema,
} from "../models/provider-availability.model";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppointmentSlot.name, schema: AppointmentSlotSchema },
      { name: Provider.name, schema: ProviderSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: ProviderAvailability.name, schema: ProviderAvailabilitySchema },
    ]),
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
