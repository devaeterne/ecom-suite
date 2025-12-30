import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";
import { loginAdmin, bearer } from "@test/helpers/auth";

describe("Identities Admin (gate e2e)", () => {
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

  it("owner can create identity (STAFF)", async () => {
    const res = await api(app)
      .post("/api/admin/identities")
      .set(bearer(ownerToken))
      .send({
        email: fx.identity.email,
        roleScope: fx.identity.roleScope,
      })
      .expect(201);

    expect(res.body?.id).toBeTruthy();
  });

  it("owner can list identities", async () => {
    const res = await api(app)
      .get("/api/admin/identities")
      .set(bearer(ownerToken))
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
