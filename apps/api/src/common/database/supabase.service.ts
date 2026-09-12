import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  readPublicSupabaseKey,
  readSecretSupabaseKey,
  type AppEnvironment,
} from "../../config/app-config";
import type { Database } from "./database.types";

export type TypedSupabaseClient = SupabaseClient<Database>;

@Injectable()
export class SupabaseService {
  public readonly publicClient: TypedSupabaseClient;
  public readonly adminClient: TypedSupabaseClient;

  private readonly url: string;
  private readonly publishableKey: string;

  public constructor(
    @Inject(ConfigService) config: ConfigService<AppEnvironment>,
  ) {
    this.url = config.getOrThrow<string>("SUPABASE_URL");
    this.publishableKey = readPublicSupabaseKey(config);
    const secretKey = readSecretSupabaseKey(config);

    this.publicClient = createClient<Database>(this.url, this.publishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    this.adminClient = createClient<Database>(this.url, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  public createUserClient(accessToken: string): TypedSupabaseClient {
    return createClient<Database>(this.url, this.publishableKey, {
      accessToken: async () => accessToken,
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
}
