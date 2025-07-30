import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { Provider, ProviderSchema } from '../models/provider.model';
import { RefreshToken, RefreshTokenSchema } from '../models/refresh-token.model';
import { BruteForceMiddleware } from '../middlewares/brute-force.middleware';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Provider.name, schema: ProviderSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema }
    ])
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService]
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BruteForceMiddleware)
      .forRoutes({ path: 'v1/provider/login', method: RequestMethod.POST });
  }
} 