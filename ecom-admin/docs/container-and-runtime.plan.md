# Container & Runtime Plan (Tracking)

> Amaç: ecom-api + ecom-admin stack’inin local/dev/e2e/prod koşullarında deterministik çalışması.
> Bu doküman “ToDo” gibi check edilir.

## A) Ortam Standartları
- [ ] `.env` setleri ayrıştırıldı: dev / e2e / prod
- [ ] Cookie ayarları environment’a göre:
  - [ ] COOKIE_DOMAIN (localhost vs gerçek domain)
  - [ ] COOKIE_SECURE (dev false, prod true)
  - [ ] TRUST_PROXY (prod reverse proxy varsa true)
- [ ] CORS origin listesi environment’a uygun

## B) Network & Servis Bağlantıları
- [ ] Docker network isimleri standardize
- [ ] API ↔ Postgres bağlantısı stabil
- [ ] API ↔ Redis bağlantısı stabil
- [ ] API ↔ MinIO bağlantısı stabil
- [ ] Admin ↔ API base URL çözümü net:
  - [ ] `NEXT_PUBLIC_API_BASE_URL`
  - [ ] `API_URL_INTERNAL` (server-side)

## C) API Bootstrap / Middleware
- [x] Fastify cookie parser aktif (`@fastify/cookie`)
- [x] Global prefix: `/api`
- [x] ValidationPipe transform açık (query numeric dönüşümleri için)
- [ ] Health endpoint doğru yerde (prefix ile çakışma yok)
- [ ] Swagger cookie auth scheme’leri sadece:
  - [ ] adminAccessCookie
  - [ ] storeAccessCookie

## D) Tenant Context Uygulaması
- [x] Admin UI tenant context localStorage’a yazılıyor
- [x] `withTenantHeaders` her request’te header ekliyor
- [ ] Tenant context switch UX (super admin only)
- [ ] Normal admin için tenant header override engeli (backend guard)

## E) Auth Stabilitesi (Refresh Reuse Detected)
- [ ] Refresh token rotation stratejisi net
- [ ] Admin refresh endpoint tek tab/çok tab senaryosunda güvenli
- [ ] Refresh reuse detected hatasında:
  - [ ] kullanıcı logout’a zorlanıyor / session temizleniyor
  - [ ] client refresh retry loop’a girmiyor
- [ ] Client tarafında aynı anda refresh çağrısı engeli (dedupe/lock)

## F) DB Performans / İndeksler (kademeli)
- [ ] catalog_product: tenantId + deletedAt + status + updatedAt index
- [ ] productCategoryLink: tenantId + productId / categoryId index
- [ ] productCollectionLink: tenantId + productId / collectionId index
- [ ] inventoryLevel: tenantId + variantId + deletedAt + updatedAt index
- [ ] Query plan kontrolü (EXPLAIN) ile doğrulama

## G) Operasyonel Akış (Prod)
- [ ] Build & push prosedürü md’de var (ayrı doküman)
- [ ] Sunucuda pull + recreate prosedürü md’de var
- [ ] Log standardı / error tracking net
