import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { databaseConfig } from "./config/database.config";
import { ProviderModule } from "./modules/provider.module";
import { AuthModule } from "./modules/auth.module";
import { PatientModule } from "./modules/patient.module";
import { PatientAuthModule } from "./modules/patient-auth.module";
import { ProviderAvailabilityModule } from "./modules/provider-availability.module";

console.log("mongoodo: ", databaseConfig.uri);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    MongooseModule.forRoot(
      "mongodb+srv://kalyani:12345@cluster0.re9v5m0.mongodb.net/"
    ),
    ProviderModule,
    AuthModule,
    PatientModule,
    PatientAuthModule,
    ProviderAvailabilityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
