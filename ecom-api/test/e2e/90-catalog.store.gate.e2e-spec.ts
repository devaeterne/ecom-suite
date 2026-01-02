// test/e2e/90-catalog.store.gate.e2e-spec.ts
import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { fx } from "@test/helpers/fixtures";
import { loginAdmin, loginStore } from "@test/helpers/auth";

const expect200or201 = (res: any) => {
  expect([200, 201]).toContain(res.status);
};

describe("90 - Catalog (Storefront)", () => {
  let app: INestApplication;
  let adminAgent: any;
  let storeAgent: any;

  let tenantId: string;
  let tenantHeader: Record<string, string>;

  let categoryId: string;
  let productId: string;

  beforeAll(async () => {
    app = await createE2EApp();

    const adminLogin = await loginAdmin(app, fx.owner.email, fx.owner.password);
    adminAgent = adminLogin.agent;

    const storeLogin = await loginStore(
      app,
      fx.storeUser.email,
      fx.storeUser.password
    );
    storeAgent = storeLogin.agent;

    // ✅ Tenant header must be UUID (not "acme" code)
    const me = await adminAgent.get("/api/admin/tenants/me").expect(200);
    tenantId = me.body?.id as string;
    tenantHeader = { "x-tenant-id": tenantId };

    // Seed: admin create + publish (store testleri için deterministik veri)
    const ts = Date.now();

    const cat = await adminAgent
      .post("/api/admin/categories")
      .set(tenantHeader)
      .send({ name: "Elektronik", handle: `elektronik-store-${ts}` })
      .expect(expect200or201);

    categoryId = cat.body.id as string;

    const p = await adminAgent
      .post("/api/admin/products")
      .set(tenantHeader)
      .send({
        title: "iPhone 99",
        handle: `iphone-99-${ts}`,
        status: "draft",
        categoryIds: [categoryId],
        variants: [
          { title: "128GB", sku: `IP99-128-${ts}`, isActive: true },
          { title: "256GB", sku: `IP99-256-${ts}`, isActive: true },
        ],
      })
      .expect(expect200or201);

    productId = p.body.id as string;

    await adminAgent
      .post(`/api/admin/products/${productId}/publish`)
      .set(tenantHeader)
      .send({})
      .expect(expect200or201);
  });

  afterAll(async () => {
    await app?.close();
  });

  it("GET /api/store/categories -> 200 + array", async () => {
    const res = await storeAgent
      .get("/api/store/categories")
      .set(tenantHeader)
      .expect(expect200or201);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/store/categories/{id} -> 200 detail", async () => {
    const res = await storeAgent
      .get(`/api/store/categories/${categoryId}`)
      .set(tenantHeader)
      .expect(expect200or201);

    expect(res.body).toHaveProperty("id", categoryId);
  });

  it("GET /api/store/categories/{id} -> 404 for missing", async () => {
    await storeAgent
      .get("/api/store/categories/00000000-0000-0000-0000-000000000999")
      .set(tenantHeader)
      .expect(404);
  });

  it("GET /api/store/collections -> 200 + array", async () => {
    const res = await storeAgent
      .get("/api/store/collections")
      .set(tenantHeader)
      .expect(expect200or201);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/store/brands -> 200 + [] (brands=[])", async () => {
    const res = await storeAgent
      .get("/api/store/brands")
      .set(tenantHeader)
      .expect(expect200or201);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual([]);
  });

  it("GET /api/store/products -> 200 + {items,total} includes published", async () => {
    const res = await storeAgent
      .get("/api/store/products?limit=20&offset=0")
      .set(tenantHeader)
      .expect(expect200or201);

    expect(res.body).toHaveProperty("items");
    expect(res.body).toHaveProperty("total");
    expect(Array.isArray(res.body.items)).toBe(true);

    const found = res.body.items.find((p: any) => p.id === productId);
    expect(found).toBeTruthy();
    expect(found.status).toBe("published");
  });

  it("GET /api/store/products/{id} -> 200 detail", async () => {
    const res = await storeAgent
      .get(`/api/store/products/${productId}`)
      .set(tenantHeader)
      .expect(expect200or201);

    expect(res.body).toHaveProperty("id", productId);
    expect(Array.isArray(res.body.variants)).toBe(true);
  });

  it("GET /api/store/products/{id}/variants -> 200 array", async () => {
    const res = await storeAgent
      .get(`/api/store/products/${productId}/variants`)
      .set(tenantHeader)
      .expect(expect200or201);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /api/store/products/{id} -> 404 for missing", async () => {
    await storeAgent
      .get("/api/store/products/00000000-0000-0000-0000-000000000999")
      .set(tenantHeader)
      .expect(404);
  });
});
20;
