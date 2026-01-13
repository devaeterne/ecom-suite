import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";
import { loginAdmin } from "@test/utils/auth";

describe("[P00] Identities Admin (gate e2e)", () => {
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
  it("GET /api/admin/identities without cookie -> 401/403", async () => {
    const res = await api(app).get("/api/admin/identities");
    expect([401, 403]).toContain(res.status);
  });

  it("owner can create identity (STAFF) -> 200/201", async () => {
    const ts = Date.now();
    const email = fx.identity.email.includes("@")
      ? fx.identity.email.replace("@", `+e2e_${ts}@`)
      : `e2e_${ts}_${fx.identity.email}`;

    const res = await api(app)
      .post("/api/admin/identities")
      .set("Cookie", ownerCookie)
      .send({
        email,
        roleScope: fx.identity.roleScope,
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body?.id).toBeTruthy();
  });

  it("owner can list identities -> 200 + array", async () => {
    const res = await api(app)
      .get("/api/admin/identities")
      .set("Cookie", ownerCookie)
      .expect(200);

    // bazı API’ler { items: [] } döner; ikisine de tolerans
    const arr = Array.isArray(res.body) ? res.body : res.body?.items;
    expect(Array.isArray(arr)).toBe(true);
  });
});
