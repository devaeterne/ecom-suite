// test/e2e/90-catalog.store.gate.e2e-spec.ts
import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";

import { loginAdmin, loginStore } from "@test/utils/auth";
import { withTenantHeaders } from "@test/utils/tenant";

const expect200or201 = (status: number) => expect([200, 201]).toContain(status);

describe("[P00] Catalog (Storefront) (gate e2e)", () => {
  let app: INestApplication;

  let adminCookie: string;
  let storeCookie: string;

  let tenantId: string;
  let tenantCode: string;

  let categoryId: string;
  let productId: string;

  beforeAll(async () => {
    app = await createE2EApp();

    adminCookie = (
      await loginAdmin(app, {
        email: fx.owner.email,
        password: fx.owner.password,
      })
    ).cookie;

    storeCookie = (
      await loginStore(app, {
        email: fx.storeUser.email,
        password: fx.storeUser.password,
      })
    ).cookie;

    //tenant context (id + code)
    const me = await api(app)
      .get("/api/admin/tenants/me")
      .set("Cookie", adminCookie)
      .expect(200);

    tenantId = me.body?.id as string;
    tenantCode = (me.body?.code as string) ?? "test";

    if (!tenantId)
      throw new Error(
        "[catalog.store.gate] tenantId missing from /admin/tenants/me"
      );

    //Seed: admin create + publish (store testleri için deterministik veri)
    const ts = Date.now();

    const catReq = api(app)
      .post("/api/admin/categories")
      .set("Cookie", adminCookie);

    withTenantHeaders(catReq, { tenantId, tenantCode });

    const catRes = await catReq.send({
      name: "Elektronik",
      handle: `elektronik-store-${ts}`,
    });

    expect200or201(catRes.status);
    categoryId = catRes.body?.id as string;
    if (!categoryId) throw new Error("[catalog.store.gate] categoryId missing");

    const prodReq = api(app)
      .post("/api/admin/products")
      .set("Cookie", adminCookie);

    withTenantHeaders(prodReq, { tenantId, tenantCode });

    const pRes = await prodReq.send({
      title: "iPhone 99",
      handle: `iphone-99-${ts}`,
      status: "draft",
      categoryIds: [categoryId],
      variants: [
        { title: "128GB", sku: `IP99-128-${ts}`, isActive: true },
        { title: "256GB", sku: `IP99-256-${ts}`, isActive: true },
      ],
    });

    expect200or201(pRes.status);
    productId = pRes.body?.id as string;
    if (!productId) throw new Error("[catalog.store.gate] productId missing");

    const pubReq = api(app)
      .post(`/api/admin/products/${productId}/publish`)
      .set("Cookie", adminCookie);

    withTenantHeaders(pubReq, { tenantId, tenantCode });

    const pubRes = await pubReq.send({});
    expect200or201(pubRes.status);
  });

  afterAll(async () => {
    await app?.close();
  });

  // ------------------------------------------------------------
  // Security / tenant contract (regression alarm)
  // ------------------------------------------------------------
  it("GET /api/store/categories without tenant headers -> 400/403", async () => {
    const res = await api(app)
      .get("/api/store/categories")
      .set("Cookie", storeCookie);

    expect([400, 403]).toContain(res.status);
  });

  it("GET /api/store/categories without cookie -> 200 (public)", async () => {
    const req = api(app).get("/api/store/categories");
    withTenantHeaders(req, { tenantId, tenantCode });
    const res = await req;

    expect([200, 201]).toContain(res.status);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/store/categories/{id} -> 200 detail", async () => {
    const req = api(app)
      .get(`/api/store/categories/${categoryId}`)
      .set("Cookie", storeCookie);

    withTenantHeaders(req, { tenantId, tenantCode });
    const res = await req;

    expect200or201(res.status);
    expect(res.body).toHaveProperty("id", categoryId);
  });

  it("GET /api/store/categories/{id} -> 404 for missing", async () => {
    const req = api(app)
      .get("/api/store/categories/00000000-0000-0000-0000-000000000999")
      .set("Cookie", storeCookie);

    withTenantHeaders(req, { tenantId, tenantCode });
    await req.expect(404);
  });

  it("GET /api/store/collections -> 200 + array", async () => {
    const req = api(app)
      .get("/api/store/collections")
      .set("Cookie", storeCookie);

    withTenantHeaders(req, { tenantId, tenantCode });
    const res = await req;

    expect200or201(res.status);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/store/brands -> 200 + [] (brands=[])", async () => {
    const req = api(app).get("/api/store/brands").set("Cookie", storeCookie);

    withTenantHeaders(req, { tenantId, tenantCode });
    const res = await req;

    expect200or201(res.status);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual([]);
  });

  it("GET /api/store/products -> 200 + {items,total} includes published", async () => {
    const req = api(app)
      .get("/api/store/products?limit=20&offset=0")
      .set("Cookie", storeCookie);

    withTenantHeaders(req, { tenantId, tenantCode });
    const res = await req;

    expect200or201(res.status);

    expect(res.body).toHaveProperty("items");
    expect(res.body).toHaveProperty("total");
    expect(Array.isArray(res.body.items)).toBe(true);

    const found = res.body.items.find((p: any) => p.id === productId);
    expect(found).toBeTruthy();
    expect(found.status).toBe("published");
  });

  it("GET /api/store/products/{id} -> 200 detail", async () => {
    const req = api(app)
      .get(`/api/store/products/${productId}`)
      .set("Cookie", storeCookie);

    withTenantHeaders(req, { tenantId, tenantCode });
    const res = await req;

    expect200or201(res.status);
    expect(res.body).toHaveProperty("id", productId);
    expect(Array.isArray(res.body.variants)).toBe(true);
  });

  it("GET /api/store/products/{id}/variants -> 200 array", async () => {
    const req = api(app)
      .get(`/api/store/products/${productId}/variants`)
      .set("Cookie", storeCookie);

    withTenantHeaders(req, { tenantId, tenantCode });
    const res = await req;

    expect200or201(res.status);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /api/store/products/{id} -> 404 for missing", async () => {
    const req = api(app)
      .get("/api/store/products/00000000-0000-0000-0000-000000000999")
      .set("Cookie", storeCookie);

    withTenantHeaders(req, { tenantId, tenantCode });
    await req.expect(404);
  });
});
