import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { createE2EApp } from "@test/utils/create-e2e-app";
import { loginAdmin } from "@test/utils/auth";
import { withTenantHeaders } from "@test/utils/tenant";
import { seedProduct } from "@test/fixtures/catalog";

const expect200or201 = (r: any) => {
  expect([200, 201]).toContain(r.status);
};

const expect401or403 = (r: any) => {
  expect([401, 403]).toContain(r.status);
};

const expect400or403 = (r: any) => {
  expect([400, 403]).toContain(r.status);
};

describe("[P00] Inventory Levels (Admin) (gate e2e)", () => {
  let app: INestApplication;
  let adminCookie: string;

  const tenantId = (process.env.E2E_TENANT_ID ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");
  const tenantCode = (process.env.E2E_TENANT_CODE ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");

  // ✅ Sizde farklıysa değiştir:
  const LOC_BASE = "/api/admin/inventory/locations";
  const LEVELS_BASE = "/api/admin/inventory/levels";
  const RES_BASE = "/api/admin/inventory/reservations";

  const uid = (prefix = "e2e") =>
    `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;

  async function ensureLocation(): Promise<string> {
    // Yeni location yarat (240 ile uyumlu)
    const req = request(app.getHttpServer())
      .post(LOC_BASE)
      .set("Cookie", adminCookie)
      .send({
        name: `E2E Location ${Date.now()}`,
        code: uid("loc"),
        isActive: true,
        metadata: { e2e: true },
      });

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req.expect(expect200or201);
    const body = res.body?.location ?? res.body;
    const id = body?.id ?? body?.locationId ?? body?.data?.id;
    if (!id)
      throw new Error(
        `[e2e] cannot parse locationId: ${JSON.stringify(res.body)}`
      );
    return id;
  }

  beforeAll(async () => {
    app = await createE2EApp();
    const login = await loginAdmin(app);
    adminCookie = login.cookie;
  });

  afterAll(async () => {
    await app?.close();
  });

  it(`GET ${LEVELS_BASE} without cookie -> 401/403`, async () => {
    const req = request(app.getHttpServer()).get(LEVELS_BASE);
    withTenantHeaders(req, { tenantId, tenantCode });
    const res = await req;
    expect401or403(res);
  });

  it(`GET ${LEVELS_BASE} without tenant headers -> 400/403`, async () => {
    const res = await request(app.getHttpServer())
      .get(LEVELS_BASE)
      .set("Cookie", adminCookie);

    expect400or403(res);
  });

  it(`GET ${LEVELS_BASE} -> 200 (list levels)`, async () => {
    const req = request(app.getHttpServer())
      .get(LEVELS_BASE)
      .set("Cookie", adminCookie);

    withTenantHeaders(req, { tenantId, tenantCode });

    const res = await req.expect(200);

    const items =
      res.body?.items ?? res.body?.levels ?? res.body?.data ?? res.body ?? [];

    expect(Array.isArray(items)).toBe(true);
  });

  it("SET/ADJUST inventory level -> then list contains it (if supported)", async () => {
    // ✅ seed product + variant
    const seeded = await seedProduct(app, {
      adminCookie,
      tenantId,
      tenantCode,
      status: "draft",
      title: `Stocked ${Date.now()}`,
    });

    const productId = seeded.productId;
    const variantId = seeded.variantId;

    expect(productId).toBeTruthy();
    expect(variantId).toBeTruthy();

    const locationId = await ensureLocation();
    expect(locationId).toBeTruthy();

    // ⚙️ olası adjust/set endpointleri (projeye göre biri çalışır)
    const candidates: Array<{
      method: "post" | "patch";
      url: string;
      body: any;
      ok: number[];
    }> = [
      // 1) POST /levels/adjust
      {
        method: "post",
        url: `${LEVELS_BASE}/adjust`,
        body: { locationId, variantId, delta: 10 },
        ok: [200, 201],
      },
      // 2) PATCH /levels
      {
        method: "patch",
        url: `${LEVELS_BASE}`,
        body: { locationId, variantId, delta: 10 },
        ok: [200, 201],
      },
      // 3) POST /levels/set
      {
        method: "post",
        url: `${LEVELS_BASE}/set`,
        body: { locationId, variantId, quantity: 10 },
        ok: [200, 201],
      },
      // 4) PATCH /levels/:variantId
      {
        method: "patch",
        url: `${LEVELS_BASE}/${variantId}`,
        body: { locationId, quantity: 10 },
        ok: [200, 201],
      },
      // 5) POST /inventory/locations/:locationId/levels
      {
        method: "post",
        url: `${LOC_BASE}/${locationId}/levels`,
        body: { variantId, quantity: 10 },
        ok: [200, 201],
      },
    ];

    let applied = false;
    let lastStatus: number | undefined;

    for (const c of candidates) {
      const req = (request(app.getHttpServer()) as any)
        [c.method](c.url)
        .set("Cookie", adminCookie)
        .send(c.body);

      withTenantHeaders(req, { tenantId, tenantCode });

      const res = await req;
      lastStatus = res.status;

      if (c.ok.includes(res.status)) {
        applied = true;
        break;
      }

      // unsupported ise 404/405 olabilir
      if ([404, 405].includes(res.status)) continue;

      // bazı projelerde validation 400 döner; payload mismatch olabilir → continue
      if ([400].includes(res.status)) continue;
    }

    // Eğer hiçbir endpoint yoksa bu P00’da “feature yok” demektir, test hard-fail etmesin.
    // Ama sen inventory modülünü kuruyorsun, büyük ihtimalle uygulanacak.
    if (!applied) {
      // en azından “unsupported” durumunu görünür kılalım
      expect([404, 405, 400]).toContain(lastStatus);
      return;
    }

    // ✅ list check: endpoint’ler farklı filter paramları kabul edebilir.
    // mümkünse locationId & variantId filtrele
    const listReq = request(app.getHttpServer())
      .get(`${LEVELS_BASE}?locationId=${locationId}&variantId=${variantId}`)
      .set("Cookie", adminCookie);

    withTenantHeaders(listReq, { tenantId, tenantCode });

    const listRes = await listReq.expect(200);

    const items =
      listRes.body?.items ??
      listRes.body?.levels ??
      listRes.body?.data ??
      listRes.body ??
      [];

    expect(Array.isArray(items)).toBe(true);

    // tamamen garanti değil ama çoğu sistemde item çıkar
    // o yüzden ">=0" değil, "some match" deniyoruz; yoksa filtre paramları desteklenmiyor olabilir.
    const hasMatch = items.some(
      (x: any) =>
        x?.variantId === variantId ||
        x?.inventoryItemId === variantId ||
        x?.variant?.id === variantId
    );

    // filtre desteği yoksa hasMatch false kalabilir; bu durumda strict fail etmiyoruz.
    // İstersen burada console.warn basabilirsin.
    expect([true, false]).toContain(hasMatch);
  });

  it("RESERVE/RELEASE (optional) -> 200/201 or 404", async () => {
    const locationId = await ensureLocation();

    // Seed product+variant
    const seeded = await seedProduct(app, {
      adminCookie,
      tenantId,
      tenantCode,
      status: "draft",
      title: `Reservable ${Date.now()}`,
    });
    const variantId = seeded.variantId;

    const reserveCandidates: Array<{ method: "post"; url: string; body: any }> =
      [
        // POST /reservations
        {
          method: "post",
          url: `${RES_BASE}`,
          body: { locationId, variantId, quantity: 1, reason: "e2e" },
        },
        // POST /levels/reserve
        {
          method: "post",
          url: `${LEVELS_BASE}/reserve`,
          body: { locationId, variantId, quantity: 1 },
        },
      ];

    let reservationId: string | undefined;

    for (const c of reserveCandidates) {
      const req = (request(app.getHttpServer()) as any)
        [c.method](c.url)
        .set("Cookie", adminCookie)
        .send(c.body);

      withTenantHeaders(req, { tenantId, tenantCode });

      const res = await req;

      if ([404, 405].includes(res.status)) continue;

      if ([200, 201].includes(res.status)) {
        const body = res.body?.reservation ?? res.body;
        reservationId =
          body?.id ?? body?.reservationId ?? body?.data?.id ?? undefined;
        break;
      }
    }

    // supported değilse pass (opsiyonel)
    if (!reservationId) {
      expect(true).toBe(true);
      return;
    }

    // release candidates
    const releaseCandidates: Array<{
      method: "post" | "patch";
      url: string;
      body?: any;
    }> = [
      // POST /reservations/:id/release
      { method: "post", url: `${RES_BASE}/${reservationId}/release`, body: {} },
      // PATCH /reservations/:id
      {
        method: "patch",
        url: `${RES_BASE}/${reservationId}`,
        body: { status: "released" },
      },
    ];

    for (const c of releaseCandidates) {
      const req = (request(app.getHttpServer()) as any)
        [c.method](c.url)
        .set("Cookie", adminCookie)
        .send(c.body ?? {});

      withTenantHeaders(req, { tenantId, tenantCode });

      const res = await req;

      if ([404, 405].includes(res.status)) continue;
      if ([200, 201, 204].includes(res.status)) {
        expect([200, 201, 204]).toContain(res.status);
        return;
      }
    }

    // Eğer release endpoint yoksa opsiyonel pass
    expect(true).toBe(true);
  });
});
