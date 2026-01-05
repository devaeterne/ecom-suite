/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,checkoutId,cartLineItemId,locationId]` on the table `inventory_reservation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "uniq_inv_res_checkout_line_loc" ON "inventory_reservation"("tenantId", "checkoutId", "cartLineItemId", "locationId");
