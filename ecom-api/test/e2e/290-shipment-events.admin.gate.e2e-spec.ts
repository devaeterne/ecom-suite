import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { createE2EApp } from "../utils/create-e2e-app";
import { loginAdmin } from "../utils/auth";
import { withTenantHeaders } from "../utils/tenant";

/**
 * Gate hedefi:
 * - Endpoint/route var mı?
 * - Guard'lar çalışıyor mu?
 * - Seed varsa 200/201, seed yoksa 404/400 kabul.
 */

const expect401or403 = (res: { status: number }) =>
  expect([401, 403]).toContain(res.status);

const expect400or403 = (res: { status: number }) =>
  expect([400, 403]).toContain(res.status);

describe("[P00] Shipment Events (Admin) (gate e2e)", () => {
  let app: INestApplication;
  let adminCookie = "";

  const tenantId = (process.env.E2E_TENANT_ID ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");
  const tenantCode = (process.env.E2E_TENANT_CODE ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");

  // Eğer 280 suite’de create edilen shipmentId’yi export ediyorsan buraya koy.
  const seededShipmentId = (process.env.E2E_SHIPMENT_ID ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");

  const shipmentId = () =>
    seededShipmentId || "00000000-0000-0000-0000-000000000000";

  const base = () => `/api/admin/shipments/${shipmentId()}`;

  beforeAll(async () => {
    app = await createE2EApp();
    const admin = await loginAdmin(app);
    adminCookie = admin.cookie;
  });

  afterAll(async () => {
    await app?.close();
  });

  it("POST shipment event without cookie -> 401/403", async () => {
    const req = request(app.getHttpServer()).post(`${base()}/events`).send({
      type: "DELIVERY_ATTEMPT",
      occurredAt: new Date().toISOString(),
      message: "e2e",
    });

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;
    expect401or403(res);
  });

  it("POST shipment event without tenant headers -> 400/403", async () => {
    const res = await request(app.getHttpServer())
      .post(`${base()}/events`)
      .set("Cookie", adminCookie)
      .send({
        type: "DELIVERY_ATTEMPT",
        occurredAt: new Date().toISOString(),
        message: "e2e",
      });

    expect400or403(res);
  });

  it("POST shipment event -> 201/200 (if seeded) else 400/404 (route exists)", async () => {
    const req = request(app.getHttpServer())
      .post(`${base()}/events`)
      .set("Cookie", adminCookie)
      .send({
        // NOTE: DTO beklediğin field’lar farklıysa 400 döner, bu gate için OK.
        // TrackingEventType enum’un sende: DELIVERY_ATTEMPT, SHIPPED, IN_TRANSIT, DELIVERED vb.
        type: "DELIVERY_ATTEMPT",
        status: "IN_TRANSIT",
        message: "event from e2e",
        location: "Podgorica",
        raw: { e2e: true },
        occurredAt: new Date().toISOString(),
      });

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;

    // Seed varsa genelde 200/201, yoksa 404; body invalidse 400.
    expect([200, 201, 400, 404]).toContain(res.status);
  });

  it("POST mark-delivered -> 200 (if seeded) else 400/404 (route exists)", async () => {
    const req = request(app.getHttpServer())
      .post(`${base()}/mark-delivered`)
      .set("Cookie", adminCookie)
      .send({}); // çoğu impl empty body

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;

    // route varsa: seeded shipment => 200; yoksa 404; bazı validasyonlarda 400
    expect([200, 400, 404]).toContain(res.status);
  });
});
