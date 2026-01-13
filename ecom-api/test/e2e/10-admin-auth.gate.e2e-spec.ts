import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";
import { loginAdmin } from "@test/utils/auth";

describe("[P10] Admin Auth (gate e2e)", () => {
  let app: INestApplication;
  let adminCookie: string;

  beforeAll(async () => {
    app = await createE2EApp();

    // deterministic: use seeded fixture credentials
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

  it("GET /api/admin/auth/me without cookie -> 401/403", async () => {
    const res = await api(app).get("/api/admin/auth/me");
    expect([401, 403]).toContain(res.status);
  });

  it("GET /api/admin/auth/me with admin cookie -> 200", async () => {
    await api(app)
      .get("/api/admin/auth/me")
      .set("Cookie", adminCookie)
      .expect(200);
  });
});
