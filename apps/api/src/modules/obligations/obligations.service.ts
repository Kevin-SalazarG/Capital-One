import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../../common/audit/audit.service";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import type { CreateRecurringObligationDto } from "./dto/create-recurring-obligation.dto";
import { ObligationsRepository } from "./obligations.repository";

@Injectable()
export class ObligationsService {
  public constructor(
    @Inject(ObligationsRepository)
    private readonly repository: ObligationsRepository,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  public async create(
    organizationId: string,
    user: AuthenticatedUser,
    accessToken: string,
    input: CreateRecurringObligationDto,
  ) {
    const obligation = await this.repository.create(
      organizationId,
      user.id,
      accessToken,
      input,
    );
    await this.audit.record(accessToken, {
      organizationId,
      actorUserId: user.id,
      action: "obligation.created",
      resourceType: "recurring_obligation",
      resourceId: obligation.id,
    });
    return obligation;
  }

  public listActive(organizationId: string, accessToken: string) {
    return this.repository.listActive(organizationId, accessToken);
  }
}
