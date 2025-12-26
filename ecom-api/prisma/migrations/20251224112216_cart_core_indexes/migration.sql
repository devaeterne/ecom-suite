-- Reservation -> line item lookup (partial, doğru olan)
CREATE INDEX IF NOT EXISTS "idx_inventory_res_line_item"
ON "inventory_reservation" ("lineItemId")
WHERE "lineItemId" IS NOT NULL;
