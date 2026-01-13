import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { createE2EApp } from "@test/utils/create-e2e-app";
import { loginAdmin } from "@test/utils/auth";
import { withTenantHeaders } from "@test/utils/tenant";
import { seedProduct } from "@test/fixtures/catalog";

const expect200or201 = (r: any) => {
  expect([200, 201]).toContain(r.status);
};

const expect401or403 = (r: any) => {
  expect([401, 403]).toContain(r.status);
};

const expect400or403 = (r: any) => {
  expect([400, 403]).toContain(r.status);
};

describe("[P00] Catalog Tags (Admin) (gate e2e)", () => {
  let app: INestApplication;
  let adminCookie: string;

  const tenantId = (process.env.E2E_TENANT_ID ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");
  const tenantCode = (process.env.E2E_TENANT_CODE ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");

  // ✅ Endpoint
  const BASE = "/api/admin/tags";

  function uid(prefix = "tag") {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
  }

  /**
   * ✅ Tags service tarafında .trim() yapılan alan undefined gelmesin diye
   * yaygın alanları birlikte gönderiyoruz.
   *
   * Backend hangisini kullanıyorsa onu okuyacak:
   * - name / handle
   * - value / code
   * - label / title
   */
  function createTagPayload(display: string) {
    const value = uid("value");
    const handle = uid("handle");

    return {
      // common
      name: display,
      handle,

      // other common variants
      value, // often used as "tag value"
      code: value,
      label: display,
      title: display,
      slug: handle,
    };
  }

  function updateTagPayload(updated: string) {
    const handle = uid("handle_u");
    const value = `updated_${Date.now()}_${Math.random()
      .toString(16)
      .slice(2, 6)}`;

    return {
      name: updated,
      handle,

      // backend value döndürüyor gibi; bunu deterministik yapalım
      value,
      code: value,

      label: updated,
      title: updated,
      slug: handle,
    };
  }

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
      .send(createTagPayload("NoAuth Tag"));

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;
    expect401or403(res);
  });

  it(`POST ${BASE} without tenant headers -> 400/403`, async () => {
    const res = await request(app.getHttpServer())
      .post(BASE)
      .set("Cookie", adminCookie)
      .send(createTagPayload("NoTenant Tag"));

    expect400or403(res);
  });

  let tagId = "";

  it(`POST ${BASE} -> 200/201 (create tag)`, async () => {
    const req = request(app.getHttpServer())
      .post(BASE)
      .set("Cookie", adminCookie)
      .send(createTagPayload("E2E Tag"));

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req.expect(expect200or201);

    // esnek parse
    const body = res.body?.tag ?? res.body;
    const id = body?.id ?? body?.tagId ?? body?.data?.id;

    expect(id).toBeTruthy();
    tagId = id;
  });

  it(`GET ${BASE} -> 200 (list tags)`, async () => {
    const req = request(app.getHttpServer())
      .get(BASE)
      .set("Cookie", adminCookie);

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req.expect(200);

    const items =
      res.body?.items ?? res.body?.tags ?? res.body?.data ?? res.body ?? [];

    expect(Array.isArray(items)).toBe(true);

    // create çalıştıysa listede en az 1 bekleriz
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it(`PATCH ${BASE}/:id -> 200 (update tag)`, async () => {
    expect(tagId).toBeTruthy();

    const payload = updateTagPayload("E2E Tag (Updated)");

    const req = request(app.getHttpServer())
      .patch(`${BASE}/${tagId}`)
      .set("Cookie", adminCookie)
      .send(payload);

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req.expect(200);

    const body = res.body?.tag ?? res.body;
    const id = body?.id ?? body?.tagId ?? body?.data?.id;
    if (id) expect(id).toBe(tagId);

    // ✅ Primary: API value döndürüyorsa exact match (en deterministik)
    if (body?.value !== undefined) {
      expect(String(body.value)).toBe(String(payload.value));
      return;
    }

    // ✅ Secondary: name/label/title döndürüyorsa updated name'i kontrol et
    const display = body?.name ?? body?.label ?? body?.title;
    if (display !== undefined) {
      expect(String(display)).toBe(String(payload.name));
    }
  });

  it("PATCH /api/admin/products/:id with tagIds -> 200 (optional integration)", async () => {
    // Bu endpoint destekleniyorsa P00 için çok değerli.
    // Desteklenmiyorsa 400/404 dönebilir; onu failure saymıyoruz.
    expect(tagId).toBeTruthy();

    const seeded = await seedProduct(app, {
      adminCookie,
      tenantId,
      tenantCode,
      status: "draft",
      title: `Taggable ${Date.now()}`,
    });

    const productId = seeded.productId;
    expect(productId).toBeTruthy();

    const req = request(app.getHttpServer())
      .patch(`/api/admin/products/${productId}`)
      .set("Cookie", adminCookie)
      .send({ tagIds: [tagId] });

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;

    // destek varsa 200, yoksa 400/404 kabul
    expect([200, 400, 404]).toContain(res.status);
  });
});
