// test/e2e/105-customer.store.gate.e2e-spec.ts
import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";
import { loginAdmin, loginStore } from "@test/helpers/auth";

const expect200or201 = (res: any) => {
  expect([200, 201]).toContain(res.status);
};

const expect401or403 = (res: any) => {
  expect([401, 403]).toContain(res.status);
};

describe("[P00] Customer (Storefront) — profile (gate e2e)", () => {
  let app: INestApplication;

  let adminAgent: any;
  let storeAgent: any;

  let tenantId!: string;
  let tenantHeader!: Record<string, string>;

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

    const me = await adminAgent.get("/api/admin/tenants/me").expect(200);
    tenantId = me.body?.id as string;
    tenantHeader = { "x-tenant-id": tenantId };
  });

  afterAll(async () => {
    await app?.close();
  });

  // -----------------------------------------
  // NOTE: Bu API'de tenant header ZORUNLU DEĞİL
  // (cookie/session tenant resolve edebiliyor)
  // -----------------------------------------
  it("GET /api/store/customers/me without tenant headers -> 200/201 (tenant header optional)", async () => {
    const res = await storeAgent.get("/api/store/customers/me");
    expect200or201(res);
  });

  it("PATCH /api/store/customers/me without tenant headers -> 200/201 (tenant header optional)", async () => {
    const res = await storeAgent
      .patch("/api/store/customers/me")
      .send({ firstName: "X" });
    expect200or201(res);
  });

  // -------------------------
  // NEGATIVE: cookie yok
  // -------------------------
  it("GET /api/store/customers/me without cookie -> 401/403", async () => {
    const res = await api(app).get("/api/store/customers/me").set(tenantHeader);
    expect401or403(res);
  });

  it("PATCH /api/store/customers/me without cookie -> 401/403", async () => {
    const res = await api(app)
      .patch("/api/store/customers/me")
      .set(tenantHeader)
      .send({ firstName: "X" });
    expect401or403(res);
  });

  // -------------------------
  // POSITIVE: tenant header ile
  // -------------------------
  it("GET /api/store/customers/me -> 200 + customer", async () => {
    const res = await storeAgent
      .get("/api/store/customers/me")
      .set(tenantHeader)
      .expect(expect200or201);

    const customer = res.body?.customer ?? res.body;

    expect(customer).toBeTruthy();
    expect(customer).toHaveProperty("email");
    expect(customer.email).toBe(fx.storeUser.email);
  });

  it("PATCH /api/store/customers/me -> 200 + updated profile", async () => {
    const ts = Date.now();
    const payload = { firstName: `Buyer-${ts}`, lastName: `One-${ts}` };

    const res = await storeAgent
      .patch("/api/store/customers/me")
      .set(tenantHeader)
      .send(payload)
      .expect(expect200or201);

    const customer = res.body?.customer ?? res.body;

    expect(customer).toBeTruthy();
    if (customer.firstName !== undefined)
      expect(customer.firstName).toBe(payload.firstName);
    if (customer.lastName !== undefined)
      expect(customer.lastName).toBe(payload.lastName);
  });
});
