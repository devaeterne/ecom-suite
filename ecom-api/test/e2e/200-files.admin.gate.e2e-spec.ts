import { randomBytes } from "crypto";
import { URL } from "url";
import http from "http";
import https from "https";
import type { INestApplication } from "@nestjs/common";
import { FileEntityType } from "@prisma/client";
import request from "supertest";
import { createE2EApp } from "../utils/create-e2e-app";
import { withTenantHeaders } from "@test/utils/tenant";
import { seedProduct } from "@test/fixtures/catalog";

type PresignPutBody = {
  fileId: string;
  putUrl: string;
  bucket?: string;
  key?: string;
  expiresAt?: string;
};

type PresignGetBody = {
  fileId: string;
  url: string;
  expiresAt?: string;
};

const expect200or201 = (r: any) => {
  expect([200, 201]).toContain(r.status);
};

const expect400or403 = (r: any) => {
  expect([400, 403]).toContain(r.status);
};

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const tenantId = (process.env.E2E_TENANT_ID ?? "")
  .trim()
  .replace(/^"+|"+$/g, "");

const tenantCode = (process.env.E2E_TENANT_CODE ?? "")
  .trim()
  .replace(/^"+|"+$/g, "");

function pickPresignPut(body: any): PresignPutBody {
  if (!body?.fileId || !body?.putUrl) {
    throw new Error(
      `[files:e2e] invalid presign-put response: ${JSON.stringify(body)}`
    );
  }
  return body as PresignPutBody;
}

function pickPresignGet(body: any): PresignGetBody {
  if (!body?.fileId || !body?.url) {
    throw new Error(
      `[files:e2e] invalid presign-get response: ${JSON.stringify(body)}`
    );
  }
  return body as PresignGetBody;
}

function pickSetCookie(res: any): string[] {
  const sc = res.headers?.["set-cookie"];
  if (!sc) return [];
  return Array.isArray(sc) ? sc : [String(sc)];
}

function cookieHeaderFromSetCookie(setCookies: string[]) {
  return setCookies
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function putToPresignedUrl(params: {
  url: string;
  body: Buffer;
  contentType: string;
}) {
  const u = new URL(params.url);
  const isHttps = u.protocol === "https:";
  const lib = isHttps ? https : http;

  const options: http.RequestOptions = {
    method: "PUT",
    hostname: u.hostname,
    port: u.port ? Number(u.port) : isHttps ? 443 : 80,
    path: `${u.pathname}${u.search}`,
    headers: {
      "content-type": params.contentType,
      "content-length": params.body.length,
    },
  };

  await new Promise<void>((resolve, reject) => {
    const req = lib.request(options, (res) => {
      const ok = (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300;
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (!ok) {
          reject(
            new Error(
              `[files:e2e] PUT presigned failed: status=${res.statusCode} body=${data}`
            )
          );
          return;
        }
        resolve();
      });
    });

    req.on("error", reject);
    req.write(params.body);
    req.end();
  });
}

