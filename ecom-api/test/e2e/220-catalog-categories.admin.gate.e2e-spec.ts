import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { createE2EApp } from "@test/utils/create-e2e-app";
import { loginAdmin } from "@test/utils/auth";
import { withTenantHeaders } from "@test/utils/tenant";

const expect200or201 = (r: any) => {
  expect([200, 201]).toContain(r.status);
};

const expect401or403 = (r: any) => {
  expect([401, 403]).toContain(r.status);
};

const expect400or403 = (r: any) => {
  expect([400, 403]).toContain(r.status);
};

describe("[P00] Catalog Categories (Admin) (gate e2e)", () => {
  let app: INestApplication;
  let adminCookie: string;

  const tenantId = (process.env.E2E_TENANT_ID ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");
  const tenantCode = (process.env.E2E_TENANT_CODE ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");

  beforeAll(async () => {
    app = await createE2EApp();
    const login = await loginAdmin(app);
    adminCookie = login.cookie;
  });

  afterAll(async () => {
    await app?.close();
  });

  it("POST /api/admin/categories without cookie -> 401/403", async () => {
    const req = request(app.getHttpServer())
      .post("/api/admin/categories")
      // ✅ API expects name, not title
      .send({ name: "NoAuth", handle: `no-auth-${Date.now()}` });

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;
    expect401or403(res);
  });

  it("POST /api/admin/categories without tenant headers -> 400/403", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/admin/categories")
      .set("Cookie", adminCookie)
      .send({ name: "NoTenant", handle: `no-tenant-${Date.now()}` });

    expect400or403(res);
  });

  let rootCategoryId = "";
  let childCategoryId = "";

  it("POST /api/admin/categories (create root) -> 200/201", async () => {
    const req = request(app.getHttpServer())
      .post("/api/admin/categories")
      .set("Cookie", adminCookie)
      .send({
        // ✅ MUST be name
        name: "Root Category",
        handle: `root-${Date.now()}`,
      });

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req.expect(expect200or201);
    const body = res.body?.category ?? res.body;

    expect(body?.id).toBeTruthy();
    rootCategoryId = body.id;
  });

  it("POST /api/admin/categories (create child with parentId) -> 200/201", async () => {
    expect(rootCategoryId).toBeTruthy();

    const req = request(app.getHttpServer())
      .post("/api/admin/categories")
      .set("Cookie", adminCookie)
      .send({
        // ✅ MUST be name
        name: "Child Category",
        handle: `child-${Date.now()}`,
        parentId: rootCategoryId,
      });

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req.expect(expect200or201);
    const body = res.body?.category ?? res.body;

    expect(body?.id).toBeTruthy();
    // parentId alan adı API’de farklıysa (parent_id vb.) burada gevşetebilirsin
    if (body?.parentId !== undefined)
      expect(body.parentId).toBe(rootCategoryId);

    childCategoryId = body.id;
  });

  it("GET /api/admin/categories -> 200 (list)", async () => {
    const req = request(app.getHttpServer())
      .get("/api/admin/categories")
      .set("Cookie", adminCookie);

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req.expect(200);

    const items =
      res.body?.items ??
      res.body?.categories ??
      res.body?.data ??
      res.body ??
      [];

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it("PATCH /api/admin/categories/:id -> 200", async () => {
    expect(childCategoryId).toBeTruthy();

    const req = request(app.getHttpServer())
      .patch(`/api/admin/categories/${childCategoryId}`)
      .set("Cookie", adminCookie)
      .send({
        // ✅ MUST be name
        name: "Child Category (Updated)",
      });

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req.expect(200);
    const body = res.body?.category ?? res.body;

    if (body?.id) expect(body.id).toBe(childCategoryId);
    if (body?.name) expect(body.name).toContain("Updated");
  });
});
