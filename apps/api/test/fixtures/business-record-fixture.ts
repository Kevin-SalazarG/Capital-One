import { randomUUID } from "node:crypto";
import type { DatabaseScope } from "../../src/platform/database/database.service.js";
import type { DatabaseFixture } from "./database-fixture.js";

interface BusinessFixtureInput {
  readonly name: string;
  readonly cutoff: string;
  readonly cushion: string;
  readonly customerId: string;
  readonly externalAccountId: string;
  readonly dataComplete?: boolean;
}

export async function seedBusinessRecords(
  test: DatabaseFixture,
  input: BusinessFixtureInput,
): Promise<{ readonly scope: DatabaseScope; readonly accountId: string }> {
  const scope = { businessId: randomUUID(), userId: randomUUID() };
  const accountId = randomUUID();
  const connection = await test.admin.connect();
  try {
    await connection.query("BEGIN");
    await connection.query(
      'INSERT INTO mirror.businesses (id, name, cushion, "openingBalance", cutoff, source, "sourceSyncedAt", "dataComplete") VALUES ($1, $2, $3, 50000.00, $4, \'replay\', $5, $6)',
      [
        scope.businessId,
        input.name,
        input.cushion,
        input.cutoff,
        new Date(),
        input.dataComplete ?? false,
      ],
    );
    await connection.query(
      'INSERT INTO mirror.memberships ("businessId", "userId") VALUES ($1, $2)',
      [scope.businessId, scope.userId],
    );
    await connection.query(
      'INSERT INTO mirror.bank_accounts (id, "businessId", provider, "connectionId", "externalId") VALUES ($1, $2, \'nessie\', $3, $4)',
      [accountId, scope.businessId, input.customerId, input.externalAccountId],
    );
    await connection.query("COMMIT");
  } catch (error: unknown) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    connection.release();
  }
  return { scope, accountId };
}
