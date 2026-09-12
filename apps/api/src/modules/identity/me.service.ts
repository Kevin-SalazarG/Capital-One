import { Inject, Injectable } from "@nestjs/common";

import type { AuthenticatedUser } from "../../common/auth/authenticated-user";
import { OrganizationsRepository } from "../organizations/organizations.repository";

@Injectable()
export class MeService {
  public constructor(
    @Inject(OrganizationsRepository)
    private readonly organizations: OrganizationsRepository,
  ) {}

  public async get(user: AuthenticatedUser, accessToken: string) {
    return {
      user,
      organizations: await this.organizations.listForUser(user.id, accessToken),
    };
  }
}
