import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";
import { loginAdmin } from "@test/utils/auth";

describe("[P00] Tenant Admin (gate e2e)", () => {
  let app: INestApplication;
  let ownerCookie: string;

  beforeAll(async () => {
    app = await createE2EApp();
    ownerCookie = (
      await loginAdmin(app, {
        email: fx.owner.email,
        password: fx.owner.password,
      })
    ).cookie;
  });

  afterAll(async () => {
    await app?.close();
  });

  // ------------------------------------------------------------
  // Security contract (regression alarm)
  // ------------------------------------------------------------
  it("GET /api/admin/tenants/me without cookie -> 401/403", async () => {
    const res = await api(app).get("/api/admin/tenants/me");
    expect([401, 403]).toContain(res.status);
  });

  it("GET /api/admin/tenants/me -> 200 (cookie-based)", async () => {
    await api(app)
      .get("/api/admin/tenants/me")
      .set("Cookie", ownerCookie)
      .expect(200);
  });

  it("PATCH /api/admin/tenants/me -> 200/201 (minimal patch)", async () => {
    const ts = Date.now();

    const res = await api(app)
      .patch("/api/admin/tenants/me")
      .set("Cookie", ownerCookie)
      .send({ name: `Acme Updated ${ts}` });

    expect([200, 201]).toContain(res.status);
    expect(res.body).toBeTruthy();
  });
});
