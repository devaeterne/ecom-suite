1. **Envanter (Lokasyon + Stock Level) ile Katalog “variant detay” işini aynı pakete koy**
    
    Çünkü “variant’a stok/fiyat tanımlama” dediğin şey pratikte **InventoryLevel + PriceSet/MoneyAmount**. UI’da “variant detail” ekranı tek olur ama backend’de iki modül birlikte yürür.
    
2. **Tax/Shipping totals olmadan Pricing/Discount motoru “yarım” kalır**
    
    Discount’u yazarsın ama grandTotal hâlâ doğru davranmayabilir. Bu yüzden Pricing fazına “Tax/Shipping rule minimal” bir parça eklemek iyi olur (tam fulfillment değil, sadece totals hesaplarını tamamlayan kadar).
    

Bunun dışında, senin aşama planını **endpoint deliverable**’a çevirip netleştireyim. Aşağıdaki, “dağılmamak” için her aşamada *ne çıkacak* ve *tam olarak hangi endpointler yazılacak* listesidir.

---

## 🟢 AŞAMA 0 — Mevcut Durum (DONE)

- [x]  Health & Liveness endpoints
- [x]  Admin Auth (login / refresh / logout / me)
- [x]  Store Auth (register / login / refresh / me)
- [x]  RBAC (roles, permissions, identities)
- [x]  Catalog (basic): category create, product create/update/publish
- [x]  Cart (create, line items, coupon apply)
- [x]  Checkout (create, address, payment providers)
- [x]  Inventory (reserve / status / release)
- [x]  Payments (manual provider)
- [x]  Orders (create from checkout, list, detail)
- [x]  Smoke test (store full flow)

---

## 🟡 AŞAMA 1 — Katalog & İçerik Yönetimi (Admin)

**Amaç:** Ürün üretim hattını tamamlamak

### Category & Structure

- [ ]  GET /api/admin/categories (tree / flat)
- [ ]  GET /api/admin/categories/:id
- [ ]  DELETE /api/admin/categories/:id (soft delete)

### Product Core

- [ ]  GET /api/admin/products
- [ ]  GET /api/admin/products/:id
- [ ]  DELETE /api/admin/products/:id
- [ ]  POST /api/admin/products/:id/unpublish

### Variant & Options

- [ ]  GET /api/admin/products/:id/variants
- [ ]  POST /api/admin/products/:id/variants
- [ ]  PATCH /api/admin/variants/:id
- [ ]  DELETE /api/admin/variants/:id
- [ ]  POST /api/admin/products/:id/options
- [ ]  POST /api/admin/options/:id/values
- [ ]  DELETE /api/admin/options/:id
- [ ]  DELETE /api/admin/option-values/:id

### Media / Files

- [ ]  POST /api/admin/files (upload / presigned)
- [ ]  POST /api/admin/products/:id/media
- [ ]  DELETE /api/admin/media/:id

### Collections & Tags

- [ ]  GET /api/admin/collections
- [ ]  POST /api/admin/collections
- [ ]  PATCH /api/admin/collections/:id
- [ ]  DELETE /api/admin/collections/:id
- [ ]  GET /api/admin/tags
- [ ]  POST /api/admin/tags
- [ ]  PATCH /api/admin/tags/:id
- [ ]  DELETE /api/admin/tags/:id

### Translations

- [ ]  GET /api/admin/products/:id/translations
- [ ]  PUT /api/admin/products/:id/translations/:locale
- [ ]  GET /api/admin/categories/:id/translations
- [ ]  PUT /api/admin/categories/:id/translations/:locale

**E2E hedef**

- [ ]  Admin → ürün + varyant + medya → publish → Store catalog’da görünür

---

## 🟡 AŞAMA 2 — Fiyatlandırma & İndirim Motoru (Marketing)

**Amaç:** Gerçek fiyat & kampanya yönetimi

### Price Lists

- [ ]  GET /api/admin/price-lists
- [ ]  POST /api/admin/price-lists
- [ ]  PATCH /api/admin/price-lists/:id
- [ ]  POST /api/admin/price-lists/:id/activate
- [ ]  POST /api/admin/price-lists/:id/deactivate

### Variant Pricing

- [ ]  PUT /api/admin/variants/:variantId/prices
- [ ]  Çoklu currency desteği
- [ ]  PriceList override mantığı

### Discounts / Coupons

- [ ]  GET /api/admin/discounts
- [ ]  POST /api/admin/discounts
- [ ]  PATCH /api/admin/discounts/:id
- [ ]  POST /api/admin/discounts/:id/activate
- [ ]  POST /api/admin/discounts/:id/deactivate

### Totals (Mini)

- [ ]  TaxRate / VatRate hesaplaması
- [ ]  Shipping total placeholder (minimum)

**E2E hedef**

- [ ]  Admin → fiyat & kupon tanımla
- [ ]  Store → sepette kupon → totals doğru

---

## 🟡 AŞAMA 3 — Envanter & Depo Yönetimi (Admin)

**Amaç:** Stok olmayan ürün satılamasın

### Inventory Locations

- [ ]  GET /api/admin/inventory/locations
- [ ]  POST /api/admin/inventory/locations
- [ ]  PATCH /api/admin/inventory/locations/:id
- [ ]  POST /api/admin/inventory/locations/:id/set-default
- [ ]  DELETE /api/admin/inventory/locations/:id

### Inventory Levels

- [ ]  GET /api/admin/inventory/levels
- [ ]  PUT /api/admin/inventory/levels (upsert)

### Ops / Debug

- [ ]  GET /api/admin/inventory/reservations

**E2E hedef**

- [ ]  Admin → stok gir
- [ ]  Store → reserve-stock başarılı

---

## 🟡 AŞAMA 4 — Fulfillment & Shipping

**Amaç:** Sipariş operasyonu

### Order Fulfillment

- [ ]  POST /api/admin/orders/:id/fulfill
- [ ]  POST /api/admin/orders/:id/ship
- [ ]  POST /api/admin/orders/:id/mark-delivered
- [ ]  GET /api/admin/orders/:id/fulfillments

### Shipping Config

- [ ]  GET/POST/PATCH /api/admin/shipping/carriers
- [ ]  GET/POST/PATCH /api/admin/shipping/options
- [ ]  GET/POST/PATCH /api/admin/shipping/profiles
- [ ]  GET/POST/PATCH /api/admin/pickup-locations

### Store

- [ ]  GET /api/store/shipping-options

---

## 🟡 AŞAMA 5 — Finans & Faturalandırma

**Amaç:** Satış sonrası süreçler

### Invoice

- [ ]  GET/POST /api/admin/invoice-series
- [ ]  POST /api/admin/orders/:id/invoice
- [ ]  GET /api/admin/invoices/:id
- [ ]  GET /api/admin/orders/:id/invoice

### Refund

- [ ]  POST /api/admin/orders/:id/refunds
- [ ]  GET /api/admin/refunds

---

## 🟡 AŞAMA 6 — SEO & Storefront Polish

**Amaç:** Arama ve görünürlük

### SEO

- [ ]  POST /api/admin/seo/meta
- [ ]  POST /api/admin/slugs
- [ ]  POST /api/admin/redirects

### Store

- [ ]  GET /api/store/seo/:slug

---

## 🔒 KURAL (kendine not)

- [ ]  Yeni modül yazmadan önce **E2E checklist** tanımla
- [ ]  Admin endpoint yazılmadan Store endpoint yazma
- [ ]  Inventory & Pricing tamamlanmadan Fulfillment’a geçme