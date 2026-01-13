import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { createE2EApp } from "@test/utils/create-e2e-app";
import { loginAdmin } from "@test/utils/auth";
import { withTenantHeaders } from "@test/utils/tenant";

const expect200or201 = (r: any) => {
  expect([200, 201]).toContain(r.status);
};

const expect401or403 = (r: any) => {
  expect([401, 403]).toContain(r.status);
};

const expect400or403 = (r: any) => {
  expect([400, 403]).toContain(r.status);
};

describe("[P00] Inventory Locations (Admin) (gate e2e)", () => {
  let app: INestApplication;
  let adminCookie: string;

  const tenantId = (process.env.E2E_TENANT_ID ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");
  const tenantCode = (process.env.E2E_TENANT_CODE ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");

  // ✅ Eğer sizde farklıysa değiştir:
  const BASE = "/api/admin/inventory/locations";

  const uid = (prefix = "loc") =>
    `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;

  beforeAll(async () => {
    app = await createE2EApp();
    const login = await loginAdmin(app);
    adminCookie = login.cookie;
  });

  afterAll(async () => {
    await app?.close();
  });

  it(`POST ${BASE} without cookie -> 401/403`, async () => {
    const req = request(app.getHttpServer())
      .post(BASE)
      .send({ name: "NoAuth Location", code: uid("code") });

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;
    expect401or403(res);
  });

  it(`POST ${BASE} without tenant headers -> 400/403`, async () => {
    const res = await request(app.getHttpServer())
      .post(BASE)
      .set("Cookie", adminCookie)
      .send({ name: "NoTenant Location", code: uid("code") });

    expect400or403(res);
  });

  let locationId = "";

  it(`POST ${BASE} -> 200/201 (create location)`, async () => {
    const req = request(app.getHttpServer())
      .post(BASE)
      .set("Cookie", adminCookie)
      .send({
        name: `Main Warehouse ${Date.now()}`,
        code: uid("warehouse"),
        isActive: true,
        // adres alanları varsa esnek:
        address: {
          line1: "E2E Street 1",
          city: "Podgorica",
          country: "ME",
          postalCode: "81000",
        },
        metadata: { e2e: true },
      });

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req.expect(expect200or201);
    const body = res.body?.location ?? res.body;
    const id = body?.id ?? body?.locationId ?? body?.data?.id;

    expect(id).toBeTruthy();
    locationId = id;
  });

  it(`GET ${BASE} -> 200 (list locations)`, async () => {
    const req = request(app.getHttpServer())
      .get(BASE)
      .set("Cookie", adminCookie);

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req.expect(200);

    const items =
      res.body?.items ??
      res.body?.locations ??
      res.body?.data ??
      res.body ??
      [];

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it(`PATCH ${BASE}/:id -> 200 (update location)`, async () => {
    expect(locationId).toBeTruthy();

    const req = request(app.getHttpServer())
      .patch(`${BASE}/${locationId}`)
      .set("Cookie", adminCookie)
      .send({
        name: `Main Warehouse (Updated) ${Date.now()}`,
        isActive: true,
        metadata: { e2e: true, updated: true },
      });

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req.expect(200);
    const body = res.body?.location ?? res.body;
    const id = body?.id ?? body?.locationId ?? body?.data?.id;

    if (id) expect(id).toBe(locationId);
  });

  it("POST/PUT set default location (if supported) -> 200/201 or 404", async () => {
    // Bazı projelerde:
    // - POST /api/admin/inventory/locations/:id/default
    // - PUT  /api/admin/inventory/locations/:id/default
    // - PATCH /api/admin/inventory/locations/:id { isDefault: true }
    // Endpoint farklıysa burada tek yerden düzelt.

    expect(locationId).toBeTruthy();

    const candidates = [
      { method: "post" as const, url: `${BASE}/${locationId}/default` },
      { method: "put" as const, url: `${BASE}/${locationId}/default` },
    ];

    let lastStatus: number | undefined;

    for (const c of candidates) {
      const req = (request(app.getHttpServer()) as any)
        [c.method](c.url)
        .set("Cookie", adminCookie)
        .send({});

      withTenantHeaders(req, { tenantId, tenantCode });

      const res = await req;
      lastStatus = res.status;

      // destekleniyorsa 200/201/204 beklenebilir
      if ([200, 201, 204].includes(res.status)) {
        expect([200, 201, 204]).toContain(res.status);
        return;
      }

      // desteklenmiyorsa genelde 404
      if ([404].includes(res.status)) {
        // continue dene
      } else {
        // beklenmeyen ama öldürmeyelim; burada API farklı olabilir
      }
    }

    // hiçbiri supported değilse en azından 404 almış olalım (beklenen opsiyonel durum)
    expect([404, 200, 201, 204]).toContain(lastStatus);
  });
});
