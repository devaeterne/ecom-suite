// test/fixtures/catalog.ts
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { withTenantHeaders } from "@test/utils/tenant";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function uid(prefix = "e2e") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

type SeedProductOpts = {
  adminCookie: string;
  tenantId?: string;
  tenantCode?: string;

  title?: string;
  handle?: string;
  description?: string | null;
  status?: "draft" | "published" | "archived";

  variantTitle?: string;
  sku?: string | null;
  barcode?: string | null;
  isActive?: boolean;
};

export async function seedProduct(
  app: INestApplication,
  opts: SeedProductOpts
): Promise<{ productId: string; variantId: string }> {
  const server = app.getHttpServer();

  const title = opts.title ?? uid("Product");
  const handle =
    opts.handle ??
    `${slugify(title)}-${Math.random().toString(16).slice(2, 8)}`;
  const status = opts.status ?? "draft";

  const variantTitle = opts.variantTitle ?? "Default";
  const sku = opts.sku ?? uid("SKU");
  const barcode = opts.barcode ?? null;
  const isActive = opts.isActive ?? true;

  const req = request(server)
    .post("/api/admin/products")
    .set("Cookie", opts.adminCookie);

  withTenantHeaders(req, {
    tenantId: opts.tenantId,
    tenantCode: opts.tenantCode,
  });

  const res = await req.send({
    title,
    handle,
    description: opts.description ?? null,
    status,
    variants: [
      {
        title: variantTitle,
        sku,
        barcode,
        isActive,
      },
    ],
  });

  if (![200, 201].includes(res.status)) {
    throw new Error(
      `[catalog.seedProduct] failed: ${res.status} ${JSON.stringify(res.body)}`
    );
  }

  const body = res.body ?? {};
  const product = body.product ?? body;
  const productId = product.id;
  const variantId = product.variants?.[0]?.id;

  if (!productId || !variantId) {
    throw new Error(
      `[catalog.seedProduct] cannot parse ids: ${JSON.stringify(res.body)}`
    );
  }

  return { productId, variantId };
}

type AttachMediaOpts = {
  adminCookie: string;
  tenantId?: string;
  tenantCode?: string;

  fileId: string; // required
  role?: "GALLERY" | "THUMBNAIL" | "HERO";
  rank?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
};

export async function attachMedia(
  app: INestApplication,
  productId: string,
  opts: AttachMediaOpts
): Promise<{ mediaId: string }> {
  const server = app.getHttpServer();

  const req = request(server)
    .post(`/api/admin/products/${productId}/media`)
    .set("Cookie", opts.adminCookie);

  withTenantHeaders(req, {
    tenantId: opts.tenantId,
    tenantCode: opts.tenantCode,
  });

  const res = await req.send({
    fileId: opts.fileId,
    role: opts.role ?? "GALLERY",
    rank: opts.rank ?? 0,
    isActive: opts.isActive ?? true,
    metadata: opts.metadata ?? {},
  });

  if (![200, 201].includes(res.status)) {
    throw new Error(
      `[catalog.attachMedia] failed: ${res.status} ${JSON.stringify(res.body)}`
    );
  }

  // Service dönüşü farklı olabilir; esnek parse
  const mediaId =
    res.body?.id ??
    res.body?.mediaId ??
    res.body?.media?.id ??
    res.body?.media?.[0]?.id;

  if (!mediaId) {
    throw new Error(
      `[catalog.attachMedia] cannot parse mediaId: ${JSON.stringify(res.body)}`
    );
  }

  return { mediaId };
}
