import { Global, Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";
import { APP_CONFIG } from "../config/app-config.js";
import type { AppConfig } from "../config/app-config.js";
import { DatabaseService } from "./database/database.service.js";

@Global()
@Module({})
export class PlatformModule {}

export function configurePlatformModule(config: AppConfig): DynamicModule {
  return {
    module: PlatformModule,
    providers: [{ provide: APP_CONFIG, useValue: config }, DatabaseService],
    exports: [APP_CONFIG, DatabaseService],
  };
}
