import { Inject, Injectable } from "@nestjs/common";

import type { JsonValue } from "../types/json-value";
import { throwDatabaseError } from "../errors/supabase-error";
import { SupabaseService } from "../database/supabase.service";

export interface AuditRecord {
  readonly organizationId: string | null;
  readonly actorUserId: string | null;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId?: string | null;
  readonly metadata?: JsonValue;
  readonly requestId?: string | null;
}

@Injectable()
export class AuditService {
  public constructor(
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}

  public async record(accessToken: string, event: AuditRecord): Promise<void> {
    const { error } = await this.supabase
      .createUserClient(accessToken)
      .from("audit_events")
      .insert({
        organization_id: event.organizationId,
        actor_user_id: event.actorUserId,
        action: event.action,
        resource_type: event.resourceType,
        resource_id: event.resourceId ?? null,
        metadata: event.metadata ?? {},
        request_id: event.requestId ?? null,
      });
    if (error) {
      throwDatabaseError(error, "write audit event");
    }
  }
}
