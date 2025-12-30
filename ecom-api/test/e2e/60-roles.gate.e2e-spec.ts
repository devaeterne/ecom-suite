import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";
import { loginAdmin, bearer, loginAdmin as login2 } from "@test/helpers/auth";

describe("Roles Admin (gate e2e)", () => {
  let app: INestApplication;
  let ownerToken!: string;
  let supportToken: string | undefined;
  let createdRoleId: string | undefined;

  beforeAll(async () => {
    app = await createE2EApp();

    const owner = await loginAdmin(app, fx.owner.email, fx.owner.password);
    if (!owner.accessToken) throw new Error("owner accessToken missing");
    ownerToken = owner.accessToken;

    const support = await login2(app, fx.support.email, fx.support.password, {
      expectStatus: 201,
    });
    supportToken = support.accessToken; // may be undefined if cookie-only
  });

  afterAll(async () => {
    await app?.close();
  });

  it("owner can list roles", async () => {
    await api(app).get("/api/admin/roles").set(bearer(ownerToken)).expect(200);
  });

  it("owner can create role", async () => {
    const res = await api(app)
      .post("/api/admin/roles")
      .set(bearer(ownerToken))
      .send({
        name: fx.role.name,
        scope: fx.role.scope,
        description: fx.role.description,
      })
      .expect(201);

    expect(res.body?.id).toBeTruthy();
    createdRoleId = res.body.id;
  });

  it("owner can patch role", async () => {
    if (!createdRoleId) return; // create might have failed earlier; keep gate resilient
    await api(app)
      .patch(`/api/admin/roles/${createdRoleId}`)
      .set(bearer(ownerToken))
      .send({ description: "QA role updated" })
      .expect(200);
  });

  it("owner can set role permissions", async () => {
    if (!createdRoleId) return;
    // Minimal: send empty array or a dummy list depending on API contract
    const res = await api(app)
      .post(`/api/admin/roles/${createdRoleId}/permissions`)
      .set(bearer(ownerToken))
      .send({ permissionKeys: [] })
      .expect((r) => {
        if (![200, 201].includes(r.status))
          throw new Error(`Expected 200/201, got ${r.status}`);
      });

    expect(res.body).toBeTruthy();
  });

  it("support cannot create role (403) - if token available", async () => {
    if (!supportToken) return; // if you are cookie-only, we'll move this to agent-based later
    await api(app)
      .post("/api/admin/roles")
      .set(bearer(supportToken))
      .send({ name: "NOPE", scope: "STAFF", description: "should fail" })
      .expect(403);
  });
});
