import { Inject, Injectable } from "@nestjs/common";

import { AppError } from "../errors/app-error";
import { SupabaseService } from "../database/supabase.service";
import type { AuthenticatedUser } from "./authenticated-user";

@Injectable()
export class SupabaseAuthService {
  public constructor(
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}

  public async authenticate(accessToken: string): Promise<AuthenticatedUser> {
    const { data, error } =
      await this.supabase.publicClient.auth.getUser(accessToken);
    if (error || !data.user) {
      throw new AppError("The access token is invalid or expired", {
        code: "UNAUTHENTICATED",
        status: 401,
        cause: error,
      });
    }

    return {
      id: data.user.id,
      email: data.user.email ?? null,
    };
  }
}
