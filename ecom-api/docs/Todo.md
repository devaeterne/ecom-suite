# 📌 TODO — Multi-Tenant E-Commerce API  
**(GÜNCEL • SENKRON • BLOKE EDİCİ KURALLARLA)**

---

## 🧭 TEMEL İLKELER (DEĞİŞMEZ)

- Bir aşama **%100 tamamlanmadan** diğeri açılmaz  
- **Önce Admin → sonra Store**
- **Önce doğruluk → sonra konfor**
- Smoke kırılırsa → **ilerleme DURUR**
- “Nice to have” → core’u **asla** bozamaz

---

## 🟢 AŞAMA 0 — CORE PLATFORM (DONE ✅)

### Sistem & Güvenlik
- [x] Health / live
- [x] Admin auth (login / refresh / logout / sessions)
- [x] Store auth (register / login / refresh / logout)
- [x] Password reset
- [x] RBAC (roles, permissions, bootstrap)
- [x] Tenant resolve (`/admin/tenants/me`)

### Customer & Store Core
- [x] Customer profile & address CRUD
- [x] Store cart  
  - line items  
  - coupon apply (stub)  
  - shipping method (placeholder)
- [x] Checkout  
  - create  
  - address  
  - payment providers
- [x] Orders  
  - create from checkout  
  - list / detail
- [x] Payments (manual provider)
- [x] Payment webhook ingest

### Inventory (Store tarafı – Core) ✅
- [x] InventoryLocation (default seed + unique constraint)
- [x] InventoryLevel (stocked / reserved)
- [x] InventoryReservation
- [x] Checkout → reserve / release / status
- [x] Idempotency + unique constraints
- [x] **Store E2E smoke (tam yeşil)**

### Files / Media (Admin) ✅
- [x] MinIO entegrasyonu (internal + public)
- [x] Presigned PUT
- [x] Upload → complete (HEAD doğrulama)
- [x] Presigned GET
- [x] File ↔ entity link
- [x] Entity files list
- [x] **Files smoke test (tam yeşil)**

---

## 🟡 AŞAMA 1 — INVENTORY & ADMIN STOCK (TAMAMLANDI ✅)

> **Kritik karar:**  
> Variant “detay” ekranı = *Inventory + Pricing birlikte*  
> Bu aşamada **yalnızca Inventory** tamamlandı.

### Admin InventoryLocation
- [x] GET `/api/admin/inventory/locations`
- [x] POST `/api/admin/inventory/locations`
- [x] PATCH `/api/admin/inventory/locations/:id`
- [x] POST `/api/admin/inventory/locations/:id/set-default`
- [x] DELETE `/api/admin/inventory/locations/:id`
- [x] Tenant başına **tek default location** (DB constraint)

### Admin InventoryLevel
- [x] GET `/api/admin/inventory/levels`
- [x] PUT `/api/admin/inventory/levels` (upsert)
- [x] Variant ↔ location ↔ quantity netliği
- [x] Lock + race-safe güncelleme

### Ops / Debug
- [x] GET `/api/admin/inventory/reservations`
- [x] Reservation lifecycle (ACTIVE / CANCELED / CONSUMED)

### 🎯 Aşama 1 Bitiş Kriteri (SAĞLANDI)

--- 

## 🟡 AŞAMA 2 — CATALOG GENİŞLETME (ADMIN) ⏳

### Category & Structure
- [x] GET categories (tree / flat)
- [x] GET category by id
- [x] DELETE category (hard delete + cleanup)
- [x] Category hierarchy edge-case’leri  
  - cycle guard  
  - child delete policy

### Product & Variant
- [x] Product CRUD
- [x] Publish / unpublish
- [x] Variant CRUD (create + hard delete)
- [x] **Variant detail view**
  - inventory (read-only)
  - pricing placeholder
- [x] Variant metadata genişletme

### Media
- [x] Files core
- [x] Product media role standardları  
  - GALLERY  
  - THUMBNAIL  
  - HERO
- [x] Media reorder

### Collections & Tags
- [x] Collections CRUD
- [x] Tags CRUD
- [x] Product ↔ collection / tag link

### Translations
- [ ] Product translations
- [ ] Category translations

### 🎯 E2E Hedef

---

## 🟡 AŞAMA 3 — PRICING & DISCOUNTS (MARKETING)

- [ ] Price Lists (GET / POST / PATCH)
- [ ] Activate / deactivate
- [ ] Currency support
- [ ] Variant pricing (`PUT /api/admin/variants/:id/prices`)
- [ ] PriceList override logic
- [ ] Discounts / Coupons (CRUD + cart entegrasyonu)
- [ ] Totals (Tax / VAT / Shipping placeholder)

### 🎯 E2E

---

## 🟡 AŞAMA 4 — FULFILLMENT & SHIPPING
- [ ] Fulfill order
- [ ] Ship
- [ ] Mark delivered
- [ ] Shipping config (carrier / option / profile / pickup)
- [ ] Store shipping options endpoint

---

## 🟡 AŞAMA 5 — FINANCE
- [ ] Invoice series
- [ ] Order → invoice
- [ ] Invoice read
- [ ] Refund create + list

---

## 🟡 AŞAMA 6 — SEO & ANALYTICS
- [ ] SEO (slug / redirect / meta)
- [ ] Analytics (audit log genişletme + hooks)

---

## ✅ SON DURUM

- Context **güncel**
- Aşama 1 **kapandı**
- Sistem **doğruluk açısından stabil**
- **Sıradaki iş:**  
  👉 **AŞAMA 2 — Category edge-case → Variant detail (inventory read-only)**

> Bu noktadan sonra dağılmak yok.
