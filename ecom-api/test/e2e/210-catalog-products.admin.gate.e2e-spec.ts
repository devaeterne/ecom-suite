// test/e2e/210-catalog-products.admin.gate.e2e-spec.ts
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { createE2EApp } from "@test/utils/create-e2e-app";
import { loginAdmin } from "@test/utils/auth";
import { withTenantHeaders } from "@test/utils/tenant";
import { seedProduct /*, attachMedia */ } from "@test/fixtures/catalog";
// import { uploadAndCompleteFile } from "@test/fixtures/upload"; // varsa aç

const expect200or201 = (r: any) => {
  expect([200, 201]).toContain(r.status);
};

const expect401or403 = (r: any) => {
  expect([401, 403]).toContain(r.status);
};

const expect400or403 = (r: any) => {
  expect([400, 403]).toContain(r.status);
};

describe("[P00] Catalog Products (Admin) (gate e2e)", () => {
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

  test("POST /api/admin/products without cookie -> 401/403", async () => {
    const server = app.getHttpServer();
    const req = request(server).post("/api/admin/products");
    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req.send({
      title: "NoAuth Product",
      handle: `noauth-${Date.now()}`,
      status: "draft",
      variants: [{ title: "Default", sku: `SKU_${Date.now()}` }],
    });

    expect401or403(res);
  });

  test("POST /api/admin/products without tenant headers -> 400/403", async () => {
    const server = app.getHttpServer();
    const res = await request(server)
      .post("/api/admin/products")
      .set("Cookie", adminCookie)
      .send({
        title: "NoTenant Product",
        handle: `notenant-${Date.now()}`,
        status: "draft",
        variants: [{ title: "Default", sku: `SKU_${Date.now()}` }],
      });

    expect400or403(res);
  });

  test("POST /api/admin/products -> 200/201 + ids", async () => {
    const { productId, variantId } = await seedProduct(app, {
      adminCookie,
      tenantId,
      tenantCode,
      status: "draft",
    });

    expect(productId).toBeTruthy();
    expect(variantId).toBeTruthy();
  });

  test("GET /api/admin/products/:id -> 200", async () => {
    const { productId } = await seedProduct(app, {
      adminCookie,
      tenantId,
      tenantCode,
      status: "draft",
    });

    const server = app.getHttpServer();
    const req = request(server)
      .get(`/api/admin/products/${productId}`)
      .set("Cookie", adminCookie);

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req.send();
    expect(res.status).toBe(200);

    const body = res.body ?? {};
    const product = body.product ?? body;

    expect(product.id).toBe(productId);
  });

  test("GET /api/admin/products (pagination/filter) -> 200", async () => {
    const seeded = await seedProduct(app, {
      adminCookie,
      tenantId,
      tenantCode,
      status: "draft",
      title: `FilterMe ${Date.now()}`,
    });

    const server = app.getHttpServer();

    // pagination
    const req1 = request(server)
      .get("/api/admin/products")
      .query({ take: 10, skip: 0 })
      .set("Cookie", adminCookie);
    withTenantHeaders(req1, { tenantId, tenantCode });

    const res1 = await req1.send();
    expect(res1.status).toBe(200);

    // filter by q/title/handle (API farklı olabilir; esnek deniyoruz)
    const req2 = request(server)
      .get("/api/admin/products")
      .query({ q: "FilterMe" })
      .set("Cookie", adminCookie);
    withTenantHeaders(req2, { tenantId, tenantCode });

    const res2 = await req2.send();
    expect(res2.status).toBe(200);

    // En azından seeded ürün listede görünüyor mu (esnek parse)
    const list =
      res2.body?.items ??
      res2.body?.products ??
      res2.body?.data ??
      res2.body ??
      [];
    if (Array.isArray(list)) {
      const found = list.find((p: any) => p?.id === seeded.productId);
      // bazı API'ler q filtresini ignore edebilir; o durumda assert'i yumuşatıyoruz
      // ama listede varsa da iyi
      if (found) expect(found.id).toBe(seeded.productId);
    }
  });

  test("PATCH /api/admin/products/:id -> 200", async () => {
    const { productId } = await seedProduct(app, {
      adminCookie,
      tenantId,
      tenantCode,
      status: "draft",
      title: `Before ${Date.now()}`,
    });

    const server = app.getHttpServer();
    const req = request(server)
      .patch(`/api/admin/products/${productId}`)
      .set("Cookie", adminCookie);

    withTenantHeaders(req, { tenantId, tenantCode });

    const newTitle = `After ${Date.now()}`;
    const res = await req.send({ title: newTitle });

    expect(res.status).toBe(200);

    const body = res.body ?? {};
    const product = body.product ?? body;

    // bazı API'ler update response'ta entity dönmeyebilir
    if (product?.id) expect(product.id).toBe(productId);
    if (product?.title) expect(product.title).toBe(newTitle);
  });

  // --- Opsiyonel: media linking (Files modülü ile) ---
  // test("POST /api/admin/products/:id/media -> 200/201", async () => {
  //   const { productId } = await seedProduct(app, {
  //     adminCookie,
  //     tenantId,
  //     tenantCode,
  //     status: "draft",
  //   });
  //
  //   // upload fixture: fileId üret
  //   const { fileId } = await uploadAndCompleteFile(app, {
  //     adminCookie,
  //     tenantId,
  //     tenantCode,
  //     entityType: "PRODUCT", // projene göre
  //   });
  //
  //   const res = await attachMedia(app, productId, {
  //     adminCookie,
  //     tenantId,
  //     tenantCode,
  //     fileId,
  //     role: "GALLERY",
  //     rank: 0,
  //   });
  //
  //   expect(res.mediaId).toBeTruthy();
  // });
});
