import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";
import { loginAdmin } from "@test/utils/auth";

describe("[P00] RBAC Bootstrap (gate e2e)", () => {
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

  it("bootstrap without cookie -> 401/403", async () => {
    const res = await api(app).post("/api/admin/rbac/bootstrap").send({});
    expect([401, 403]).toContain(res.status);
  });

  it("bootstrap is idempotent (cookie-based) -> 200/201", async () => {
    const run1 = await api(app)
      .post("/api/admin/rbac/bootstrap")
      .set("Cookie", adminCookie)
      .send({});
    expect([200, 201]).toContain(run1.status);

    const run2 = await api(app)
      .post("/api/admin/rbac/bootstrap")
      .set("Cookie", adminCookie)
      .send({});
    expect([200, 201]).toContain(run2.status);
  });
});
