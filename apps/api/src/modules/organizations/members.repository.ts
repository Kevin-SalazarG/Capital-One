import { Inject, Injectable } from "@nestjs/common";

import { AppError } from "../../common/errors/app-error";
import {
  assertDatabaseResult,
  throwDatabaseError,
} from "../../common/errors/supabase-error";
import { SupabaseService } from "../../common/database/supabase.service";
import type { OrganizationMemberRow } from "../../common/database/database.types";
import type { InviteMemberDto } from "./dto/invite-member.dto";

@Injectable()
export class MembersRepository {
  public constructor(
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}

  public async list(
    organizationId: string,
    accessToken: string,
  ): Promise<OrganizationMemberRow[]> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true });
    if (error) {
      throwDatabaseError(error, "list organization members");
    }
    return data;
  }

  public async invite(
    organizationId: string,
    invitedBy: string,
    accessToken: string,
    input: InviteMemberDto,
  ): Promise<OrganizationMemberRow> {
    const { data: invitedUser, error: inviteError } =
      await this.supabase.adminClient.auth.admin.inviteUserByEmail(input.email);
    if (inviteError || !invitedUser.user) {
      throw new AppError("The member invitation could not be sent", {
        code: "CONFLICT",
        status: 409,
        cause: inviteError,
      });
    }

    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("organization_members")
      .insert({
        organization_id: organizationId,
        user_id: invitedUser.user.id,
        role: input.role,
        status: "invited",
        invited_by: invitedBy,
        invited_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    return assertDatabaseResult(
      data,
      error,
      "create invited organization member",
    );
  }

  public async updateRole(
    organizationId: string,
    userId: string,
    accessToken: string,
    role: "admin" | "analyst" | "viewer",
  ): Promise<OrganizationMemberRow> {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client
      .from("organization_members")
      .update({ role })
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .neq("role", "owner")
      .select("*")
      .maybeSingle();
    if (error) {
      throwDatabaseError(error, "update organization member role");
    }
    return assertDatabaseResult(data, null, "update organization member role");
  }

  public async remove(
    organizationId: string,
    userId: string,
    accessToken: string,
  ): Promise<{ readonly removed: true }> {
    const client = this.supabase.createUserClient(accessToken);
    const { data: target, error: targetError } = await client
      .from("organization_members")
      .select("role,status")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (targetError) {
      throwDatabaseError(targetError, "get member before removal");
    }
    if (!target) {
      throw new AppError("Organization member not found", {
        code: "RESOURCE_NOT_FOUND",
        status: 404,
      });
    }
    if (target.role === "owner") {
      const { count, error: ownerCountError } = await client
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("role", "owner")
        .eq("status", "active");
      if (ownerCountError) {
        throwDatabaseError(ownerCountError, "count organization owners");
      }
      if ((count ?? 0) <= 1) {
        throw new AppError("The last organization owner cannot be removed", {
          code: "CONFLICT",
          status: 409,
        });
      }
    }

    const { error } = await client
      .from("organization_members")
      .delete()
      .eq("organization_id", organizationId)
      .eq("user_id", userId);
    if (error) {
      throwDatabaseError(error, "remove organization member");
    }
    return { removed: true };
  }
}