describe("[P00] Files (Admin) (gate e2e)", () => {
  let app: INestApplication;

  let adminCookieHeader = "";
  let fileId = "";
  let productId = "";

  const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@acme.com";
  const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "Admin123!";

  const filename = "e2e-smoke.bin";
  const contentType = "application/octet-stream";
  const bytes = randomBytes(256);
  const size = bytes.length;

  let agent!: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    // ✅ tenant sanity
    if (tenantId && !UUID_V4_RE.test(tenantId)) {
      throw new Error(`[e2e] Invalid E2E_TENANT_ID: "${tenantId}"`);
    }

    app = await createE2EApp();

    agent = request.agent(app.getHttpServer());

    const loginRes = await agent
      .post("/api/admin/auth/login")
      .send({
        email: adminEmail,
        password: adminPassword,
      })
      .expect(200);

    adminCookieHeader = cookieHeaderFromSetCookie(pickSetCookie(loginRes));

    if (!adminCookieHeader) {
      throw new Error(
        `[files:e2e] Admin login succeeded but no set-cookie returned. headers=${JSON.stringify(
          loginRes.headers
        )}`
      );
    }

    // ✅ seed a real product for linking
    const seeded = await seedProduct(app, {
      adminCookie: adminCookieHeader,
      tenantId,
      tenantCode,
      status: "draft",
      title: `FilesLinkTarget ${Date.now()}`,
    });

    productId = seeded.productId;

    if (!productId || !UUID_V4_RE.test(productId)) {
      throw new Error(`[files:e2e] productId is invalid: "${productId}"`);
    }
  });

  afterAll(async () => {
    await app?.close();
  });

  it("POST /api/admin/files/presign-put without cookie -> 401/403", async () => {
    const req = request(app.getHttpServer())
      .post("/api/admin/files/presign-put")
      .send({ filename, contentType, size });

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;
    expect([401, 403]).toContain(res.status);
  });

  it("POST /api/admin/files/presign-put without tenant headers -> 400/403", async () => {
    const req = agent
      .post("/api/admin/files/presign-put")
      .set("Cookie", adminCookieHeader)
      .send({ filename, contentType, size });

    // ❌ intentionally no tenant headers
    const res = await req;
    expect400or403(res);
  });

  it("POST /api/admin/files/presign-put -> PUT -> complete => 200/201", async () => {
    const presignReq = agent
      .post("/api/admin/files/presign-put")
      .set("Cookie", adminCookieHeader)
      .send({ filename, contentType, size });

    withTenantHeaders(presignReq, { tenantId, tenantCode });

    const presignRes = await presignReq.expect(expect200or201);
    const presign = pickPresignPut(presignRes.body);
    fileId = presign.fileId;

    await putToPresignedUrl({
      url: presign.putUrl,
      body: Buffer.from(bytes),
      contentType,
    });

    const completeReq = agent
      .post(`/api/admin/files/${fileId}/complete`)
      .set("Cookie", adminCookieHeader);

    withTenantHeaders(completeReq, { tenantId, tenantCode });

    await completeReq.expect(expect200or201);
  });

  it("GET /api/admin/files/:fileId -> 200 + meta", async () => {
    const req = agent
      .get(`/api/admin/files/${fileId}`)
      .set("Cookie", adminCookieHeader);

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req.expect(200);
    expect(res.body).toHaveProperty("id", fileId);
  });

  it("GET /api/admin/files/:fileId/presign-get -> 200/201 + {url}", async () => {
    const req = agent
      .get(`/api/admin/files/${fileId}/presign-get`)
      .set("Cookie", adminCookieHeader);

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req.expect(expect200or201);
    const body = pickPresignGet(res.body);
    expect(body.url).toBeTruthy();
  });

  it("POST /api/admin/files/:fileId/link -> 200/201", async () => {
    expect(productId).toBeTruthy();

    const req = agent
      .post(`/api/admin/files/${fileId}/link`)
      .set("Cookie", adminCookieHeader)
      .send({
        entityType: FileEntityType.catalog_product,
        entityId: productId,
        role: "PRIMARY",
        sort: 0,
      });

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req;
    expect([200, 201]).toContain(res.status);
  });

  it("GET /api/admin/files/:fileId/links -> 200 + {items}", async () => {
    const req = agent
      .get(`/api/admin/files/${fileId}/links`)
      .set("Cookie", adminCookieHeader);

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req.expect(200);
    expect(Array.isArray(res.body?.items)).toBe(true);
  });

  it("GET /api/admin/files/entity/:entityType/:entityId -> 200 + {items}", async () => {
    const req = agent
      .get(
        `/api/admin/files/entity/${FileEntityType.catalog_product}/${productId}`
      )
      .set("Cookie", adminCookieHeader);

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req.expect(200);
    expect(Array.isArray(res.body?.items)).toBe(true);

    // link yaptıysak en az 1 görmeyi bekleriz
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });
});
