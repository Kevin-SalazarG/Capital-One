import { Inject, Injectable } from "@nestjs/common";

import {
  assertDatabaseResult,
  throwDatabaseError,
} from "../../common/errors/supabase-error";
import { SupabaseService } from "../../common/database/supabase.service";
import type { RecurringObligationRow } from "../../common/database/database.types";
import type { CreateRecurringObligationDto } from "./dto/create-recurring-obligation.dto";

@Injectable()
export class ObligationsRepository {
  public constructor(
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}

  public async create(
    organizationId: string,
    userId: string,
    accessToken: string,
    input: CreateRecurringObligationDto,
  ): Promise<RecurringObligationRow> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("recurring_obligations")
      .insert({
        organization_id: organizationId,
        name: input.name,
        amount: input.amount,
        currency: input.currency,
        frequency: input.frequency,
        next_due_on: input.nextDueOn,
        metadata: {
          category: input.category,
          critical:
            input.critical ||
            input.category === "payroll" ||
            input.category === "tax",
        },
        created_by: userId,
      })
      .select("*")
      .single();
    return assertDatabaseResult(data, error, "create recurring obligation");
  }

  public async listActive(
    organizationId: string,
    accessToken: string,
  ): Promise<RecurringObligationRow[]> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("recurring_obligations")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .order("next_due_on", { ascending: true });
    if (error) {
      throwDatabaseError(error, "list recurring obligations");
    }
    return data;
  }
}
