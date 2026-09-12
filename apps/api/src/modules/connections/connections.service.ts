import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../../common/audit/audit.service";
import { AppError } from "../../common/errors/app-error";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import type { CreateConnectionDto } from "./dto/create-connection.dto";
import type { UpdateConnectionDto } from "./dto/update-connection.dto";
import { ConnectionsRepository } from "./connections.repository";

@Injectable()
export class ConnectionsService {
  public constructor(
    @Inject(ConnectionsRepository)
    private readonly repository: ConnectionsRepository,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  public async create(
    organizationId: string,
    user: AuthenticatedUser,
    accessToken: string,
    input: CreateConnectionDto,
  ) {
    if (
      (input.kind === "bank" && input.provider !== "nessie") ||
      (input.kind === "cfdi" && input.provider !== "synthetic_cfdi")
    ) {
      throw new AppError(
        "The connection provider is incompatible with its kind",
        {
          code: "VALIDATION_FAILED",
          status: 400,
        },
      );
    }
    const connection = await this.repository.create(
      organizationId,
      user.id,
      accessToken,
      input,
    );
    await this.audit.record(accessToken, {
      organizationId,
      actorUserId: user.id,
      action: "connection.created",
      resourceType: "data_connection",
      resourceId: connection.id,
      metadata: { kind: connection.kind, provider: connection.provider },
    });
    return connection;
  }

  public list(organizationId: string, accessToken: string) {
    return this.repository.list(organizationId, accessToken);
  }

  public async update(
    organizationId: string,
    connectionId: string,
    user: AuthenticatedUser,
    accessToken: string,
    input: UpdateConnectionDto,
  ) {
    if (
      input.displayName === undefined &&
      input.externalCustomerId === undefined
    ) {
      throw new AppError("At least one connection field must be updated", {
        code: "VALIDATION_FAILED",
        status: 400,
      });
    }
    const connection = await this.repository.update(
      organizationId,
      connectionId,
      accessToken,
      input,
    );
    await this.audit.record(accessToken, {
      organizationId,
      actorUserId: user.id,
      action: "connection.updated",
      resourceType: "data_connection",
      resourceId: connectionId,
      metadata: { fields: Object.keys(input) },
    });
    return connection;
  }

  public async revoke(
    organizationId: string,
    connectionId: string,
    user: AuthenticatedUser,
    accessToken: string,
  ) {
    const connection = await this.repository.revoke(
      organizationId,
      connectionId,
      accessToken,
    );
    await this.audit.record(accessToken, {
      organizationId,
      actorUserId: user.id,
      action: "connection.revoked",
      resourceType: "data_connection",
      resourceId: connectionId,
    });
    return connection;
  }
}
