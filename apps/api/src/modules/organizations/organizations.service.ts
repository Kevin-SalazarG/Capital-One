import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../../common/audit/audit.service";
import { AppError } from "../../common/errors/app-error";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import type { CreateOrganizationDto } from "./dto/create-organization.dto";
import type { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { OrganizationsRepository } from "./organizations.repository";

@Injectable()
export class OrganizationsService {
  public constructor(
    @Inject(OrganizationsRepository)
    private readonly repository: OrganizationsRepository,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  public async create(
    input: CreateOrganizationDto,
    user: AuthenticatedUser,
    accessToken: string,
  ) {
    const organization = await this.repository.create(
      input,
      user.id,
      accessToken,
    );
    await this.audit.record(accessToken, {
      organizationId: organization.id,
      actorUserId: user.id,
      action: "organization.created",
      resourceType: "organization",
      resourceId: organization.id,
    });
    return organization;
  }

  public list(user: AuthenticatedUser, accessToken: string) {
    return this.repository.listForUser(user.id, accessToken);
  }

  public getById(organizationId: string, accessToken: string) {
    return this.repository.getById(organizationId, accessToken);
  }

  public async update(
    organizationId: string,
    user: AuthenticatedUser,
    accessToken: string,
    input: UpdateOrganizationDto,
  ) {
    if (Object.keys(input).length === 0) {
      throw new AppError("At least one organization field must be updated", {
        code: "VALIDATION_FAILED",
        status: 400,
      });
    }
    const organization = await this.repository.update(
      organizationId,
      accessToken,
      input,
    );
    await this.audit.record(accessToken, {
      organizationId,
      actorUserId: user.id,
      action: "organization.updated",
      resourceType: "organization",
      resourceId: organizationId,
      metadata: { fields: Object.keys(input) },
    });
    return organization;
  }
}
