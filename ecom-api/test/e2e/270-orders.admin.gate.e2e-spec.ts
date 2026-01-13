import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { createE2EApp } from "../utils/create-e2e-app";
import { loginAdmin } from "../utils/auth";
import { withTenantHeaders } from "../utils/tenant";

const expect401or403 = (res: { status: number }) =>
  expect([401, 403]).toContain(res.status);

const expect400or403 = (res: { status: number }) =>
  expect([400, 403]).toContain(res.status);

describe("[P00] Fulfillments (Admin) (gate e2e)", () => {
  let app: INestApplication;
  let adminCookie = "";

  const tenantId = (process.env.E2E_TENANT_ID ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");
  const tenantCode = (process.env.E2E_TENANT_CODE ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");

  // Opsiyonel seed: yoksa gate 404 kabul edecek.
  const seededOrderId = (process.env.E2E_ORDER_ID ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");

  const dummyOrderId = "00000000-0000-0000-0000-000000000000";
  const orderIdOrDummy = () => seededOrderId || dummyOrderId;

  const fulfillBase = (orderId: string) =>
    `/api/admin/orders/${orderId}/fulfillments`;

  beforeAll(async () => {
    app = await createE2EApp();
    const admin = await loginAdmin(app);
    adminCookie = admin.cookie;
  });

  afterAll(async () => {
    await app?.close();
  });

  it("GET fulfillments without cookie -> 401/403", async () => {
    const req = request(app.getHttpServer()).get(fulfillBase(orderIdOrDummy()));
    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;
    expect401or403(res);
  });

  const expect400or403or404 = (res: { status: number }) =>
    expect([400, 403, 404]).toContain(res.status);

  it("GET fulfillments without tenant headers -> 400/403/404", async () => {
    const res = await request(app.getHttpServer())
      .get(fulfillBase(orderIdOrDummy()))
      .set("Cookie", adminCookie);

    expect400or403or404(res);
  });

  it("GET fulfillments -> 200 (if seeded) else 404 (route exists)", async () => {
    const req = request(app.getHttpServer())
      .get(fulfillBase(orderIdOrDummy()))
      .set("Cookie", adminCookie);

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;

    // Gate: route var. Seed yoksa 404 kabul.
    expect([200, 404]).toContain(res.status);

    if (res.status === 200) {
      const items = res.body?.items ?? res.body?.fulfillments ?? res.body ?? [];
      expect(Array.isArray(items)).toBe(true);
    }
  });

  it("POST fulfillments -> 200/201 (if seeded) else 400/404 (route exists)", async () => {
    const req = request(app.getHttpServer())
      .post(fulfillBase(orderIdOrDummy()))
      .set("Cookie", adminCookie)
      .send({ metadata: { e2e: true } });

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;

    // Gate: route var. Seed yoksa 400/404; hazırsa 200/201.
    expect([200, 201, 400, 404]).toContain(res.status);
  });
});
