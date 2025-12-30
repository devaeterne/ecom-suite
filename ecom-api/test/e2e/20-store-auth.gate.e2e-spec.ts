import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";
import {
  registerStoreUser,
  loginStore,
  refreshStore,
  logoutStore,
  logoutAllStore,
} from "@test/helpers/auth";

describe("Store Auth (gate e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2EApp();

    // ensure store user exists for login tests
    await registerStoreUser(app, {
      email: fx.storeUser.email,
      password: fx.storeUser.password,
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  it("login -> me 200 (agent)", async () => {
    const { agent } = await loginStore(
      app,
      fx.storeUser.email,
      fx.storeUser.password
    );
    await agent.get("/api/store/auth/me").expect(200);
  });

  it("refresh works", async () => {
    const { agent } = await loginStore(
      app,
      fx.storeUser.email,
      fx.storeUser.password
    );
    await refreshStore(agent, 201);
    await agent.get("/api/store/auth/me").expect(200);
  });

  it("logout invalidates session", async () => {
    const { agent } = await loginStore(
      app,
      fx.storeUser.email,
      fx.storeUser.password
    );
    await logoutStore(agent, 201);
    await agent.get("/api/store/auth/me").expect(401);
  });

  it("logout-all invalidates session", async () => {
    const { agent } = await loginStore(
      app,
      fx.storeUser.email,
      fx.storeUser.password
    );
    await logoutAllStore(agent, 201);
    await agent.get("/api/store/auth/me").expect(401);
  });

  it("register duplicate should fail gracefully (409 or 200/201 depending on policy)", async () => {
    const res = await api(app).post("/api/store/auth/register").send({
      email: fx.storeUser.email,
      password: fx.storeUser.password,
    });
    expect([200, 201, 409]).toContain(res.status);
  });
});
