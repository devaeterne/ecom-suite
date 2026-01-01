import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "@/app.module";

import { type HttpAgent } from "@test/helpers/http";
import { loginAdmin, loginStore, bearer } from "@test/helpers/auth";

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function tenantHeaders() {
  const tenantId = process.env.E2E_TENANT_ID;
  return tenantId ? { "x-tenant-id": tenantId } : {};
}

describe("90 - Catalog (Storefront)", () => {
  let app: INestApplication;

  let adminAgent: HttpAgent;
  let adminToken: string | undefined;

  let storeAgent: HttpAgent;
  let storeToken: string | undefined;

  let productId: string;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mod.createNestApplication();
    await app.init();

    const adminEmail = must("E2E_ADMIN_EMAIL");
    const adminPassword = must("E2E_ADMIN_PASSWORD");
    const storeEmail = must("E2E_STORE_EMAIL");
    const storePassword = must("E2E_STORE_PASSWORD");

    const adminLogin = await loginAdmin(app, adminEmail, adminPassword);
    adminAgent = adminLogin.agent;
    adminToken = adminLogin.accessToken;

    const storeLogin = await loginStore(app, storeEmail, storePassword);
    storeAgent = storeLogin.agent;
    storeToken = storeLogin.accessToken;

    // Seed: admin create + publish
    const cat = await adminAgent
      .post("/api/admin/categories")
      .set(tenantHeaders())
      .set(adminToken ? bearer(adminToken) : {})
      .send({ name: "Elektronik", handle: "elektronik-store" })
      .expect(201);

    const p = await adminAgent
      .post("/api/admin/products")
      .set(tenantHeaders())
      .set(adminToken ? bearer(adminToken) : {})
      .send({
        title: "iPhone 99",
        handle: "iphone-99",
        status: "draft",
        categoryIds: [cat.body.id],
        variants: [
          { title: "128GB", sku: "IP99-128", isActive: true },
          { title: "256GB", sku: "IP99-256", isActive: true },
        ],
      })
      .expect(201);

    productId = p.body.id as string;

    await adminAgent
      .post(`/api/admin/products/${productId}/publish`)
      .set(tenantHeaders())
      .set(adminToken ? bearer(adminToken) : {})
      .send({})
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/store/categories -> 200 + array", async () => {
    const res = await storeAgent
      .get("/api/store/categories")
      .set(tenantHeaders())
      .set(storeToken ? bearer(storeToken) : {})
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/store/categories/{id} -> 404 for missing", async () => {
    await storeAgent
      .get("/api/store/categories/00000000-0000-0000-0000-000000000999")
      .set(tenantHeaders())
      .set(storeToken ? bearer(storeToken) : {})
      .expect(404);
  });

  it("GET /api/store/collections -> 200 + array", async () => {
    const res = await storeAgent
      .get("/api/store/collections")
      .set(tenantHeaders())
      .set(storeToken ? bearer(storeToken) : {})
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/store/brands -> 200 + []", async () => {
    const res = await storeAgent
      .get("/api/store/brands")
      .set(tenantHeaders())
      .set(storeToken ? bearer(storeToken) : {})
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it("GET /api/store/products -> 200 + {items,total} includes published", async () => {
    const res = await storeAgent
      .get("/api/store/products?limit=20&offset=0")
      .set(tenantHeaders())
      .set(storeToken ? bearer(storeToken) : {})
      .expect(200);

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
      .set(tenantHeaders())
      .set(storeToken ? bearer(storeToken) : {})
      .expect(200);

    expect(res.body).toHaveProperty("id", productId);
    expect(Array.isArray(res.body.variants)).toBe(true);
  });

  it("GET /api/store/products/{id}/variants -> 200 array", async () => {
    const res = await storeAgent
      .get(`/api/store/products/${productId}/variants`)
      .set(tenantHeaders())
      .set(storeToken ? bearer(storeToken) : {})
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /api/store/products/{id} -> 404 for missing", async () => {
    await storeAgent
      .get("/api/store/products/00000000-0000-0000-0000-000000000999")
      .set(tenantHeaders())
      .set(storeToken ? bearer(storeToken) : {})
      .expect(404);
  });
});
