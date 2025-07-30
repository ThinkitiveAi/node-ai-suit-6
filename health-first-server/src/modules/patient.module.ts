import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientController } from '../controllers/patient.controller';
import { PatientService } from '../services/patient.service';
import { Patient, PatientSchema } from '../models/patient.model';
import { VerificationToken, VerificationTokenSchema } from '../models/verification-token.model';
import { RateLimitingMiddleware } from '../middlewares/rate-limiting.middleware';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: VerificationToken.name, schema: VerificationTokenSchema }
    ])
  ],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService]
})
export class PatientModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimitingMiddleware)
      .forRoutes({ path: 'v1/patient/register', method: RequestMethod.POST });
  }
} 