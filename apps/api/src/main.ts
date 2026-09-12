import "reflect-metadata";

import cookieParser from "cookie-parser";
import helmet from "helmet";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";

import { AppModule } from "./app.module";
import type { AppEnvironment } from "./config/app-config";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService<AppEnvironment>);
  const apiPrefix = config.getOrThrow<string>("API_PREFIX");
  const origin = config.getOrThrow<string>("APP_ORIGIN");

  app.use(cookieParser());
  app.use(helmet());
  app.enableCors({
    origin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  });
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableShutdownHooks();

  await app.listen(config.getOrThrow<number>("PORT"));
}

void bootstrap();
