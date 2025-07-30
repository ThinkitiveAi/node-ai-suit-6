import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProviderController } from '../controllers/provider.controller';
import { ProviderService } from '../services/provider.service';
import { Provider, ProviderSchema } from '../models/provider.model';
import { RateLimitingMiddleware } from '../middlewares/rate-limiting.middleware';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Provider.name, schema: ProviderSchema }
    ])
  ],
  controllers: [ProviderController],
  providers: [ProviderService],
  exports: [ProviderService]
})
export class ProviderModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimitingMiddleware)
      .forRoutes({ path: 'v1/provider/register', method: RequestMethod.POST });
  }
} 