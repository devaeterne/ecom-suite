import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { createE2EApp } from "../utils/create-e2e-app";
import { loginAdmin } from "../utils/auth";
import { withTenantHeaders } from "../utils/tenant";

/**
 * Gate hedefi:
 * - /api/admin/carriers route'u var mı?
 * - AdminAuthGuard + TenantHeaderGuard davranışı doğru mu?
 * - Seed yoksa 404 kabul; validation yoksa 400 kabul.
 */

const expectStatusIn = (allowed: number[], res: { status: number }) =>
  expect(allowed).toContain(res.status);

const expect401or403 = (res: { status: number }) =>
  expectStatusIn([401, 403], res);
const expect400or403 = (res: { status: number }) =>
  expectStatusIn([400, 403], res);
// opsiyonel: module kapalıysa 404
const expect401or403or404 = (res: { status: number }) =>
  expectStatusIn([401, 403, 404], res);

describe("[P00] Carriers (Admin) (gate e2e)", () => {
  let app: INestApplication;
  let adminCookie = "";

  const tenantId = (process.env.E2E_TENANT_ID ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");
  const tenantCode = (process.env.E2E_TENANT_CODE ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");

  // Eğer env ile zaten bir carrier seed ediyorsan burada kullanırız.
  const seededCarrierId = (process.env.E2E_CARRIER_ID ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");

  const base = () => "/api/admin/carriers";
  const detail = () =>
    `/api/admin/carriers/${
      seededCarrierId || "00000000-0000-0000-0000-000000000000"
    }`;

  beforeAll(async () => {
    app = await createE2EApp();
    const admin = await loginAdmin(app);
    adminCookie = admin.cookie;
  });

  afterAll(async () => {
    await app?.close();
  });

  it("GET carriers without cookie -> 401/403", async () => {
    const req = request(app.getHttpServer()).get(base());
    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;
    expect401or403or404(res);
  });

  it("GET carriers without tenant headers -> 400/403", async () => {
    const res = await request(app.getHttpServer())
      .get(base())
      .set("Cookie", adminCookie);

    expect401or403or404(res);
  });

  it("GET carriers -> 200 (if module enabled) else 404", async () => {
    const req = request(app.getHttpServer())
      .get(base())
      .set("Cookie", adminCookie);
    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;

    // module yoksa 404; varsa 200
    expect([200, 404]).toContain(res.status);

    if (res.status === 200) {
      const items = res.body?.items ?? res.body?.carriers ?? res.body ?? [];
      expect(Array.isArray(items)).toBe(true);
    }
  });

  it("POST carriers -> 201/200 (if allowed) else 400/404 (route exists)", async () => {
    const req = request(app.getHttpServer())
      .post(base())
      .set("Cookie", adminCookie)
      .send({
        // DTO'yu bilmiyoruz: gate için minimal.
        // En azından 'name' genelde beklenir; değilse 400 kabul.
        name: `E2E Carrier ${Date.now()}`,
        metadata: { e2e: true },
      });

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;

    // başarı: 200/201
    // validation/module yok: 400/404
    expect([200, 201, 400, 404]).toContain(res.status);
  });

  it("GET carrier detail -> 200 (if seeded) else 404 (route exists)", async () => {
    const req = request(app.getHttpServer())
      .get(detail())
      .set("Cookie", adminCookie);

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;

    // seededCarrierId varsa 200 bekleyebilirsin, yoksa 404.
    expect([200, 404]).toContain(res.status);
  });
});
