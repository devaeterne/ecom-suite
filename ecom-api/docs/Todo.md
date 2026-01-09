📌 TODO — Multi-Tenant E-Commerce API (GÜNCEL & SENKRON)

İlke: Bir aşama %100 bitmeden sonraki açılmaz
Önce Admin, sonra Store
Önce doğruluk, sonra konfor

🟢 AŞAMA 0 — CORE PLATFORM (DONE ✅)
Sistem & Güvenlik

- [x]  Health / live

- [x]  Admin auth (login / refresh / logout / sessions)

- [x]  Store auth (register / login / refresh / logout)

- [x]  Password reset

- [x]  RBAC (roles, permissions, bootstrap)

- [x]  Tenant resolve (/admin/tenants/me)

Customer & Store Core

- [x]  Customer profile & address CRUD

- [x]  Store cart (line item, coupon apply, shipping method placeholder)

- [x]  Checkout (create, address, payment providers)

- [x]  Orders (from checkout, list, detail)

- [x]  Payments (manual provider)

- [x]  Payment webhook ingest

Inventory (Store tarafı) ✅ (core hazır)

- [x]  InventoryLocation (default seed)

- [x]  InventoryLevel (core model)

- [x]  InventoryReservation

- [x]  Checkout → reserve / status / release

- [x]  Idempotency + unique constraints

- [x]  Store E2E smoke (tam yeşil) (senin önceki notuna göre)

Files / Media (Admin) ✅

- [x]  MinIO entegrasyonu (internal + public endpoint ayrımı)

- [x]  Presigned PUT

- [x]  Upload → complete (HEAD doğrulama)

- [x]  Presigned GET

- [x]  File ↔ entity link

- [x]  Entity files list

- [x]  Files smoke test (tam yeşil)

🟡 AŞAMA 1 — INVENTORY & ADMIN STOCK (ŞİMDİ)

Kritik karar: Variant “detay” ekranı = Inventory + Pricing birlikte
Ama ilk adım sadece Inventory

Admin InventoryLocation ✅

- [x]  GET /api/admin/inventory/locations

- [x]  POST /api/admin/inventory/locations

- [x]  PATCH /api/admin/inventory/locations/:id

- [x]  POST /api/admin/inventory/locations/:id/set-default

- [x]  DELETE /api/admin/inventory/locations/:id

Admin InventoryLevel ✅

- [x]  GET /api/admin/inventory/levels

- [x]  PUT /api/admin/inventory/levels (upsert)

- [x]  Variant ↔ location ↔ quantity netliği (model + endpoint var; smoke seviyesinde doğrulandı)

Ops / Debug ✅

- [x]  GET /api/admin/inventory/reservations

- [ ] E2E hedef (Aşama 1’in “bitme” kriteri)

 Admin stok gir → Store checkout reserve başarılı → Admin reservations’ta ACTIVE görünür
(Admin tarafı hazır. Bu madde “tek smoke script” ile uçtan uca yeşil alınca kapanacak.)

➡️ Bu aşama bitmeden pricing’e geçilmeyecek

🟡 AŞAMA 2 — CATALOG GENİŞLETME (ADMIN)
Category & Structure

- [x] GET categories (tree / flat)

- [x] GET category by id

- [x] DELETE category (hard delete + cleanup)

- [ ] Category hierarchy edge-case’leri (cycle guard, child policy)

Product & Variant

- [x] Product CRUD + publish/unpublish (smoke: create + publish/unpublish + delete)

- [x] Variant CRUD (smoke: create + hard delete)

- [ ] Variant detail view (inventory + pricing placeholder)

- [ ] Variant metadata genişletme

Media

- [x] Files core (presign, link)

- [ ] Product media role standardları (GALLERY, THUMBNAIL, HERO)

- [ ] Media reorder

Collections & Tags

- [ ] Collections CRUD

- [ ] Tags CRUD

- [ ] Product ↔ collection / tag link

Translations

- [ ] Product translations

- [ ] Category translations

E2E hedef

 Admin → ürün + varyant + medya → publish → Store’da görünür

🟡 AŞAMA 3 — PRICING & DISCOUNTS (MARKETING)

- [ ] Price Lists (GET / POST / PATCH)

- [ ] Activate / deactivate

- [ ] Currency support

- [ ] Variant Pricing (PUT /api/admin/variants/:id/prices)

- [ ] PriceList override logic

- [ ] Discounts / Coupons (CRUD + activate/deactivate + cart entegrasyonu)

- [ ] Totals (TaxRate/VatRate + Shipping placeholder)

- [ ] E2E: Admin fiyat + kupon → Store cart totals doğru

🟡 AŞAMA 4 — FULFILLMENT & SHIPPING

- [ ] Fulfill / Ship / Mark delivered / list

- [ ] Shipping config (carrier, option, profile, pickup)

- [ ] Store shipping options endpoint

🟡 AŞAMA 5 — FINANCE

- [ ] Invoice series + Order→invoice + read

 - [ ]Refund create + list

🟡 AŞAMA 6 — SEO & ANALYTICS

- [ ] SEO (slug, redirect, meta)

- [ ] Analytics (audit log genişletme + basic hooks)
🔒 SABİT KURALLAR (DEĞİŞMEZ)

- [ ] Admin bitmeden Store yazılmaz

- [ ] Inventory + Pricing → Fulfillment ön koşulu

- [ ] Smoke kırılırsa ilerleme durur

- [ ] “Nice to have” asla core’u bozamaz

✅ SON DURUM

Context güncel

TODO net

Bir sonraki gerçek iş: AŞAMA 1 — Admin Inventory

Hazırsan bir sonraki mesajda Aşama 1 için net endpoint + prisma + service planı çıkarırım.
Bu noktadan sonra dağılmak yok.