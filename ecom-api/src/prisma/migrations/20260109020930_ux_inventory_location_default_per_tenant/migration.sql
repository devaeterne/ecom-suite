-- This is an empty migration.-- 1) (Opsiyonel) Eğer geçmişten gelen kirli data varsa: tenant başına sadece 1 default kalsın
-- En erken createdAt olan default'u tutar, diğerlerini false yapar.
WITH ranked AS (
  SELECT
    id,
    "tenantId",
    "createdAt",
    ROW_NUMBER() OVER (
      PARTITION BY "tenantId"
      ORDER BY "createdAt" ASC
    ) AS rn
  FROM inventory_location
  WHERE "deletedAt" IS NULL AND "isDefault" = true
)
UPDATE inventory_location l
SET "isDefault" = false
FROM ranked r
WHERE l.id = r.id
  AND r.rn > 1;

-- 2) Asıl garanti: tenant başına aktif (deletedAt null) tek default
CREATE UNIQUE INDEX IF NOT EXISTS ux_inventory_location_default_per_tenant
ON inventory_location ("tenantId")
WHERE "deletedAt" IS NULL AND "isDefault" = true;
