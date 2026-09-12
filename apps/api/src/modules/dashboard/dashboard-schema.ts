import * as v from "valibot";
import { businessSchema } from "../businesses/business-schemas.js";
import { budgetListSchema } from "../commitments/commitment-schemas.js";
import { decisionListSchema } from "../decisions/decision-schemas.js";
import { forecastEnvelopeSchema } from "../planning/planning-schemas.js";

export const dashboardSchema = v.strictObject({
  business: businessSchema,
  liquidity: forecastEnvelopeSchema,
  overhead: budgetListSchema,
  decisions: decisionListSchema,
});
export type DashboardResult = v.InferOutput<typeof dashboardSchema>;
