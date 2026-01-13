import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { createE2EApp } from "../utils/create-e2e-app";
import { loginAdmin } from "../utils/auth";
import { withTenantHeaders } from "../utils/tenant";

const expect401or403 = (res: { status: number }) =>
  expect([401, 403]).toContain(res.status);

const expect400or403or404 = (res: { status: number }) =>
  expect([400, 403, 404]).toContain(res.status);

describe("[P00] Shipments (Admin) (gate e2e)", () => {
  let app: INestApplication;
  let adminCookie = "";

  const tenantId = (process.env.E2E_TENANT_ID ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");
  const tenantCode = (process.env.E2E_TENANT_CODE ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");

  // Eğer elinde seed fulfillmentId varsa (ör: fulfillment create testinden export ediyorsun), buraya koy.
  const seededFulfillmentId = (process.env.E2E_FULFILLMENT_ID ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");

  const dummy = "00000000-0000-0000-0000-000000000000";
  const fulfillmentIdOrDummy = () => seededFulfillmentId || dummy;

  const base = (fulfillmentId: string) =>
    `/api/admin/fulfillments/${fulfillmentId}/shipments`;
  const expect200or400or403or404 = (res: { status: number }) =>
    expect([200, 400, 403, 404]).toContain(res.status);

  beforeAll(async () => {
    app = await createE2EApp();
    const admin = await loginAdmin(app);
    adminCookie = admin.cookie;
  });

  afterAll(async () => {
    await app?.close();
  });

  it("GET shipments without cookie -> 401/403", async () => {
    const req = request(app.getHttpServer()).get(base(fulfillmentIdOrDummy()));
    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;
    expect401or403(res);
  });

  it("GET shipments without tenant headers -> 200 OR 400/403/404 (gate)", async () => {
    const res = await request(app.getHttpServer())
      .get(base(fulfillmentIdOrDummy()))
      .set("Cookie", adminCookie);

    expect200or400or403or404(res);
  });

  it("GET shipments -> 200 (if seeded) else 404 (route exists)", async () => {
    const req = request(app.getHttpServer())
      .get(base(fulfillmentIdOrDummy()))
      .set("Cookie", adminCookie);
    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;
    expect([200, 404]).toContain(res.status);

    if (res.status === 200) {
      const items = res.body?.items ?? res.body?.shipments ?? res.body ?? [];
      expect(Array.isArray(items)).toBe(true);
    }
  });

  it("POST shipments -> 201/200 (if seeded) else 400/404 (route exists)", async () => {
    const req = request(app.getHttpServer())
      .post(base(fulfillmentIdOrDummy()))
      .set("Cookie", adminCookie)
      .send({
        // CreateShipmentDto: carrierId zorunlu görünüyor
        carrierId: process.env.E2E_CARRIER_ID
          ? String(process.env.E2E_CARRIER_ID)
              .trim()
              .replace(/^"+|"+$/g, "")
          : dummy,
        metadata: { e2e: true },
      });
    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;
    //business/seed yoksa 400/404; hazırsa 200/201
    expect([200, 201, 400, 404]).toContain(res.status);
  });
});
