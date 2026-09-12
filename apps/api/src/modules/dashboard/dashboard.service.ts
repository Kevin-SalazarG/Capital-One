import { Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../platform/database/database.service.js";
import type { DatabaseScope } from "../../platform/database/database.service.js";
import { BusinessesService, mapBusiness } from "../businesses/businesses.service.js";
import { BudgetsService } from "../commitments/budgets.service.js";
import { DecisionsService } from "../decisions/decisions.service.js";
import type { ForecastOptions } from "../planning/planning-schemas.js";
import { PlanningService } from "../planning/planning.service.js";
import type { DashboardResult } from "./dashboard-schema.js";

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(BusinessesService) private readonly businesses: BusinessesService,
    @Inject(PlanningService) private readonly planning: PlanningService,
    @Inject(BudgetsService) private readonly budgets: BudgetsService,
    @Inject(DecisionsService) private readonly decisions: DecisionsService,
  ) {}
  async get(scope: DatabaseScope, options: ForecastOptions): Promise<DashboardResult> {
    return this.database.transaction(scope, async (transaction) => ({
      business: mapBusiness(await this.businesses.getInTransaction(transaction, scope.businessId)),
      liquidity: await this.planning.forecastInTransaction(transaction, scope.businessId, options),
      overhead: await this.budgets.listInTransaction(transaction, scope.businessId),
      decisions: await this.decisions.listInTransaction(transaction, scope.businessId, {
        offset: 0,
        limit: 10,
      }),
    }));
  }
}
