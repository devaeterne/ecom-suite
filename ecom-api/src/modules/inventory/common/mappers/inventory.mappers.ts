import type { StockStatusItem } from "../types/inventory.types";

export function computeStockStatusItem(params: {
  variantId: string;
  cartLineItemId: string;
  required: number;
  stockedQuantity: number;
  reservedQuantity: number;
}): StockStatusItem {
  const available = params.stockedQuantity - params.reservedQuantity;
  return {
    variantId: params.variantId,
    cartLineItemId: params.cartLineItemId,
    required: params.required,
    stockedQuantity: params.stockedQuantity,
    reservedQuantity: params.reservedQuantity,
    available,
    ok: available >= params.required,
  };
}
