import assert from "node:assert/strict";
import { after, before, test } from "node:test";

Object.assign(process.env, {
  NODE_ENV: "test",
  PORT: "3010",
  APP_ORIGIN: "http://localhost:3001",
  SUPABASE_URL: "https://test-project.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
  SUPABASE_SECRET_KEY: "test-secret-key",
  NESSIE_API_KEY: "test-nessie-key",
});

import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

let app: INestApplication | undefined;

before(async () => {
  const { AppModule } = await import("../src/app.module");
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = moduleRef.createNestApplication();
  app.setGlobalPrefix("api/v1");
  await app.init();
});

after(async () => {
  await app?.close();
});

test("returns liveness without authentication", async () => {
  assert.ok(app);
  const response = await request(app.getHttpServer()).get(
    "/api/v1/health/live",
  );
  assert.equal(response.status, 200);
  const body = response.body as { readonly data: { readonly status: string } };
  assert.equal(body.data.status, "ok");
});

test("rejects protected routes without a session", async () => {
  assert.ok(app);
  const response = await request(app.getHttpServer()).get("/api/v1/me");
  assert.equal(response.status, 401);
});
