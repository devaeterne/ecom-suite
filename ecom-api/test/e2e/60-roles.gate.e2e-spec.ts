import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";
import { loginAdmin } from "@test/utils/auth";

describe("[P00] Roles Admin (gate e2e)", () => {
  let app: INestApplication;

  let ownerCookie: string;
  let supportCookie: string;
  let createdRoleId: string;

  beforeAll(async () => {
    app = await createE2EApp();

    ownerCookie = (
      await loginAdmin(app, {
        email: fx.owner.email,
        password: fx.owner.password,
      })
    ).cookie;

    supportCookie = (
      await loginAdmin(app, {
        email: fx.support.email,
        password: fx.support.password,
      })
    ).cookie;
  });

  afterAll(async () => {
    await app?.close();
  });

  // ------------------------------------------------------------
  // Security contract (regression alarm)
  // ------------------------------------------------------------
  it("GET /api/admin/roles without cookie -> 401/403", async () => {
    const res = await api(app).get("/api/admin/roles");
    expect([401, 403]).toContain(res.status);
  });

  it("owner can list roles -> 200", async () => {
    await api(app)
      .get("/api/admin/roles")
      .set("Cookie", ownerCookie)
      .expect(200);
  });

  it("owner can create role -> 201", async () => {
    const ts = Date.now();

    const res = await api(app)
      .post("/api/admin/roles")
      .set("Cookie", ownerCookie)
      .send({
        name: `${fx.role.name}-${ts}`,
        scope: fx.role.scope,
        description: fx.role.description,
      });

    if (res.status !== 201) {
      // Gate’de debug çıktısı faydalı: validation vs.
      // eslint-disable-next-line no-console
      console.log("CREATE ROLE FAIL", res.status, res.body);
    }

    expect(res.status).toBe(201);
    expect(res.body?.id).toBeTruthy();
    createdRoleId = res.body.id;
  });

  it("owner can patch role -> 200", async () => {
    const res = await api(app)
      .patch(`/api/admin/roles/${createdRoleId}`)
      .set("Cookie", ownerCookie)
      .send({ description: "QA role updated" });

    expect(res.status).toBe(200);
  });

  it("owner can set role permissions -> 200/201", async () => {
    const res = await api(app)
      .post(`/api/admin/roles/${createdRoleId}/permissions`)
      .set("Cookie", ownerCookie)
      .send({ permissionKeys: [] });

    expect([200, 201]).toContain(res.status);
    expect(res.body).toBeTruthy();
  });

  it("support cannot create role -> 403", async () => {
    const res = await api(app)
      .post("/api/admin/roles")
      .set("Cookie", supportCookie)
      .send({
        name: "NOPE",
        scope: fx.role.scope,
        description: "should fail",
      });

    expect(res.status).toBe(403);
  });
});
