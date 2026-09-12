import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { Decimal } from "decimal.js";
import * as v from "valibot";
import type { Business, BusinessState } from "../../platform/database/business-state.js";
import { DatabaseService, type DatabaseScope } from "../../platform/database/database.service.js";
import { ApiError } from "../../platform/http/api-error.js";
import { businessSchema, type BusinessResult, type SettingsInput } from "./business-schemas.js";

@Injectable()
export class BusinessesService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async list(userId: string): Promise<BusinessResult[]> {
    return (await this.database.listBusinesses(userId)).map(mapBusiness);
  }

  async get(scope: DatabaseScope): Promise<BusinessResult> {
    return this.database.transaction(scope, async (state) =>
      mapBusiness(await this.getInTransaction(state, scope.businessId)),
    );
  }

  async getInTransaction(state: BusinessState, businessId: string): Promise<Business> {
    if (state.business.id !== businessId)
      throw new ApiError("BUSINESS_ACCESS_DENIED", "No tienes acceso a este negocio.", 403);
    return state.business;
  }

  async update(scope: DatabaseScope, input: SettingsInput): Promise<BusinessResult> {
    return this.database.transaction(scope, async (state) => {
      await this.database.advanceVersion(state, scope.businessId, input.expectedVersion);
      state.business.cushion = new Decimal(input.cushion);
      state.business.dataComplete = input.dataComplete;
      state.business.updatedAt = new Date();
      state.auditEvents.push({
        id: randomUUID(),
        ...scope,
        action: "business.settings_updated",
        entityId: null,
        metadata: { expectedVersion: input.expectedVersion },
        createdAt: new Date(),
      });
      return mapBusiness(state.business);
    });
  }
}

export function mapBusiness(business: Business): BusinessResult {
  return v.parse(businessSchema, {
    ...business,
    cushion: business.cushion.toFixed(2),
    openingBalance: business.openingBalance.toFixed(2),
    cutoffDate: business.cutoff.toISOString().slice(0, 10),
    sourceSyncedAt: business.sourceSyncedAt?.toISOString() ?? null,
  });
}
