import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProviderAvailabilityController, AvailabilitySearchController } from '../controllers/provider-availability.controller';
import { ProviderAvailabilityService } from '../services/provider-availability.service';
import { AvailabilityUtils } from '../utils/availability.utils';
import { 
  ProviderAvailability, 
  ProviderAvailabilitySchema 
} from '../models/provider-availability.model';
import { 
  AppointmentSlot, 
  AppointmentSlotSchema 
} from '../models/appointment-slot.model';
import { Provider, ProviderSchema } from '../models/provider.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProviderAvailability.name, schema: ProviderAvailabilitySchema },
      { name: AppointmentSlot.name, schema: AppointmentSlotSchema },
      { name: Provider.name, schema: ProviderSchema }
    ])
  ],
  controllers: [
    ProviderAvailabilityController,
    AvailabilitySearchController
  ],
  providers: [
    ProviderAvailabilityService,
    AvailabilityUtils
  ],
  exports: [
    ProviderAvailabilityService,
    AvailabilityUtils
  ]
})
export class ProviderAvailabilityModule {} 