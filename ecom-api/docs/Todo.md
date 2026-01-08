📌 TODO — Multi-Tenant E-Commerce API (GÜNCEL & SENKRON)

İlke: Bir aşama %100 bitmeden sonraki açılmaz
Önce Admin, sonra Store
Önce doğruluk, sonra konfor

🟢 AŞAMA 0 — CORE PLATFORM (DONE ✅)
Sistem & Güvenlik

 Health / live

 Admin auth (login / refresh / logout / sessions)

 Store auth (register / login / refresh / logout)

 Password reset

 RBAC (roles, permissions, bootstrap)

 Tenant resolve (/admin/tenants/me)

Customer & Store Core

 Customer profile & address CRUD

 Store cart (line item, coupon apply, shipping method placeholder)

 Checkout (create, address, payment providers)

 Orders (from checkout, list, detail)

 Payments (manual provider)

 Payment webhook ingest

Inventory (Store tarafı)

 InventoryLocation (default seed)

 InventoryLevel (core model)

 InventoryReservation

 Checkout → reserve / status / release

 Idempotency + unique constraints

 Store E2E smoke (tam yeşil)

Files / Media (Admin)

 MinIO entegrasyonu (internal + public endpoint ayrımı)

 Presigned PUT

 Upload → complete (HEAD doğrulama)

 Presigned GET

 File ↔ entity link

 Entity files list

 Files smoke test (tam yeşil)

🟡 AŞAMA 1 — INVENTORY & ADMIN STOCK (ŞİMDİ)

Kritik karar:
Variant “detay” ekranı = Inventory + Pricing birlikte
Ama ilk adım sadece Inventory

Admin InventoryLocation

 GET /api/admin/inventory/locations

 POST /api/admin/inventory/locations

 PATCH /api/admin/inventory/locations/:id

 POST /api/admin/inventory/locations/:id/set-default

 DELETE /api/admin/inventory/locations/:id

Admin InventoryLevel

 GET /api/admin/inventory/levels

 PUT /api/admin/inventory/levels (upsert)

 Variant ↔ location ↔ quantity netliği

Ops / Debug

 GET /api/admin/inventory/reservations

E2E hedef

 Admin stok gir → Store checkout reserve başarılı

➡️ Bu aşama bitmeden pricing’e geçilmeyecek

🟡 AŞAMA 2 — CATALOG GENİŞLETME (ADMIN)
Category & Structure

 GET categories (tree / flat)

 GET category by id

 DELETE category (hard delete + cleanup)

 Category hierarchy edge-case’leri (cycle guard, child policy)

Product & Variant

 Product CRUD + publish/unpublish

 Variant CRUD

 Variant detail view (inventory + pricing placeholder)

 Variant metadata genişletme

Media

 Files core (presign, link)

 Product media role standardları (GALLERY, THUMBNAIL, HERO)

 Media reorder

Collections & Tags

 Collections CRUD

 Tags CRUD

 Product ↔ collection / tag link

Translations

 Product translations

 Category translations

E2E hedef

 Admin → ürün + varyant + medya → publish → Store’da görünür

🟡 AŞAMA 3 — PRICING & DISCOUNTS (MARKETING)

Önemli:
Tax + Shipping totals olmadan pricing eksik sayılır

Price Lists

 GET / POST / PATCH price-lists

 Activate / deactivate

 Currency support

Variant Pricing

 PUT /api/admin/variants/:id/prices

 PriceList override logic

Discounts / Coupons

 Discount CRUD

 Activate / deactivate

 Cart entegrasyonu

Totals (Mini ama zorunlu)

 TaxRate / VatRate hesaplama

 Shipping total placeholder (sadece totals için)

E2E hedef

 Admin fiyat + kupon → Store cart totals doğru

🟡 AŞAMA 4 — FULFILLMENT & SHIPPING
Order Fulfillment

 Fulfill

 Ship

 Mark delivered

 Fulfillment list

Shipping Config

 Carrier

 Shipping option

 Shipping profile

 Pickup location

Store

 GET /api/store/shipping-options

🟡 AŞAMA 5 — FINANCE
Invoice

 Invoice series

 Order → invoice

 Invoice read

Refund

 Refund create

 Refund list

🟡 AŞAMA 6 — SEO & ANALYTICS
SEO

 Slug

 Redirect

 SEO meta

Analytics

 Audit log genişletme

 Basic analytics hooks

🔒 SABİT KURALLAR (DEĞİŞMEZ)

 Admin bitmeden Store yazılmaz

 Inventory + Pricing → Fulfillment ön koşulu

 Smoke kırılırsa ilerleme durur

 “Nice to have” asla core’u bozamaz

✅ SON DURUM

Context güncel

TODO net

Bir sonraki gerçek iş: AŞAMA 1 — Admin Inventory

Hazırsan bir sonraki mesajda Aşama 1 için net endpoint + prisma + service planı çıkarırım.
Bu noktadan sonra dağılmak yok.