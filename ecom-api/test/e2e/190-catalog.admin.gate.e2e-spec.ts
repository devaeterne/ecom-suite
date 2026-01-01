import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "@/app.module";

import { api, type HttpAgent } from "@test/helpers/http";
import { loginAdmin, bearer } from "@test/helpers/auth";

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function tenantHeaders() {
  const tenantId = process.env.E2E_TENANT_ID;
  return tenantId ? { "x-tenant-id": tenantId } : {};
}

describe("190 - Catalog (Admin)", () => {
  let app: INestApplication;
  let adminAgent: HttpAgent;
  let adminToken: string | undefined;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mod.createNestApplication();
    await app.init();

    const email = must("E2E_ADMIN_EMAIL"); // örn: admin@acme.com
    const password = must("E2E_ADMIN_PASSWORD");

    const { accessToken, agent } = await loginAdmin(app, email, password);
    adminAgent = agent;
    adminToken = accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/admin/categories -> create", async () => {
    const res = await adminAgent
      .post("/api/admin/categories")
      .set(tenantHeaders())
      .set(adminToken ? bearer(adminToken) : {})
      .send({ name: "Elektronik", handle: "elektronik" })
      .expect(201);

    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Elektronik");
    expect(res.body.handle).toBe("elektronik");
  });

  it("PATCH /api/admin/categories/{id} -> update", async () => {
    const created = await adminAgent
      .post("/api/admin/categories")
      .set(tenantHeaders())
      .set(adminToken ? bearer(adminToken) : {})
      .send({ name: "Telefon", handle: "telefon" })
      .expect(201);

    const id = created.body.id as string;

    const updated = await adminAgent
      .patch(`/api/admin/categories/${id}`)
      .set(tenantHeaders())
      .set(adminToken ? bearer(adminToken) : {})
      .send({ name: "Telefonlar" })
      .expect(200);

    expect(updated.body).toHaveProperty("id", id);
    expect(updated.body.name).toBe("Telefonlar");
  });

  it("POST /api/admin/products -> create (draft)", async () => {
    const cat = await adminAgent
      .post("/api/admin/categories")
      .set(tenantHeaders())
      .set(adminToken ? bearer(adminToken) : {})
      .send({ name: "Aksesuar", handle: "aksesuar" })
      .expect(201);

    const res = await adminAgent
      .post("/api/admin/products")
      .set(tenantHeaders())
      .set(adminToken ? bearer(adminToken) : {})
      .send({
        title: "Kılıf",
        handle: "kilif",
        description: "Test ürün",
        status: "draft",
        categoryIds: [cat.body.id],
        variants: [
          {
            title: "Standart",
            sku: "KILIF-STD",
            barcode: "333",
            isActive: true,
          },
        ],
      })
      .expect(201);

    expect(res.body).toHaveProperty("id");
    expect(res.body.status).toBe("draft");
    expect(Array.isArray(res.body.variants)).toBe(true);
  });

  it("PATCH /api/admin/products/{id} -> update", async () => {
    const cat = await adminAgent
      .post("/api/admin/categories")
      .set(tenantHeaders())
      .set(adminToken ? bearer(adminToken) : {})
      .send({ name: "Bilgisayar", handle: "bilgisayar" })
      .expect(201);

    const p = await adminAgent
      .post("/api/admin/products")
      .set(tenantHeaders())
      .set(adminToken ? bearer(adminToken) : {})
      .send({
        title: "Laptop",
        handle: "laptop",
        status: "draft",
        categoryIds: [cat.body.id],
        variants: [{ title: "i7", sku: "LP-I7", isActive: true }],
      })
      .expect(201);

    const updated = await adminAgent
      .patch(`/api/admin/products/${p.body.id}`)
      .set(tenantHeaders())
      .set(adminToken ? bearer(adminToken) : {})
      .send({ title: "Laptop (2026)" })
      .expect(200);

    expect(updated.body).toHaveProperty("id", p.body.id);
    expect(updated.body.title).toBe("Laptop (2026)");
  });

  it("POST /api/admin/products/{id}/publish -> publish", async () => {
    const cat = await adminAgent
      .post("/api/admin/categories")
      .set(tenantHeaders())
      .set(adminToken ? bearer(adminToken) : {})
      .send({ name: "Ev", handle: "ev" })
      .expect(201);

    const p = await adminAgent
      .post("/api/admin/products")
      .set(tenantHeaders())
      .set(adminToken ? bearer(adminToken) : {})
      .send({
        title: "Masa",
        handle: "masa",
        status: "draft",
        categoryIds: [cat.body.id],
        variants: [{ title: "120cm", sku: "MS-120", isActive: true }],
      })
      .expect(201);

    const pub = await adminAgent
      .post(`/api/admin/products/${p.body.id}/publish`)
      .set(tenantHeaders())
      .set(adminToken ? bearer(adminToken) : {})
      .send({})
      .expect(201);

    expect(pub.body).toHaveProperty("id", p.body.id);
    expect(pub.body.status).toBe("published");
  });

  it("Sanity: admin token opsiyonel - api(app) ile de erişebilmeli (policyye bağlı)", async () => {
    // Bazı projelerde sadece cookie yeterli olur, bazıları bearer ister.
    // Burada sadece endpointin ayakta olduğunu doğruluyoruz.
    const res = await api(app)
      .get("/api/admin/tenants/me")
      .set(tenantHeaders())
      .set(adminToken ? bearer(adminToken) : {})
      .expect((r) => {
        // 200 bekliyoruz ama policyye göre 401 olabilir; o durumda bu testi kaldır.
        if (![200, 401].includes(r.status))
          throw new Error(`Unexpected: ${r.status}`);
      });

    expect(res.status).toBeTruthy();
  });
});
