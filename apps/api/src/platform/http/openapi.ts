import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { OpenAPIObject } from "@nestjs/swagger";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";
import * as auth from "../../modules/auth/auth-schemas.js";
import * as banking from "../../modules/banking/banking-schemas.js";
import * as businesses from "../../modules/businesses/business-schemas.js";
import * as planning from "../../modules/planning/planning-schemas.js";
import * as decisions from "../../modules/decisions/decision-schemas.js";
import { dashboardSchema } from "../../modules/dashboard/dashboard-schema.js";
import {
  adjustmentSchema,
  budgetInputSchema,
  budgetListSchema,
  commitmentInputSchema,
  commitmentListSchema,
  commitmentWriteSchema,
  correctionSchema,
  reconciliationInputSchema,
  reconciliationSchema,
  recurringInputSchema,
} from "../../modules/commitments/commitment-schemas.js";
import { healthSchema } from "../health/health.controller.js";
import { errorSchema, pageQuerySchema, successSchema } from "./http-schemas.js";

type TransportSchema = v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>;

const schemas: readonly TransportSchema[] = [
  ...Object.values(auth),
  ...Object.values(banking),
  ...Object.values(businesses),
  ...Object.values(planning),
  ...Object.values(decisions),
  dashboardSchema,
  adjustmentSchema,
  budgetInputSchema,
  budgetListSchema,
  commitmentInputSchema,
  commitmentListSchema,
  commitmentWriteSchema,
  correctionSchema,
  reconciliationInputSchema,
  reconciliationSchema,
  recurringInputSchema,
  healthSchema,
  pageQuerySchema,
  successSchema,
];

export function createOpenApi(
  app: INestApplication,
  additionalSchemas: readonly TransportSchema[] = [],
): OpenAPIObject {
  const registry = new Map<unknown, TransportSchema>(
    [...schemas, ...additionalSchemas].map((schema) => [schema, schema]),
  );
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("Mirror API")
      .setVersion("1.0.0")
      .setDescription(
        "Synthetic cash-flow planning. Amounts are decimal MXN strings. All calculations are conditional, versioned and bounded to 30 days. Custom calendar and cross-field constraints are enforced by the server.",
      )
      .addBearerAuth()
      .build(),
    {
      standardSchemaConverter: (input, options) => {
        const schema = registry.get(input);
        if (!schema) throw new Error("Unregistered transport schema");
        return {
          schema: toJsonSchema(schema, {
            target: "openapi-3.0",
            typeMode: options.schemaType,
            overrideAction: (context) => {
              // Cross-field predicates cannot be encoded in OpenAPI 3.0; runtime validation remains authoritative.
              const action: unknown = context.valibotAction;
              if (
                typeof action === "object" &&
                action !== null &&
                "type" in action &&
                action.type === "check"
              ) {
                const description =
                  "message" in action && typeof action.message === "string"
                    ? action.message
                    : "Additional server validation applies.";
                return { ...context.jsonSchema, description };
              }
              return undefined;
            },
          }),
        };
      },
    },
  );
  const errors = v.parse(
    v.object({
      type: v.literal("object"),
      required: v.array(v.string()),
      properties: v.record(v.string(), v.object({ type: v.literal("string") })),
    }),
    toJsonSchema(errorSchema, { target: "openapi-3.0" }),
  );
  for (const item of Object.values(document.paths)) {
    for (const operation of [item.get, item.post, item.patch, item.delete, item.put]) {
      if (!operation) continue;
      for (const status of [400, 401, 403, 404, 409, 422, 429, 500, 503]) {
        operation.responses[status] = {
          description:
            status === 409
              ? "Reload the current planning version and reevaluate; retry an uncertain confirmation with the same idempotency key."
              : "Structured safe error. Retrying authentication or read failures must respect Retry-After.",
          content: { "application/json": { schema: errors } },
        };
      }
    }
  }
  return document;
}
