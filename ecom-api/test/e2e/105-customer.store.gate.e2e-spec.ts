// test/e2e/105-customer.store.e2e-spec.ts
import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { fx } from "@test/helpers/fixtures";
import { loginAdmin, loginStore } from "@test/helpers/auth";

const expect200or201 = (res: any) => {
  expect([200, 201]).toContain(res.status);
};

describe("105 - Customer (Storefront) — profile & addresses", () => {
  let app: INestApplication;
  let adminAgent: any;
  let storeAgent: any;

  let tenantId: string;
  let tenantHeader: Record<string, string>;

  beforeAll(async () => {
    app = await createE2EApp();

    // ✅ login agents (cookie)
    const adminLogin = await loginAdmin(app, fx.owner.email, fx.owner.password);
    adminAgent = adminLogin.agent;

    const storeLogin = await loginStore(
      app,
      fx.storeUser.email,
      fx.storeUser.password
    );
    storeAgent = storeLogin.agent;

    // ✅ Tenant header must be UUID
    const me = await adminAgent.get("/api/admin/tenants/me").expect(200);
    tenantId = me.body?.id as string;
    tenantHeader = { "x-tenant-id": tenantId };
  });

  afterAll(async () => {
    await app?.close();
  });

  it("GET /api/store/customers/me -> 200 + customer", async () => {
    const res = await storeAgent
      .get("/api/store/customers/me")
      .set(tenantHeader)
      .expect(expect200or201);

    // Kontratınıza göre alanlar değişebilir; temel doğrulamalar:
    expect(res.body).toBeTruthy();
    expect(res.body).toHaveProperty("email");
    expect(res.body.email).toBe(fx.storeUser.email);

    // tenant scoping (opsiyonel)
    // expect(res.body).toHaveProperty("tenantId", tenantId);
  });

  it("PATCH /api/store/customers/me -> 200 + updated profile", async () => {
    const ts = Date.now();

    const payload = {
      firstName: `Buyer-${ts}`,
      lastName: `One-${ts}`,
      // varsa diğer alanlar: phone, locale vs.
    };

    const res = await storeAgent
      .patch("/api/store/customers/me")
      .set(tenantHeader)
      .send(payload)
      .expect(expect200or201);

    // API'niz "customer" veya direkt body döndürüyor olabilir:
    const customer = res.body?.customer ?? res.body;

    expect(customer).toBeTruthy();
    if (customer.firstName !== undefined)
      expect(customer.firstName).toBe(payload.firstName);
    if (customer.lastName !== undefined)
      expect(customer.lastName).toBe(payload.lastName);
  });

  // -------------------------
  // Addresses (sonra yapılacak)
  // -------------------------

  it.skip("GET /api/store/customers/me/addresses -> 200 + array", async () => {
    const res = await storeAgent
      .get("/api/store/customers/me/addresses")
      .set(tenantHeader)
      .expect(expect200or201);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it.skip("POST /api/store/customers/me/addresses -> create", async () => {
    const res = await storeAgent
      .post("/api/store/customers/me/addresses")
      .set(tenantHeader)
      .send({
        // örnek alanlar (siz address modelini yazınca netleşecek):
        // title: "Home",
        // country: "ME",
        // city: "Podgorica",
        // address1: "Some street",
        // zip: "81000",
      })
      .expect(expect200or201);

    expect(res.body).toBeTruthy();
  });

  it.skip("PATCH /api/store/customers/me/addresses/{id} -> update", async () => {
    const addressId = "TODO";

    await storeAgent
      .patch(`/api/store/customers/me/addresses/${addressId}`)
      .set(tenantHeader)
      .send({
        // update payload
      })
      .expect(expect200or201);
  });

  it.skip("DELETE /api/store/customers/me/addresses/{id} -> delete", async () => {
    const addressId = "TODO";

    await storeAgent
      .delete(`/api/store/customers/me/addresses/${addressId}`)
      .set(tenantHeader)
      .expect(expect200or201);
  });
});
