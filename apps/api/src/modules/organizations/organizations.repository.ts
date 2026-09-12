import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";

import { AppError } from "../../common/errors/app-error";
import {
  assertDatabaseResult,
  throwDatabaseError,
} from "../../common/errors/supabase-error";
import { SupabaseService } from "../../common/database/supabase.service";
import type { OrganizationRow } from "../../common/database/database.types";
import {
  ROLE_PERMISSIONS,
  type OrganizationRole,
  type Permission,
} from "../../common/authorization/permission";
import type { CreateOrganizationDto } from "./dto/create-organization.dto";
import type { UpdateOrganizationDto } from "./dto/update-organization.dto";

@Injectable()
export class OrganizationsRepository {
  public constructor(
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}

  public async create(
    input: CreateOrganizationDto,
    userId: string,
    accessToken: string,
  ): Promise<OrganizationRow> {
    const client = this.supabase.createUserClient(accessToken);
    const organizationId = randomUUID();
    const { error: organizationError } = await client
      .from("organizations")
      .insert({
        id: organizationId,
        name: input.name,
        legal_name: input.legalName ?? null,
        rfc: input.rfc ?? null,
        currency: input.currency ?? "MXN",
        time_zone: input.timeZone ?? "America/Mexico_City",
        minimum_cash_reserve: input.minimumCashReserve ?? "0.00",
        daily_operating_expense: input.dailyOperatingExpense ?? "0.00",
        created_by: userId,
      });
    if (organizationError) {
      throwDatabaseError(organizationError, "create organization");
    }

    const { error: membershipError } = await client
      .from("organization_members")
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role: "owner",
        status: "active",
        joined_at: new Date().toISOString(),
      });
    if (membershipError) {
      await this.supabase.adminClient
        .from("organizations")
        .delete()
        .eq("id", organizationId)
        .eq("created_by", userId);
      throwDatabaseError(
        membershipError,
        "create organization owner membership",
      );
    }

    const { data, error } = await client
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();
    return assertDatabaseResult(data, error, "read created organization");
  }

  public async listForUser(
    userId: string,
    accessToken: string,
  ): Promise<
    (OrganizationRow & {
      role: OrganizationRole;
      permissions: readonly Permission[];
    })[]
  > {
    const client = this.supabase.createUserClient(accessToken);
    const { data: memberships, error: membershipError } = await client
      .from("organization_members")
      .select("organization_id,role")
      .eq("user_id", userId)
      .eq("status", "active");
    if (membershipError) {
      throwDatabaseError(membershipError, "list organization memberships");
    }

    const organizationIds = memberships.map(
      (membership) => membership.organization_id,
    );
    if (organizationIds.length === 0) {
      return [];
    }

    const { data, error } = await client
      .from("organizations")
      .select("*")
      .in("id", organizationIds)
      .order("created_at", { ascending: true });
    if (error) {
      throwDatabaseError(error, "list organizations");
    }

    return data.flatMap((organization) => {
      const membership = memberships.find(
        (member) => member.organization_id === organization.id,
      );
      return membership
        ? [
            {
              ...organization,
              role: membership.role,
              permissions: ROLE_PERMISSIONS[membership.role],
            },
          ]
        : [];
    });
  }

  public async update(
    organizationId: string,
    accessToken: string,
    input: UpdateOrganizationDto,
  ): Promise<OrganizationRow> {
    const updates = {
      ...(input.dailyOperatingExpense !== undefined
        ? { daily_operating_expense: input.dailyOperatingExpense }
        : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.legalName !== undefined ? { legal_name: input.legalName } : {}),
      ...(input.rfc !== undefined ? { rfc: input.rfc } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.timeZone !== undefined ? { time_zone: input.timeZone } : {}),
      ...(input.minimumCashReserve !== undefined
        ? { minimum_cash_reserve: input.minimumCashReserve }
        : {}),
    };
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("organizations")
      .update(updates)
      .eq("id", organizationId)
      .select("*")
      .maybeSingle();
    if (error) {
      throwDatabaseError(error, "update organization");
    }
    return assertDatabaseResult(data, null, "update organization");
  }

  public async getById(
    organizationId: string,
    accessToken: string,
  ): Promise<OrganizationRow> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .maybeSingle();
    if (error) {
      throwDatabaseError(error, "get organization");
    }
    if (!data) {
      throw new AppError("Organization not found", {
        code: "ORGANIZATION_NOT_FOUND",
        status: 404,
      });
    }

    return data;
  }
}
