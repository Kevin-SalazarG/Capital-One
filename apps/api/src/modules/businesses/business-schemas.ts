import * as v from "valibot";
import { identifierSchema, textSchema, versionSchema } from "../../platform/http/http-schemas.js";
import {
  dateSchema,
  moneySchema,
  positiveMoneySchema,
} from "../planning/domain/forecast-schema.js";

export const businessSchema = v.object({
  id: identifierSchema,
  name: textSchema,
  currency: v.literal("MXN"),
  timezone: v.literal("America/Monterrey"),
  cushion: positiveMoneySchema,
  planningVersion: versionSchema,
  dataComplete: v.boolean(),
  cutoffDate: dateSchema,
  openingBalance: moneySchema,
  source: v.picklist(["replay", "nessie_live", "unavailable"]),
  sourceSyncedAt: v.nullable(v.string()),
});
export const businessListSchema = v.array(businessSchema);
export const settingsSchema = v.strictObject({
  expectedVersion: versionSchema,
  cushion: positiveMoneySchema,
  dataComplete: v.boolean(),
});
export type BusinessResult = v.InferOutput<typeof businessSchema>;
export type SettingsInput = v.InferOutput<typeof settingsSchema>;
