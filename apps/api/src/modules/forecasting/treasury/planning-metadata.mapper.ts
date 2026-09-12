import { eventSchema } from "@colchon/treasury/treasury-contract";
import type { JsonValue } from "../../../common/types/json-value";

export function planningMetadata(value: JsonValue) {
  const raw =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const parsed = eventSchema
    .pick({
      category: true,
      critical: true,
      earliestDate: true,
      latestDate: true,
      negotiationCost: true,
    })
    .safeParse(raw);
  const category = eventSchema.shape.category.safeParse(raw["category"]);
  return parsed.success
    ? parsed.data
    : {
        category: category.success ? category.data : ("other" as const),
        critical: raw["critical"] === true,
        earliestDate: null,
        latestDate: null,
        negotiationCost: "0.00",
      };
}
