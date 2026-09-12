import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../../common/audit/audit.service";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import type { InviteMemberDto } from "./dto/invite-member.dto";
import { MembersRepository } from "./members.repository";

@Injectable()
export class MembersService {
  public constructor(
    @Inject(MembersRepository) private readonly repository: MembersRepository,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  public list(organizationId: string, accessToken: string) {
    return this.repository.list(organizationId, accessToken);
  }

  public async invite(
    organizationId: string,
    user: AuthenticatedUser,
    accessToken: string,
    input: InviteMemberDto,
  ) {
    const member = await this.repository.invite(
      organizationId,
      user.id,
      accessToken,
      input,
    );
    await this.audit.record(accessToken, {
      organizationId,
      actorUserId: user.id,
      action: "member.invited",
      resourceType: "organization_member",
      resourceId: member.id,
      metadata: { role: member.role },
    });
    return member;
  }

  public async updateRole(
    organizationId: string,
    userId: string,
    actor: AuthenticatedUser,
    accessToken: string,
    role: "admin" | "analyst" | "viewer",
  ) {
    const member = await this.repository.updateRole(
      organizationId,
      userId,
      accessToken,
      role,
    );
    await this.audit.record(accessToken, {
      organizationId,
      actorUserId: actor.id,
      action: "member.role_updated",
      resourceType: "organization_member",
      resourceId: member.id,
      metadata: { targetUserId: userId, role },
    });
    return member;
  }

  public async remove(
    organizationId: string,
    userId: string,
    actor: AuthenticatedUser,
    accessToken: string,
  ) {
    const result = await this.repository.remove(
      organizationId,
      userId,
      accessToken,
    );
    await this.audit.record(accessToken, {
      organizationId,
      actorUserId: actor.id,
      action: "member.removed",
      resourceType: "organization_member",
      resourceId: userId,
    });
    return result;
  }
}
