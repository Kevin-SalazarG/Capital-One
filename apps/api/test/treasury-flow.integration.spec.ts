import "reflect-metadata";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { test } from "node:test";
import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { createClient } from "@supabase/supabase-js";
import request from "supertest";
import { z } from "zod";
import { createDemoInput } from "@colchon/treasury/treasury-demo";
import {
  treasurySchema,
  decisionSchema,
} from "@colchon/treasury/treasury-contract";
import type { Database } from "../src/common/database/database.types";

test("authenticated treasury flow: inputs, plans, idempotency, follow-up, stale data and tenant isolation", async () => {
  const status = z
    .object({
      API_URL: z.url(),
      ANON_KEY: z.string(),
      SERVICE_ROLE_KEY: z.string(),
    })
    .parse(
      JSON.parse(
        execFileSync("supabase", ["status", "-o", "json"], {
          cwd: resolve(process.cwd(), "../.."),
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        }),
      ),
    );
  assert.ok(
    ["127.0.0.1", "localhost"].includes(new URL(status.API_URL).hostname),
    "Integration fixtures must never reach a remote project",
  );
  Object.assign(process.env, {
    NODE_ENV: "test",
    SUPABASE_URL: status.API_URL,
    SUPABASE_PUBLISHABLE_KEY: status.ANON_KEY,
    SUPABASE_SECRET_KEY: status.SERVICE_ROLE_KEY,
    NESSIE_API_KEY: "not-used-by-test",
    APP_ORIGIN: "http://localhost:3001",
    RATE_LIMIT_LIMIT: "1000",
  });
  // Exercise Nest's compiled decorator metadata; esbuild/tsx does not emit it.
  const { AppModule } = await import("../dist/app.module.js");
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = module.createNestApplication();
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  const admin = createClient<Database>(
    status.API_URL,
    status.SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  const users: string[] = [];
  let organizationId: string | null = null;
  const server = app.getHttpServer();
  const envelope = z.object({ data: z.unknown() });
  async function actor() {
    const email = `treasury-${randomUUID()}@example.test`;
    const password = `Qa-${randomUUID()}`;
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    assert.equal(created.error, null);
    assert.ok(created.data.user);
    users.push(created.data.user.id);
    const client = createClient(status.API_URL, status.ANON_KEY, {
      auth: { persistSession: false },
    });
    const signed = await client.auth.signInWithPassword({ email, password });
    assert.equal(signed.error, null);
    assert.ok(signed.data.session);
    return {
      id: created.data.user.id,
      token: signed.data.session.access_token,
    };
  }
  try {
    const owner = await actor();
    const outsider = await actor();
    const created = await request(server)
      .post("/api/v1/organizations")
      .auth(owner.token, { type: "bearer" })
      .send({
        name: "Treasury integration fixture",
        currency: "MXN",
        timeZone: "America/Monterrey",
        minimumCashReserve: "40000.00",
        dailyOperatingExpense: "1200.00",
      });
    assert.equal(created.status, 201);
    organizationId = z
      .object({ id: z.uuid() })
      .parse(envelope.parse(created.body).data).id;
    const prefix = `/api/v1/organizations/${organizationId}`;
    const connectionId = randomUUID();
    assert.equal(
      (
        await admin.from("data_connections").insert({
          id: connectionId,
          organization_id: organizationId,
          kind: "bank",
          provider: "nessie",
          display_name: "Synthetic bank fixture",
          created_by: owner.id,
        })
      ).error,
      null,
    );
    assert.equal(
      (
        await admin.from("bank_accounts").insert({
          organization_id: organizationId,
          connection_id: connectionId,
          external_id: randomUUID(),
          name: "Operating",
          type: "Checking",
          currency: "MXN",
          balance: "185000.00",
          status: "active",
          last_synced_at: new Date().toISOString(),
        })
      ).error,
      null,
    );
    const asOf = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Monterrey",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const fixture = createDemoInput(asOf);
    const documents = fixture.events
      .filter((event) => event.source === "invoice")
      .map((event) => ({
        cfdiUuid: `QA-${event.id}-${randomUUID()}`,
        direction: event.amount.startsWith("-") ? "payable" : "receivable",
        issuerRfc: "AAA010101AAA",
        receiverRfc: "BBB010101BBB",
        counterpartyName: event.label,
        issuedAt: `${asOf}T12:00:00Z`,
        dueOn: event.date,
        currency: "MXN",
        totalAmount: event.amount.replace("-", ""),
        outstandingAmount: event.amount.replace("-", ""),
        paymentStatus: "pending",
        metadata: {
          earliestDate: event.earliestDate,
          latestDate: event.latestDate,
          negotiationCost: event.negotiationCost,
        },
      }));
    const imported = await request(server)
      .post(`${prefix}/cfdi/imports`)
      .auth(owner.token, { type: "bearer" })
      .send({ sourceName: "QA treasury fixture", documents });
    assert.equal(imported.status, 201);
    for (const event of fixture.events.filter(
      (item) => item.source === "obligation",
    )) {
      const response = await request(server)
        .post(`${prefix}/obligations`)
        .auth(owner.token, { type: "bearer" })
        .send({
          name: event.label,
          amount: event.amount.replace("-", ""),
          currency: "MXN",
          frequency: "monthly",
          nextDueOn: event.date,
          category: event.category,
          critical: event.critical,
        });
      assert.equal(response.status, 201);
    }
    const response = await request(server)
      .get(`${prefix}/treasury`)
      .auth(owner.token, { type: "bearer" });
    assert.equal(response.status, 200);
    const treasury = treasurySchema.parse(envelope.parse(response.body).data);
    assert.equal(treasury.baseline.summary.minimumBalance, "-14000.00");
    const first = treasury.plans[0];
    assert.ok(first);
    const choose = { inputHash: treasury.inputHash, planId: first.id };
    const selected = await request(server)
      .post(`${prefix}/treasury/decisions`)
      .auth(owner.token, { type: "bearer" })
      .send(choose);
    assert.equal(selected.status, 201);
    const decision = decisionSchema.parse(envelope.parse(selected.body).data);
    const duplicate = await request(server)
      .post(`${prefix}/treasury/decisions`)
      .auth(owner.token, { type: "bearer" })
      .send(choose);
    assert.equal(duplicate.status, 201);
    assert.equal(
      decisionSchema.parse(envelope.parse(duplicate.body).data).id,
      decision.id,
    );
    const action = first.actions[0];
    assert.ok(action);
    const alternative = treasury.plans[1];
    assert.ok(alternative);
    assert.equal(
      (
        await request(server)
          .post(`${prefix}/treasury/decisions`)
          .auth(owner.token, { type: "bearer" })
          .send({ inputHash: treasury.inputHash, planId: alternative.id })
      ).status,
      201,
    );
    assert.equal(
      (
        await request(server)
          .post(`${prefix}/treasury/decisions`)
          .auth(owner.token, { type: "bearer" })
          .send(choose)
      ).status,
      201,
    );
    const reselected = await request(server)
      .get(`${prefix}/treasury`)
      .auth(owner.token, { type: "bearer" });
    const selections = await admin
      .from("treasury_decisions")
      .select("id,created_at,selected_at")
      .eq("organization_id", organizationId);
    assert.equal(
      treasurySchema.parse(envelope.parse(reselected.body).data).decision?.id,
      decision.id,
      JSON.stringify(selections.data),
    );
    const delayed = await request(server)
      .get(`${prefix}/treasury`)
      .query({ delayedReceiptId: action.eventId })
      .auth(owner.token, { type: "bearer" });
    assert.equal(delayed.status, 200);
    const stress = treasurySchema.parse(envelope.parse(delayed.body).data);
    assert.notEqual(stress.inputHash, treasury.inputHash);
    assert.ok(
      stress.plans.every((plan) =>
        plan.actions.every((item) => item.eventId !== action.eventId),
      ),
    );
    assert.equal(
      (
        await request(server)
          .post(`${prefix}/treasury/decisions`)
          .auth(owner.token, { type: "bearer" })
          .send({ inputHash: stress.inputHash, planId: first.id })
      ).status,
      409,
    );
    const followed = await request(server)
      .patch(`${prefix}/treasury/decisions/${decision.id}`)
      .auth(owner.token, { type: "bearer" })
      .send({ actionId: action.id, status: "agreed" });
    assert.equal(followed.status, 200);
    assert.equal(
      decisionSchema.parse(envelope.parse(followed.body).data).steps[action.id],
      "agreed",
    );
    const unchanged = await request(server)
      .get(`${prefix}/treasury`)
      .auth(owner.token, { type: "bearer" });
    assert.equal(
      treasurySchema.parse(envelope.parse(unchanged.body).data).baseline.summary
        .minimumBalance,
      "-14000.00",
      "Agreement must not fabricate cash",
    );
    assert.equal(
      (
        await request(server)
          .get(`${prefix}/treasury`)
          .auth(outsider.token, { type: "bearer" })
      ).status,
      403,
    );
    assert.equal(
      (
        await request(server)
          .patch(`${prefix}/treasury/decisions/${decision.id}`)
          .auth(outsider.token, { type: "bearer" })
          .send({ actionId: action.id, status: "agreed" })
      ).status,
      403,
    );
    const invalid = await request(server)
      .patch(`${prefix}/treasury/decisions/${decision.id}`)
      .auth(owner.token, { type: "bearer" })
      .send({
        actionId: action.id,
        status: "paid",
        organizationId: randomUUID(),
      });
    assert.equal(invalid.status, 400);
    const changed = await request(server)
      .patch(prefix)
      .auth(owner.token, { type: "bearer" })
      .send({ minimumCashReserve: "45000.00" });
    assert.equal(changed.status, 200);
    const stale = await request(server)
      .post(`${prefix}/treasury/decisions`)
      .auth(owner.token, { type: "bearer" })
      .send(choose);
    assert.equal(stale.status, 409);
    const invoice = await admin
      .from("cfdi_invoices")
      .select("id,due_on")
      .eq("organization_id", organizationId)
      .eq("counterparty_name", "Hotel Alameda")
      .single();
    assert.equal(invoice.error, null);
    assert.ok(invoice.data);
    const planning = {
      dueOn: invoice.data.due_on,
      negotiationCost: "0.00",
      category: "other",
      critical: false,
      outstandingAmount: "55000.00",
    };
    assert.equal(
      (
        await request(server)
          .patch(`${prefix}/treasury/invoices/${invoice.data.id}`)
          .auth(owner.token, { type: "bearer" })
          .send({ ...planning, outstandingAmount: "999999.00" })
      ).status,
      400,
    );
    assert.equal(
      (
        await request(server)
          .patch(`${prefix}/treasury/invoices/${invoice.data.id}`)
          .auth(owner.token, { type: "bearer" })
          .send({ ...planning, earliestDate: invoice.data.due_on })
      ).status,
      400,
    );
    assert.equal(
      (
        await request(server)
          .patch(`${prefix}/treasury/invoices/${invoice.data.id}`)
          .auth(outsider.token, { type: "bearer" })
          .send(planning)
      ).status,
      403,
    );
    assert.equal(
      (
        await request(server)
          .patch(`${prefix}/treasury/invoices/${invoice.data.id}`)
          .auth(owner.token, { type: "bearer" })
          .send(planning)
      ).status,
      200,
    );
    assert.equal(
      (
        await admin
          .from("data_connections")
          .update({ status: "revoked" })
          .eq("id", connectionId)
      ).error,
      null,
    );
    assert.equal(
      (
        await request(server)
          .get(`${prefix}/treasury`)
          .auth(owner.token, { type: "bearer" })
      ).status,
      422,
    );
  } finally {
    if (organizationId)
      assert.equal(
        (await admin.from("organizations").delete().eq("id", organizationId))
          .error,
        null,
      );
    for (const id of users)
      assert.equal((await admin.auth.admin.deleteUser(id)).error, null);
    await app.close();
  }
});
