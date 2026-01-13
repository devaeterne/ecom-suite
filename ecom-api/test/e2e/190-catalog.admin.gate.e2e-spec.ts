// test/e2e/190-catalog.admin.gate.e2e-spec.ts
import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { fx } from "@test/helpers/fixtures";
import { loginAdmin } from "@test/helpers/auth";

/**
 * ✅ E2E policy: bazı write endpointleri 200 veya 201 dönebilir.
 * Bu yüzden status validation'ı deterministic yapıyoruz.
 */
const expect200or201 = (r: any) => {
  if (![200, 201].includes(r.status)) {
    throw new Error(
      `Expected 200/201, got ${r.status} - body: ${JSON.stringify(r.body)}`
    );
  }
};

describe("[P00] 190 - Catalog (Admin) (gate e2e)", () => {
  let app: INestApplication;
  let adminAgent: any;

  let tenantId: string;
  let tenantHeader: Record<string, string>;

  beforeAll(async () => {
    app = await createE2EApp();

    const adminLogin = await loginAdmin(app, fx.owner.email, fx.owner.password);
    adminAgent = adminLogin.agent;

    // ✅ Tenant header must be UUID (not "acme" code)
    // Bu endpoint policy'si net: 200 dönmesi beklenir.
    const me = await adminAgent.get("/api/admin/tenants/me").expect(200);

    tenantId = me.body?.id as string;
    expect(tenantId).toBeTruthy();

    tenantHeader = { "x-tenant-id": tenantId };
  });

  afterAll(async () => {
    await app?.close();
  });

  it("POST /api/admin/categories -> create", async () => {
    const ts = Date.now();

    const res = await adminAgent
      .post("/api/admin/categories")
      .set(tenantHeader)
      .send({ name: "Elektronik", handle: `elektronik-${ts}` })
      .expect(expect200or201);

    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Elektronik");
  });

  it("PATCH /api/admin/categories/{id} -> update", async () => {
    const ts = Date.now();

    const created = await adminAgent
      .post("/api/admin/categories")
      .set(tenantHeader)
      .send({ name: "Elektronik", handle: `elektronik-upd-${ts}` })
      .expect(expect200or201);

    const id = created.body.id as string;

    const res = await adminAgent
      .patch(`/api/admin/categories/${id}`)
      .set(tenantHeader)
      .send({ name: "Telefon", handle: `telefon-${ts}` })
      .expect(expect200or201);

    expect(res.body).toHaveProperty("id", id);
    expect(res.body.name).toBe("Telefon");
  });

  it("POST /api/admin/products -> create (draft)", async () => {
    const ts = Date.now();

    const cat = await adminAgent
      .post("/api/admin/categories")
      .set(tenantHeader)
      .send({ name: "Aksesuar", handle: `aksesuar-${ts}` })
      .expect(expect200or201);

    const categoryId = cat.body.id as string;

    const res = await adminAgent
      .post("/api/admin/products")
      .set(tenantHeader)
      .send({
        title: "Kablo",
        handle: `kablo-${ts}`,
        status: "draft",
        categoryIds: [categoryId],
        variants: [{ title: "Tekli", sku: `KBL-1-${ts}`, isActive: true }],
      })
      .expect(expect200or201);

    expect(res.body).toHaveProperty("id");
    expect(res.body.status).toBe("draft");
    expect(Array.isArray(res.body.variants)).toBe(true);
  });

  it("PATCH /api/admin/products/{id} -> update", async () => {
    const ts = Date.now();

    const cat = await adminAgent
      .post("/api/admin/categories")
      .set(tenantHeader)
      .send({ name: "Bilgisayar", handle: `bilgisayar-${ts}` })
      .expect(expect200or201);

    const categoryId = cat.body.id as string;

    const created = await adminAgent
      .post("/api/admin/products")
      .set(tenantHeader)
      .send({
        title: "Laptop X",
        handle: `laptop-x-${ts}`,
        status: "draft",
        categoryIds: [categoryId],
        variants: [{ title: "16GB", sku: `LTX-16-${ts}`, isActive: true }],
      })
      .expect(expect200or201);

    const id = created.body.id as string;

    const res = await adminAgent
      .patch(`/api/admin/products/${id}`)
      .set(tenantHeader)
      .send({ title: "Laptop X (Rev1)" })
      .expect(expect200or201);

    expect(res.body).toHaveProperty("id", id);
    expect(res.body.title).toBe("Laptop X (Rev1)");
  });

  it("POST /api/admin/products/{id}/publish -> publish", async () => {
    const ts = Date.now();

    const cat = await adminAgent
      .post("/api/admin/categories")
      .set(tenantHeader)
      .send({ name: "Ev", handle: `ev-${ts}` })
      .expect(expect200or201);

    const categoryId = cat.body.id as string;

    const created = await adminAgent
      .post("/api/admin/products")
      .set(tenantHeader)
      .send({
        title: "Aydınlatma",
        handle: `aydinlatma-${ts}`,
        status: "draft",
        categoryIds: [categoryId],
        variants: [{ title: "Standart", sku: `AYD-STD-${ts}`, isActive: true }],
      })
      .expect(expect200or201);

    const id = created.body.id as string;

    const res = await adminAgent
      .post(`/api/admin/products/${id}/publish`)
      .set(tenantHeader)
      .send({})
      .expect(expect200or201);

    expect(res.body).toHaveProperty("id", id);
    expect(res.body.status).toBe("published");
  });
});
