import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";
import {
  bearer,
  loginAdmin,
  refreshAdmin,
  logoutAdmin,
  logoutAllAdmin,
} from "@test/helpers/auth";

describe("Admin Auth (gate e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("login -> accessToken (or cookie), me -> 200", async () => {
    const { accessToken, agent } = await loginAdmin(
      app,
      fx.owner.email,
      fx.owner.password
    );

    // me with bearer if token exists
    if (accessToken) {
      await api(app)
        .get("/api/admin/auth/me")
        .set(bearer(accessToken))
        .expect(200);
    }

    // me with agent cookies (works if cookie-based)
    await agent.get("/api/admin/auth/me").expect(200);
  });

  it("refresh works (cookie agent)", async () => {
    const { agent } = await loginAdmin(app, fx.owner.email, fx.owner.password);

    await refreshAdmin(agent, 200); // adjust to 200 if needed
    await agent.get("/api/admin/auth/me").expect(200);
  });

  it("logout invalidates session (agent)", async () => {
    const { agent } = await loginAdmin(app, fx.owner.email, fx.owner.password);
    await logoutAdmin(agent, 200);
    await agent.get("/api/admin/auth/me").expect(401);
  });

  it("logout-all invalidates session (agent)", async () => {
    const { agent } = await loginAdmin(app, fx.owner.email, fx.owner.password);
    await logoutAllAdmin(agent, 200);
    await agent.get("/api/admin/auth/me").expect(401);
  });
});
