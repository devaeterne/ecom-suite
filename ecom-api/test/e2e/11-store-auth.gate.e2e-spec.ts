import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";

import { loginStore } from "@test/utils/auth";

describe("[P00] Store Auth (gate e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  // ------------------------------------------------------------
  // Security contract (regression alarm)
  // ------------------------------------------------------------
  it("GET /api/store/auth/me without cookie -> 401/403", async () => {
    const res = await api(app).get("/api/store/auth/me");
    expect([401, 403]).toContain(res.status);
  });

  it("login -> me -> 200 (cookie)", async () => {
    const { cookie } = await loginStore(app, {
      email: fx.storeUser.email,
      password: fx.storeUser.password,
    });

    await api(app).get("/api/store/auth/me").set("Cookie", cookie).expect(200);
  });

  it("refresh works (cookie-based)", async () => {
    const { agent } = await loginStore(app, {
      email: fx.storeUser.email,
      password: fx.storeUser.password,
    });

    // refresh cookie endpoint uses cookie auth
    const r = await agent.post("/api/store/auth/refresh").send({});
    expect([200, 201]).toContain(r.status);

    await agent.get("/api/store/auth/me").expect(200);
  });

  it("logout invalidates session (cookie-based)", async () => {
    const { agent } = await loginStore(app, {
      email: fx.storeUser.email,
      password: fx.storeUser.password,
    });

    const out = await agent.post("/api/store/auth/logout").send({});
    expect([200, 201]).toContain(out.status);

    const me = await agent.get("/api/store/auth/me");
    expect([401, 403]).toContain(me.status);
  });

  it("logout-all invalidates session (cookie-based)", async () => {
    const { agent } = await loginStore(app, {
      email: fx.storeUser.email,
      password: fx.storeUser.password,
    });

    const outAll = await agent.post("/api/store/auth/logout-all").send({});
    expect([200, 201]).toContain(outAll.status);

    const me = await agent.get("/api/store/auth/me");
    expect([401, 403]).toContain(me.status);
  });

  it("register duplicate should be graceful (200/409) or rate-limited (429)", async () => {
    // Gate test: tolerant by design (policy may allow idempotent register)
    const res = await api(app).post("/api/store/auth/register").send({
      email: fx.storeUser.email,
      password: fx.storeUser.password,
    });

    expect([200, 201, 409, 429]).toContain(res.status);
  });
});
