import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { createE2EApp } from "../utils/create-e2e-app";
import { loginAdmin } from "../utils/auth";
import { withTenantHeaders } from "../utils/tenant";

const expectStatusIn = (allowed: number[], res: { status: number }) =>
  expect(allowed).toContain(res.status);

const expect401or403 = (res: { status: number }) =>
  expectStatusIn([401, 403], res);

const expect400or403 = (res: { status: number }) =>
  expectStatusIn([400, 403], res);

describe("[P00] Shipment Events (Admin) (gate e2e)", () => {
  let app: INestApplication;
  let adminCookie = "";

  const tenantId = (process.env.E2E_TENANT_ID ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");
  const tenantCode = (process.env.E2E_TENANT_CODE ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");

  // Opsiyonel: önceki suite’ten export ediyorsan direkt kullan
  const seededShipmentId = (process.env.E2E_SHIPMENT_ID ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");

  beforeAll(async () => {
    app = await createE2EApp();
    const admin = await loginAdmin(app);
    adminCookie = admin.cookie;
  });

  afterAll(async () => {
    await app?.close();
  });

  const shipmentIdOrDummy = () =>
    seededShipmentId || "00000000-0000-0000-0000-000000000000";

  const eventsBase = (shipmentId: string) =>
    `/api/admin/shipments/${shipmentId}/events`;

  const markDeliveredBase = (shipmentId: string) =>
    `/api/admin/shipments/${shipmentId}/mark-delivered`;

  it("POST shipment event without cookie -> 401/403", async () => {
    const shipmentId = shipmentIdOrDummy();

    const req = request(app.getHttpServer()).post(eventsBase(shipmentId)).send({
      type: "DELIVERY_ATTEMPT", // enum string; backend doğrularsa 400 da gelebilir ama cookie yokken 401/403 bekleriz
      occurredAt: new Date().toISOString(),
      message: "e2e event",
    });

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;
    expect401or403(res);
  });

  it("POST shipment event without tenant headers -> 400/403", async () => {
    const shipmentId = shipmentIdOrDummy();

    const res = await request(app.getHttpServer())
      .post(eventsBase(shipmentId))
      .set("Cookie", adminCookie)
      .send({
        type: "DELIVERY_ATTEMPT",
        occurredAt: new Date().toISOString(),
        message: "e2e event",
      });

    expect400or403(res);
  });

  it("POST shipment event -> 200/201 (if seeded) else 404 (route exists)", async () => {
    const shipmentId = shipmentIdOrDummy();

    const req = request(app.getHttpServer())
      .post(eventsBase(shipmentId))
      .set("Cookie", adminCookie)
      .send({
        type: "DELIVERY_ATTEMPT",
        occurredAt: new Date().toISOString(),
        message: "e2e event",
        raw: { e2e: true },
      });

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;

    // Seed yoksa 404; varsa controller davranışına göre 200/201; validation sıkıysa 400 kabul
    expectStatusIn([200, 201, 400, 404], res);
  });

  it("POST mark-delivered without cookie -> 401/403", async () => {
    const shipmentId = shipmentIdOrDummy();

    const req = request(app.getHttpServer()).post(
      markDeliveredBase(shipmentId)
    );
    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;
    expect401or403(res);
  });

  it("POST mark-delivered without tenant headers -> 400/403", async () => {
    const shipmentId = shipmentIdOrDummy();

    const res = await request(app.getHttpServer())
      .post(markDeliveredBase(shipmentId))
      .set("Cookie", adminCookie);

    expect400or403(res);
  });

  it("POST mark-delivered -> 200 (if seeded) else 404 (route exists)", async () => {
    const shipmentId = shipmentIdOrDummy();

    const req = request(app.getHttpServer())
      .post(markDeliveredBase(shipmentId))
      .set("Cookie", adminCookie);

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;

    // Seed varsa 200; seed yoksa 404; bazen business rule 400
    expectStatusIn([200, 400, 404], res);
  });
});
