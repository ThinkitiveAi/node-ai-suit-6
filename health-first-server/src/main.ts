import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const SWAGGER_API_ROOT = 'api/docs';
  const SWAGGER_API_NAME = 'API';
  const SWAGGER_API_DESCRIPTION = 'IMH HealthCare';
  const SWAGGER_API_CURRENT_VERSION = '1.0';

  const app = await NestFactory.create(AppModule, {
    logger: ['debug', 'error', 'log', 'warn', 'verbose', 'fatal'],
  });

  app.setGlobalPrefix('api');
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({
    origin: true,
    methods: 'GET, PUT, POST, DELETE, OPTIONS, PATCH',
    credentials: true,
  });
  app.enableShutdownHooks();

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const options = new DocumentBuilder()
    .setTitle(SWAGGER_API_NAME)
    .setDescription(SWAGGER_API_DESCRIPTION)
    .setVersion(SWAGGER_API_CURRENT_VERSION)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(SWAGGER_API_ROOT, app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation is available at: http://localhost:${port}/${SWAGGER_API_ROOT}`);
}
bootstrap(); 