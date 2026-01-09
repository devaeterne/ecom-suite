📌 PROJECT CONTEXT — Multi-Tenant E-Commerce API
1️⃣ Proje Tanımı

Multi-tenant, headless bir e-commerce backend geliştiriliyor.
Amaç: Kurumsal ölçekte ölçeklenebilir, test edilebilir ve genişletilebilir bir altyapı kurmak.
Notlar 
CI Modu açık 

Backend: NestJS + Prisma + PostgreSQL

Auth: JWT (Admin / Store ayrımı)

Mimari yaklaşım: Domain-driven, modüler

Öncelik: Doğru işleyen core → sonra feature genişlemesi

2️⃣ Mevcut Durum (DONE ✅)
✅ Sistem & Auth

Health / live endpoint’leri

Admin auth (login / refresh / logout / sessions)

Store auth (register / login / refresh / logout)

Password reset

RBAC (role, permission, bootstrap)

✅ Customer & Storefront Core

Customer profile & address yönetimi

Store cart (line item, coupon, shipping method)

Checkout (create, address, payment providers)

Order create (from checkout), list, detail

Payments (manual provider, payment collection)

Webhook ingest altyapısı

✅ Inventory (Core tamamlandı)

InventoryLocation (default location seed ile eklendi)

InventoryLevel (altyapı hazır)

InventoryReservation

Checkout → reserve / status / release stock

Unique constraint & idempotent rezervasyon

Smoke test tam yeşil

✅ Test & Operasyon

Store smoke test (full flow: auth → checkout → inventory → payment → order)

Seed script stabil (docker içinde çalışıyor)

3️⃣ Bilinçli Olarak Yapılmayanlar (HENÜZ ❌)

Dağılmamak için özellikle ertelendi:

Admin tarafında stok girişi ekranları

Admin tarafında fiyat/indirim tanımları

Fulfillment (paketleme, kargo)

Fatura & iade süreçleri

SEO, redirect, analytics

Review / rating gibi non-core özellikler

4️⃣ Mimari Prensipler (Değişmezler)

Store endpoint = müşteri yolculuğu

Admin endpoint = operasyon & yönetim

Önce data + state correctness, sonra UX

Idempotency & unique constraint her kritik noktada

E2E / smoke kırılmadan ilerleme

5️⃣ Planlanan Yol Haritası (SIRALI)
🔹 Aşama 1 — Inventory & Admin Stock (Öncelik)

Admin InventoryLocation CRUD

Admin InventoryLevel (stok gir / güncelle)

Variant ↔ stock ilişkisinin netleştirilmesi
Mevcut Durum (DONE ✅)

🔹 Aşama 2 — Catalog Genişletme

Variant detay yönetimi

Media upload & linking

Category hierarchy

Collection & Tag admin endpoint’leri

Translation (çok dilli catalog)

🔹 Aşama 3 — Pricing & Discounts

PriceList / PriceSet

Discount & coupon tanımları

Cart / checkout ile entegrasyon

🔹 Aşama 4 — Fulfillment & Shipping

Order fulfillment lifecycle

Shipping carrier & profile

Shipment tracking

🔹 Aşama 5 — Finance

Invoice generation

Refund flow

🔹 Aşama 6 — SEO & Analytics

Slug / redirect

SEO meta

Audit & analytics genişletme

6️⃣ Çalışma Stili (Önemli)

“Bir modül tamamen bitmeden yenisine geçilmiyor”

Önce Admin, sonra Store

Önce backend doğruluğu, sonra “nice to have”

Gereksiz abstraction yok

7️⃣ Beklenen Asistan Rolü

Mimari rehberlik

Dağılmayı engelleme

Net TODO listeleri

“Bu şimdi mi, sonra mı?” karar desteği

Gerektiğinde hayır deme