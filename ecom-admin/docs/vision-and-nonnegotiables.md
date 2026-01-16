# Vision & Non-Negotiables (Fark Yaratanlar)

## 1) Olmazsa Olmazlar (Non-Negotiables)
1. **Tenant izolasyonu**
   - Normal admin başka tenant’a header ile geçemez.
   - Veri izolasyonu backend’de enforce edilir (guard/middleware).
2. **Cookie tabanlı güvenli auth**
   - adminAccessCookie / storeAccessCookie net ayrım.
   - CORS + credentials doğru.
   - Refresh stabil: “reuse detected” kapanmadan admin tarafı tam stabil sayılmaz.
3. **Medusa hissi (UX standardı)**
   - Liste ekranları: filtre + pagination + hızlı aksiyonlar
   - Detay ekranı: tab yapısı (Genel / Variants / Media / Inventory / Pricing / Translations)
   - Minimal tasarım, güçlü bilgi.
4. **Deterministik seed & test edilebilirlik**
   - Smoke seed ile her ortamda aynı davranış.
   - Endpoint shape’leri stabil; admin panel “tahmin” ile değil “contract” ile çalışır.

## 2) Fark Yaratan Alanlar (Value Props)
1. **Support-first Super Admin Modeli**
   - Müşteri login bilgisine girmeden destek.
   - Audit’lenebilir: “superadmin X tenant Y üzerinde işlem yaptı”.
   - İleri seviye: time-boxed access / read-only mode / impersonation (opsiyon).
2. **Domain-driven Admin**
   - Ürün, envanter, fiyat, sipariş: hepsi tenant ve role farkındalığıyla.
   - UI bileşenleri “kit” mantığında tekrar kullanılabilir.
3. **Inventory gerçekliği**
   - “in_stock/low/out” yerine:
     - stok adedi (available = stocked - reserved)
     - lokasyon bazlı görünüm
   - Bu, satın alma/operasyon kararlarında gerçek değer üretir.
4. **Performans + indeks disiplini**
   - Admin list ekranları “hızlı” olmazsa kullanılmaz.
   - Doğru index + doğru include stratejisi fark yaratır.

## 3) Yakın Yol Haritası (Net ve kısa)
- P0: Auth refresh stabil + products list kontratı oturtma (category, variants, stockAvailable)
- P1: Super admin tenant switch + backend kilidi (normal admin gizleme + enforce)
- P2: Inventory tabı + pricing tabı + media yönetimi (reorder/attach) tamamlanması
- P3: Orders / Fulfillment / Finance ekranları

## 4) Tasarım Kilidi Notları
- UI gizleme güvenlik değildir; guard şart.
- Support ihtiyaçları (super admin) “sonradan eklenmez”; erken tasarlanırsa maliyet düşer.
- Inventory ve pricing ileride büyür; bugünden doğru kontrat tasarlanmalı.
