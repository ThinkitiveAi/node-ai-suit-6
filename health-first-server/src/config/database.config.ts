import { MongooseModuleOptions } from "@nestjs/mongoose";

export const databaseConfig: any = {
  uri: process.env.MONGO_URI || "mongodb://localhost:27017/health_first_db",
};
