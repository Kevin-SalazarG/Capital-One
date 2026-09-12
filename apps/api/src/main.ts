import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { configureAppModule } from "./app.module.js";
import { readConfig } from "./config/app-config.js";
import { configureApplication } from "./configure-app.js";
import { logger } from "./platform/logging/request-logging.js";

try {
  const config = readConfig(process.env);
  const app = await NestFactory.create<NestExpressApplication>(configureAppModule(config), {
    bodyParser: false,
    logger: false,
  });
  configureApplication(app, config.TRUST_PROXY_HOPS);
  await app.listen(config.PORT, "0.0.0.0");
  logger.info({ port: config.PORT, bankingSource: config.BANKING_MODE }, "server.started");
} catch {
  logger.error("Server startup failed; verify configuration and dependency access.");
  process.exitCode = 1;
}
