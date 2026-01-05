export type TenantScope = {
  tenantId: string;
  customerId?: string;
};

export type DemandLine = {
  cartLineItemId: string;
  variantId: string;
  quantity: number;
};

export type InventoryLevelRow = {
  tenantId: string;
  locationId: string;
  variantId: string;
  stockedQuantity: number;
  reservedQuantity: number;
};

export type ActiveReservationRow = {
  id: string;
  tenantId: string;
  locationId: string;
  variantId: string;
  cartLineItemId: string | null;
  checkoutId: string | null;
  quantity: number;
  status: "ACTIVE" | "COMPLETED" | "CANCELED" | "EXPIRED";
  expiresAt: Date | null;
};

export type StockStatusItem = {
  variantId: string;
  cartLineItemId: string;
  required: number;

  stockedQuantity: number;
  reservedQuantity: number;
  available: number;

  ok: boolean;
};

export type ReserveResult = {
  checkoutId: string;
  locationId: string;
  expiresAt: Date | null;
  items: StockStatusItem[];
  noop: boolean;
};

export type ReleaseResult = {
  checkoutId: string;
  locationId: string;
  releasedCount: number;
  noop: boolean;
};
