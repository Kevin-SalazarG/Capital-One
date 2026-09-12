import { StandardSchemaSerializerInterceptor, StandardSchemaValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { SafeExceptionFilter } from "./platform/http/exception-filter.js";
import { requestLogging } from "./platform/logging/request-logging.js";
import { createRateLimiter } from "./platform/security/rate-limit.js";

export function configureApplication(
  app: NestExpressApplication,
  trustProxyHops: number,
): INestApplication {
  app.set("trust proxy", trustProxyHops);
  app.useBodyParser("json", { limit: "256kb" });
  app.use(helmet());
  app.use(requestLogging);
  app.use(createRateLimiter());
  app.setGlobalPrefix("v1");
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.useGlobalInterceptors(new StandardSchemaSerializerInterceptor(app.get<Reflector>(Reflector)));
  app.useGlobalFilters(new SafeExceptionFilter());
  app.enableShutdownHooks();
  return app;
}
