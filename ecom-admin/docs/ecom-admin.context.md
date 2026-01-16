Aşağıdaki plan “tasarım kilidi” gibi çalışır: önce güvenlik omurgası, sonra UI. Yarın açıp adım adım yürüyebilirsin.

0) Hedef

Super Admin: tüm tenant’ları görebilsin ve admin panelde tenant seçebilsin.

Normal Admin: kendi tenant’ı dışında hiçbir şeyi göremesin; switcher asla görünmesin.

Güvenlik: UI gizleme değil, backend guard ile kilit.

1) Backend Projelendirme
1.1 Rol modeli

Admin session içinde en az şu alanlar olmalı:

adminUserId

role → "super_admin" | "admin"

(opsiyonel) tenantId (normal admin için sabit)

Eğer şu an role yoksa: admin user tablona role ekle veya claims’e koy.

1.2 Guard: SuperAdminGuard

Dosya: src/infrastructure/auth/guards/super-admin.guard.ts

AdminAuthGuard sonrası çalışır

req.user.role !== "super_admin" ise 403

Kullanım:

GET /api/admin/tenants

(ileride) “support tools” endpointleri

1.3 Tenant override kilidi: TenantScopeGuard (kritik)

Amaç: Normal admin, header ile başka tenant’a sıçrayamasın.

Kural:

Normal admin: x-tenant-id == req.user.tenantId olmalı (ya da server kendisi set etmeli)

Super admin: serbest

Uygulama seçenekleri:

A (recommended): TenantHeaderGuard içinde kontrol

B: ayrı guard TenantScopeGuard

Minimum değişiklik için A:

TenantHeaderGuard içinde:

if user.role !== super_admin ise headerTenantId ile userTenantId compare → farklıysa 403

Böylece switcher saklı olsa bile güvenlik “beton”.

1.4 Endpoint: GET /api/admin/tenants (superadmin only)

Controller: AdminTenantsController (yeni) veya mevcut admin module altında

Response:

{ items: Array<{ id; code; name; isActive }>}


DB:

tenant tablosundan deletedAt is null filtrele

orderBy createdAt desc

1.5 Endpoint: GET /api/admin/me (opsiyonel ama tavsiye)

UI’nın role öğrenmesi için.

Response:

{ user: { id, email, role, tenantId? } }

2) Admin UI Projelendirme
2.1 Data layer

Dosya: src/lib/api/admin/tenants.ts

listTenants() → /api/admin/tenants

Dosya: src/lib/api/auth/admin.ts

(opsiyonel) me() → /api/admin/me

2.2 Header bileşeni: Tenant Switcher

Yer: components/layout/topbar benzeri (senin yapına göre)

Mantık:

App açılınca:

GET /api/admin/me ile role al

role super_admin değilse: return null

Super admin ise:

GET /api/admin/tenants

dropdown: tenant seç

seçince:

setTenantContext({tenantId, tenantCode})

router.refresh() (veya location.reload())

UI davranışı:

Seçili tenant’ı header’da göster (code + name)

“Impersonation” yok; sadece context switch

2.3 Fail-safe (me endpoint yoksa)

Alternatif:

listTenants() çağır

200 → göster

403 → gösterme

Bu yaklaşım, backend kilidiyle uyumlu.

3) Test Planı (kısa checklist)
3.1 Normal admin

/api/admin/tenants → 403

Header’da switcher → yok

x-tenant-id başka tenant verilirse → 403 (TenantScope kilidi)

3.2 Super admin

/api/admin/tenants → 200

Switcher → var

Tenant seç → products list o tenant’a göre değişir

4) İş sırası (yarın için net akış)

SuperAdminGuard yaz

GET /api/admin/tenants endpoint’i ekle + guard bağla

TenantHeaderGuard içine “normal admin tenant scope” kontrolünü ekle

Admin UI’da “probe ile göster” tenant switcher (me endpoint olmadan)

Sonra istersen /api/admin/me ekleyip UI’yı daha temiz yap

5) Tasarım Kilidi Notu

Switcher sadece UI komponenti değil, backend tenant scope enforcement ile anlamlı.

“Gizleme” değil “yetki kapısı” esas.

Yarın başladığında ilk adım olarak hangi taraftan gidelim istersen:
Benim önerim backend (Guard + /tenants + scope check) → sonra UI.