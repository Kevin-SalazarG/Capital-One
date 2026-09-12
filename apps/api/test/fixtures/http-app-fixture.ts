import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { Test } from "@nestjs/testing";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { configureAppModule } from "../../src/app.module.js";
import { configureApplication } from "../../src/configure-app.js";
import type { Pool } from "pg";
import { createDatabaseFixture } from "./database-fixture.js";
import { AuthProvider } from "../../src/modules/auth/auth-provider.js";
import {
  BankingProvider,
  BankingProviderError,
  type BankingLoadRequest,
  type BankingSnapshot,
} from "../../src/modules/banking/banking-provider.js";
import { replayBankingSnapshot } from "../../src/modules/banking/replay-snapshot.js";
import { TestAuthProvider } from "./test-auth-provider.js";

export interface HttpBusinessFixture {
  readonly businessId: string;
  readonly userId: string;
  readonly email: string;
  readonly payrollId: string;
}

export interface HttpAppFixture {
  readonly baseUrl: string;
  readonly app: NestExpressApplication;
  readonly first: HttpBusinessFixture;
  readonly second: HttpBusinessFixture;
  readonly banking: MutableTestBankingProvider;
  readonly close: () => Promise<void>;
}

export interface HttpAppFixtureOptions {
  readonly port?: number;
  readonly password?: string;
  readonly onShutdown?: () => void;
}

export class MutableTestBankingProvider extends BankingProvider {
  snapshot: BankingSnapshot = structuredClone(replayBankingSnapshot);
  failure: "PROVIDER_UNAVAILABLE" | null = null;

  override async load(request: BankingLoadRequest): Promise<BankingSnapshot> {
    if (this.failure) throw new BankingProviderError(this.failure);
    if (
      request.customerId !== this.snapshot.account.customerId ||
      request.accountId !== this.snapshot.account.externalId
    ) {
      throw new BankingProviderError("PROVIDER_SCOPE_MISMATCH");
    }
    if (request.signal?.aborted) throw new BankingProviderError("PROVIDER_CANCELLED");
    return structuredClone(this.snapshot);
  }

  receivePartialAdvance(): void {
    this.snapshot = {
      ...this.snapshot,
      account: { ...this.snapshot.account, balance: "65000.00" },
      movements: [
        {
          externalId: "777777777777777777777777",
          resource: "deposit",
          direction: "inflow",
          amount: "15000.00",
          date: "2026-09-12",
          status: "completed",
          classification: "unclassified",
          description: "Synthetic partial customer advance, received before the cutoff",
        },
      ],
      startedAt: "2026-09-12T18:01:00.000Z",
      completedAt: "2026-09-12T18:01:00.000Z",
    };
  }
}

async function seedBusiness(owner: Pool, suffix: string): Promise<HttpBusinessFixture> {
  const userId = randomUUID();
  const businessId = randomUUID();
  const email = `synthetic-${suffix}-${userId}@example.test`;
  const payrollId = randomUUID();
  const client = await owner.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO mirror.businesses (id,name,cushion,cutoff,"openingBalance","dataComplete",source,"sourceSyncedAt","updatedAt") VALUES ($1,$2,10000,$3,50000,true,'replay',$4,now())`,
      [businessId, `Synthetic HTTP business ${suffix}`, "2026-09-12", "2026-09-12T18:00:00Z"],
    );
    await client.query(`INSERT INTO mirror.memberships ("businessId","userId") VALUES ($1,$2)`, [
      businessId,
      userId,
    ]);
    await client.query(
      `INSERT INTO mirror.bank_accounts (id,"businessId",provider,"connectionId","externalId") VALUES ($1,$2,'nessie',$3,$4)`,
      [
        randomUUID(),
        businessId,
        replayBankingSnapshot.account.customerId,
        replayBankingSnapshot.account.externalId,
      ],
    );
    await client.query(
      `INSERT INTO mirror.commitments (id,"businessId",title,kind,amount,"dueDate",category,status,negotiable,"updatedAt") VALUES ($1,$2,'Synthetic payroll','outflow',30000,'2026-09-30','payroll','expected',false,now())`,
      [payrollId, businessId],
    );
    await client.query("COMMIT");
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return { businessId, userId, email, payrollId };
}

export async function createHttpAppFixture(
  options: HttpAppFixtureOptions = {},
): Promise<HttpAppFixture> {
  const persistence = await createDatabaseFixture();
  const owner = persistence.admin;
  let application: NestExpressApplication | undefined;
  try {
    const [first, second] = await Promise.all([
      seedBusiness(owner, "first"),
      seedBusiness(owner, "second"),
    ]);
    const banking = new MutableTestBankingProvider();
    const testingModule = await Test.createTestingModule({
      providers: [
        {
          provide: "HTTP_FIXTURE_OWNER",
          useValue: {
            onApplicationShutdown: async (): Promise<void> => {
              await persistence.close();
              options.onShutdown?.();
            },
          },
        },
      ],
      imports: [configureAppModule(persistence.config)],
    })
      .overrideProvider(AuthProvider)
      .useValue(new TestAuthProvider([first, second], options.password))
      .overrideProvider(BankingProvider)
      .useValue(banking)
      .compile();
    const app = testingModule.createNestApplication<NestExpressApplication>({
      logger: false,
      bodyParser: false,
    });
    application = app;
    configureApplication(app, 0);
    await app.listen(options.port ?? 0, "127.0.0.1");
    return {
      baseUrl: await app.getUrl(),
      app,
      first,
      second,
      banking,
      close: async (): Promise<void> => {
        await app.close();
      },
    };
  } catch (error: unknown) {
    await application?.close();
    await persistence.close();
    throw error;
  }
}
