import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";
import { loginAdmin, bearer } from "@test/helpers/auth";

describe("Permissions Admin (gate e2e)", () => {
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

  it("GET /api/admin/permissions -> 200 + array", async () => {
    const res = await api(app)
      .get("/api/admin/permissions")
      .set(bearer(ownerToken))
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
