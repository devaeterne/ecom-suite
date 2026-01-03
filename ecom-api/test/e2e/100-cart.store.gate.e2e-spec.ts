// test/e2e/100-cart.store.gate.e2e-spec.ts
import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { fx } from "@test/helpers/fixtures";
import { loginAdmin, loginStore } from "@test/helpers/auth";

const expect200or201 = (res: any) => {
  expect([200, 201]).toContain(res.status);
};

describe("100 - Storefront Cart + Inventory Reservation", () => {
  let app: INestApplication;
  let adminAgent: any;
  let storeAgent: any;

  let tenantId: string;
  let tenantHeader: Record<string, string>;

  // seed outputs
  let categoryId: string;
  let productId: string;
  let variantId: string;

  // runtime outputs
  let cartId: string;
  let lineItemId: string;

  beforeAll(async () => {
    app = await createE2EApp();

    // ✅ login agents
    const adminLogin = await loginAdmin(app, fx.owner.email, fx.owner.password);
    adminAgent = adminLogin.agent;

    const storeLogin = await loginStore(
      app,
      fx.storeUser.email,
      fx.storeUser.password
    );
    storeAgent = storeLogin.agent;

    // ✅ Tenant header must be UUID (not "acme" code)
    const me = await adminAgent.get("/api/admin/tenants/me").expect(200);
    tenantId = me.body?.id as string;
    tenantHeader = { "x-tenant-id": tenantId };

    // ✅ Seed: catalog + publish + (inventory hazır) varyant
    const ts = Date.now();

    const cat = await adminAgent
      .post("/api/admin/categories")
      .set(tenantHeader)
      .send({ name: "Cart Seed", handle: `cart-seed-${ts}` })
      .expect(expect200or201);
    categoryId = cat.body.id as string;

    const p = await adminAgent
      .post("/api/admin/products")
      .set(tenantHeader)
      .send({
        title: "Cart Product",
        handle: `cart-product-${ts}`,
        status: "draft",
        categoryIds: [categoryId],
        variants: [{ title: "Default", sku: `CART-SKU-${ts}`, isActive: true }],
      })
      .expect(expect200or201);

    productId = p.body.id as string;

    await adminAgent
      .post(`/api/admin/products/${productId}/publish`)
      .set(tenantHeader)
      .send({})
      .expect(expect200or201);

    // ✅ variant id’yi storefront detail’den çekmek deterministic
    const detail = await storeAgent
      .get(`/api/store/products/${productId}`)
      .set(tenantHeader)
      .expect(200);

    variantId = detail.body?.variants?.[0]?.id;
    expect(variantId).toBeTruthy();

    // ⚠️ Inventory/stock modelin varsa burada “stok yükle” adımı ekle.
    // Örn: admin stock endpoint'in varsa:
    // await adminAgent.post(`/api/admin/inventory/${variantId}/set`)
    //   .set(tenantHeader)
    //   .send({ quantity: 10 })
    //   .expect(expect200or201);
  });

  afterAll(async () => {
    await app?.close();
  });

  it("POST /api/store/cart -> creates cart + cookie", async () => {
    const res = await storeAgent
      .post("/api/store/cart")
      .set(tenantHeader)
      .send({})
      .expect(expect200or201);

    // body kontratına göre:
    cartId = res.body?.id;
    expect(cartId).toBeTruthy();

    // cookie set edilmiş mi? (opsiyonel)
    // expect(res.headers["set-cookie"]?.join(";") ?? "").toContain("cart");
  });

  it("GET /api/store/cart -> returns current cart (auto-create) + refresh TTL", async () => {
    const res = await storeAgent
      .get("/api/store/cart")
      .set(tenantHeader)
      .expect(expect200or201);

    expect(res.body?.id).toBeTruthy();
    // ilk testte cart oluşturduysak aynı id dönmeli (policy’nize göre)
    // expect(res.body.id).toBe(cartId);
  });

  it("POST /api/store/cart/line-items -> reserves stock", async () => {
    const res = await storeAgent
      .post("/api/store/cart/line-items")
      .set(tenantHeader)
      .send({
        variantId,
        quantity: 1,
      })
      .expect(expect200or201);

    // Kontratına göre line item id nerede dönüyorsa:
    // (bazıları cart döndürür, bazıları lineItem döndürür)
    const li =
      res.body?.lineItem ??
      res.body?.item ??
      res.body?.lineItems?.[0] ??
      res.body?.cart?.lineItems?.[0];

    lineItemId = li?.id;
    expect(lineItemId).toBeTruthy();
  });

  it("PATCH /api/store/cart/line-items/{id} -> increases reservation with availability check", async () => {
    const res = await storeAgent
      .patch(`/api/store/cart/line-items/${lineItemId}`)
      .set(tenantHeader)
      .send({ quantity: 2 })
      .expect(expect200or201);

    // asserted state:
    // expect(res.body?.lineItems?.find((x:any)=>x.id===lineItemId)?.quantity).toBe(2);
  });

  it("PATCH -> 409 when insufficient stock", async () => {
    // stok yoksa zaten 409 beklenir; stok varsa quantity’yi abart
    await storeAgent
      .patch(`/api/store/cart/line-items/${lineItemId}`)
      .set(tenantHeader)
      .send({ quantity: 9999 })
      .expect(409);
  });

  it("DELETE /api/store/cart/line-items/{id} -> releases reservation", async () => {
    await storeAgent
      .delete(`/api/store/cart/line-items/${lineItemId}`)
      .set(tenantHeader)
      .expect(expect200or201);

    // opsiyonel: cart'ı çekip line item yok mu bak
    const cart = await storeAgent
      .get("/api/store/cart")
      .set(tenantHeader)
      .expect(200);

    const exists =
      (cart.body?.lineItems ?? []).find((x: any) => x.id === lineItemId) ??
      null;

    expect(exists).toBeFalsy();
  });

  it("POST /api/store/cart/apply-coupon -> creates DISCOUNT adjustment (stub)", async () => {
    const res = await storeAgent
      .post("/api/store/cart/apply-coupon")
      .set(tenantHeader)
      .send({ code: "TEST10" })
      .expect(expect200or201);

    // stub ise sadece “ok” bekle:
    // expect(res.body).toHaveProperty("ok", true);
  });

  it("POST /api/store/cart/shipping-method -> upserts CartShippingMethod", async () => {
    // shippingOption seed’in yoksa önce store’dan list al
    // const optRes = await storeAgent.get("/api/store/shipping-options").set(tenantHeader).expect(200);
    // const shippingOptionId = optRes.body?.[0]?.id;

    const shippingOptionId = "TODO"; // kendi sistemine göre doldur

    const res = await storeAgent
      .post("/api/store/cart/shipping-method")
      .set(tenantHeader)
      .send({ shippingOptionId })
      .expect(expect200or201);

    // assert: cart shipping method set mi?
  });
});
