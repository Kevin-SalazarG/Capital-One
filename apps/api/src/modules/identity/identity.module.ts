import { Module } from "@nestjs/common";

import { AuthInfrastructureModule } from "../../common/auth/auth-infrastructure.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { IdentityAuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { MeController } from "./me.controller";
import { MeService } from "./me.service";

@Module({
  imports: [AuthInfrastructureModule, OrganizationsModule],
  controllers: [AuthController, MeController],
  providers: [IdentityAuthService, MeService],
})
export class IdentityModule {}
