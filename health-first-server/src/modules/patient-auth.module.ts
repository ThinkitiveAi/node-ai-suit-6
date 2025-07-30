import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PatientAuthController } from '../controllers/patient-auth.controller';
import { PatientAuthService } from '../services/patient-auth.service';
import { PatientJwtUtils } from '../utils/patient-jwt.utils';
import { Patient, PatientSchema } from '../models/patient.model';
import { PatientSession, PatientSessionSchema } from '../models/patient-session.model';
import { SecurityLog, SecurityLogSchema } from '../models/security-log.model';
import { PatientAuthMiddleware } from '../middlewares/patient-auth.middleware';
import { RateLimitingMiddleware } from '../middlewares/rate-limiting.middleware';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: PatientSession.name, schema: PatientSessionSchema },
      { name: SecurityLog.name, schema: SecurityLogSchema }
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: '30m',
          issuer: 'health-first-server',
          audience: 'patients'
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PatientAuthController],
  providers: [
    PatientAuthService,
    PatientJwtUtils
  ],
  exports: [PatientAuthService, PatientJwtUtils]
})
export class PatientAuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimitingMiddleware)
      .forRoutes(
        { path: 'v1/patient/login', method: RequestMethod.POST },
        { path: 'v1/patient/refresh', method: RequestMethod.POST }
      )
      .apply(PatientAuthMiddleware)
      .forRoutes(
        { path: 'v1/patient/logout-all', method: RequestMethod.POST },
        { path: 'v1/patient/sessions', method: RequestMethod.GET },
        { path: 'v1/patient/sessions/:sessionId', method: RequestMethod.DELETE }
      );
  }
} 