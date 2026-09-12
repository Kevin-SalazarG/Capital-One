import type { ConfigService } from "@nestjs/config";
import { NessieClient, type NessieOptions } from "nessie-node-sdk";

import type { AppEnvironment } from "../../../config/app-config";

export const NESSIE_CLIENT = Symbol("NESSIE_CLIENT");

export function createNessieClient(
  config: ConfigService<AppEnvironment>,
): NessieClient {
  const options: NessieOptions = {
    apiKey: config.getOrThrow<string>("NESSIE_API_KEY"),
    baseUrl: config.getOrThrow<string>("NESSIE_BASE_URL"),
    timeoutMs: config.getOrThrow<number>("NESSIE_TIMEOUT_MS"),
    maxRetries: config.getOrThrow<number>("NESSIE_MAX_RETRIES"),
  };
  return new NessieClient(options);
}
