import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";
import { loginAdmin } from "@test/utils/auth";

describe("[P00] Permissions Admin (gate e2e)", () => {
  let app: INestApplication;
  let adminCookie: string;

  beforeAll(async () => {
    app = await createE2EApp();
    adminCookie = (
      await loginAdmin(app, {
        email: fx.owner.email,
        password: fx.owner.password,
      })
    ).cookie;
  });

  afterAll(async () => {
    await app?.close();
  });

  it("GET /api/admin/permissions without cookie -> 401/403", async () => {
    const res = await api(app).get("/api/admin/permissions");
    expect([401, 403]).toContain(res.status);
  });

  it("GET /api/admin/permissions -> 200 + array (cookie-based)", async () => {
    const res = await api(app)
      .get("/api/admin/permissions")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
