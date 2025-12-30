import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";
import { loginAdmin, bearer } from "@test/helpers/auth";

describe("Tenant Admin (gate e2e)", () => {
  let app: INestApplication;
  let ownerToken!: string;

  beforeAll(async () => {
    app = await createE2EApp();
    const { accessToken } = await loginAdmin(
      app,
      fx.owner.email,
      fx.owner.password
    );
    if (!accessToken) throw new Error("accessToken missing");
    ownerToken = accessToken;
  });

  afterAll(async () => {
    await app?.close();
  });

  it("GET /api/admin/tenants/me -> 200", async () => {
    await api(app)
      .get("/api/admin/tenants/me")
      .set(bearer(ownerToken))
      .expect(200);
  });

  it("PATCH /api/admin/tenants/me -> 200 (minimal patch)", async () => {
    const res = await api(app)
      .patch("/api/admin/tenants/me")
      .set(bearer(ownerToken))
      .send({ name: "Acme Updated" })
      .expect((r) => {
        if (![200, 201].includes(r.status))
          throw new Error(`Expected 200/201, got ${r.status}`);
      });

    expect(res.body).toBeTruthy();
  });
});
