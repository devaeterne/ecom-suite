// src/modules/catalog/admin/services/catalog.admin.service.ts

import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ProductMediaRole } from "@prisma/client";

import { PrismaService } from "@/prisma";
import { TenantEntitlementsService } from "@/infrastructure/entitlements/tenant-entitlements.service";
import { CatalogRepo } from "@/modules/catalog/common/prisma/catalog.repo";
import { ProductMediaRepository } from "@/modules/catalog/common/prisma/product.media.repo";

import {
  mapCategory,
  mapStoreProduct,
} from "@/modules/catalog/common/mappers/catalog.mappers";

import { AdminCategoryListQueryDto } from "../dto/admin-category.dto";
import { AdminProductListQueryDto } from "../dto/admin-product.dto";
import { limitExceeded } from "@/infrastructure/errors/domain.errors";

type CategoryTreeNode = {
  id: string;
  name: string;
  parentId: string | null;
  children: CategoryTreeNode[];
};

const SINGLETON_ROLES = new Set<ProductMediaRole>(["HERO", "THUMBNAIL"]);
const MAX_CATEGORY_DEPTH = 100;

@Injectable()
export class CatalogAdminService {
  constructor(
    private readonly repo: CatalogRepo,
    private readonly productMediaRepo: ProductMediaRepository,
    private readonly prisma: PrismaService,
    private readonly entitlementsSvc: TenantEntitlementsService,
  ) {}
  private async assertProductStatusLimit(
    tenantId: string,
    targetStatus: "draft" | "published" | "archived",
    delta = 1,
  ) {
    const { entitlements, usage } =
      await this.entitlementsSvc.resolve(tenantId);
    const limit = Number(entitlements?.limits?.productsPerStatus ?? 0);
    if (!Number.isFinite(limit) || limit <= 0) return; // limit yoksa enforce etme

    const current = Number(usage?.productsByStatus?.[targetStatus] ?? 0);
    if (current + delta > limit) {
      throw limitExceeded({
        resource: "catalog_product",
        limit,
        current,
        tenantId,
        status: targetStatus,
      });
    }
  }

  private async assertMediaLimitAfterOptionalSingletonReplace(
    tx: any,
    tenantId: string,
    productId: string,
    role: ProductMediaRole,
  ) {
    const { entitlements } = await this.entitlementsSvc.resolve(tenantId);
    const limit = Number(entitlements?.limits?.mediaPerProduct ?? 0);
    if (!Number.isFinite(limit) || limit <= 0) return;

    const count = await tx.productMedia.count({
      where: { tenantId, productId },
    });

    if (count + 1 > limit) {
      // singleton role’da replace çalışıyorsa count zaten düşmüş olmalı
      throw limitExceeded({
        resource: "product_media",
        limit,
        current: count,
        tenantId,
        productId,
      });
    }
  }
  // ------------------------------------------------------------
  // Helpers (tenant-safe)
  // ------------------------------------------------------------

  private buildCategoryTree(
    flat: Array<{ id: string; name: string; parentId: string | null }>,
  ): CategoryTreeNode[] {
    const byId = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    for (const c of flat) {
      byId.set(c.id, {
        id: c.id,
        name: c.name,
        parentId: c.parentId,
        children: [],
      });
    }

    for (const node of byId.values()) {
      if (node.parentId && byId.has(node.parentId)) {
        byId.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  private async assertNoCategoryCycle(
    tenantId: string,
    categoryId: string,
    newParentId: string | null | undefined,
  ) {
    if (newParentId === undefined) return; // parentId patch edilmemiş
    if (newParentId === null) return; // root’a taşınıyor

    if (newParentId === categoryId) {
      throw new BadRequestException("parentId cannot be the category itself");
    }

    // parent var mı?
    let cursor = await this.repo.getCategoryParentRef(tenantId, newParentId);
    if (!cursor) throw new NotFoundException("Parent category not found");

    let depth = 0;

    while (cursor?.parentId) {
      depth++;
      if (depth > MAX_CATEGORY_DEPTH) {
        throw new ConflictException("Category depth exceeded (possible cycle)");
      }

      if (cursor.parentId === categoryId) {
        throw new ConflictException(
          "Cycle detected: cannot move under descendant",
        );
      }

      cursor = await this.repo.getCategoryParentRef(tenantId, cursor.parentId);
      if (!cursor) break;
    }
  }

  private normalizeListLimit(v: any, fallback = 50, max = 200) {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.min(Math.floor(n), max);
  }

  private normalizeListOffset(v: any) {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.floor(n);
  }

  private toRole(v: any, fallback: ProductMediaRole = "GALLERY") {
    const r = String(v ?? fallback).toUpperCase();
    if (r === "HERO" || r === "THUMBNAIL" || r === "GALLERY")
      return r as ProductMediaRole;
    throw new BadRequestException("Invalid media role");
  }

  // ------------------------------------------------------------
  // Categories (write)
  // ------------------------------------------------------------

  async createCategory(tenantId: string, dto: any) {
    if (dto?.parentId) {
      const parent = await this.repo.getCategoryById(tenantId, dto.parentId);
      if (!parent) throw new NotFoundException("Parent category not found");
    }

    const row = await this.repo.adminCreateCategory(tenantId, dto);
    return { category: mapCategory(row) };
  }

  async updateCategory(tenantId: string, id: string, dto: any) {
    const existing = await this.repo.getCategoryById(tenantId, id);
    if (!existing) throw new NotFoundException("Category not found");

    await this.assertNoCategoryCycle(tenantId, id, dto?.parentId);

    const row = await this.repo.adminUpdateCategory(tenantId, id, dto);
    return { category: mapCategory(row) };
  }

  async adminDeleteCategory(tenantId: string, id: string) {
    const cat = await this.repo.getCategoryById(tenantId, id);
    if (!cat) throw new NotFoundException("Category not found");

    const hasChildren = await this.repo.hasCategoryChildren(tenantId, id);
    if (hasChildren) throw new ConflictException("Category has children");

    const inUse = await this.repo.isCategoryInUse(tenantId, id);
    if (inUse) throw new ConflictException("Category is in use");

    await this.repo.adminDeleteCategory(tenantId, id);
    return { ok: true };
  }

  // ------------------------------------------------------------
  // Products (write)
  // ------------------------------------------------------------

  async createProduct(tenantId: string, dto: any) {
    const handle = String(dto?.handle ?? "").trim();
    if (!handle) throw new BadRequestException("handle is required");

    const exists = await this.repo.productHandleExists(tenantId, handle);
    if (exists) throw new ConflictException("Product handle already exists");

    const targetStatus = String(dto?.status ?? "draft") as
      | "draft"
      | "published"
      | "archived";
    if (
      targetStatus === "draft" ||
      targetStatus === "published" ||
      targetStatus === "archived"
    ) {
      await this.assertProductStatusLimit(tenantId, targetStatus, 1);
    }

    const row = await this.repo.adminCreateProduct(tenantId, dto);
    return { product: mapStoreProduct(row) };
  }

  async updateProduct(tenantId: string, id: string, dto: any) {
    const existing = await this.repo.getProductById(tenantId, id, false);
    if (!existing) throw new NotFoundException("Product not found");

    if (dto?.handle !== undefined) {
      const handle = String(dto?.handle ?? "").trim();
      if (!handle) throw new BadRequestException("handle is required");

      const exists = await this.repo.productHandleExists(tenantId, handle, id);
      if (exists) throw new ConflictException("Product handle already exists");
    }
    // status transition limit enforcement
    if (dto?.status !== undefined) {
      const prev = String((existing as any).status ?? "");
      const next = String(dto.status ?? "");
      const isKnown = (s: string) =>
        s === "draft" || s === "published" || s === "archived";
      if (isKnown(next) && next !== prev) {
        await this.assertProductStatusLimit(tenantId, next as any, 1);
      }
    }
    const row = await this.repo.adminUpdateProduct(tenantId, id, dto);
    return { product: mapStoreProduct(row) };
  }

  async publishProduct(tenantId: string, id: string) {
    const existing = await this.repo.getProductById(tenantId, id, false);
    if (!existing) throw new NotFoundException("Product not found");

    // only enforce if transition -> published
    const prev = String((existing as any).status ?? "");
    if (prev !== "published") {
      await this.assertProductStatusLimit(tenantId, "published", 1);
    }
    const row = await this.repo.adminPublishProduct(tenantId, id);
    return { product: mapStoreProduct(row) };
  }

  async unpublishProduct(tenantId: string, id: string) {
    const existing = await this.repo.getProductById(tenantId, id, false);
    if (!existing) throw new NotFoundException("Product not found");
    // unpublish -> draft limit
    const prev = String((existing as any).status ?? "");
    if (prev !== "draft") {
      await this.assertProductStatusLimit(tenantId, "draft", 1);
    }
    const row = await this.repo.adminUnpublishProduct(tenantId, id);
    return { product: mapStoreProduct(row) };
  }

  async deleteProduct(tenantId: string, id: string) {
    const existing = await this.repo.getProductById(tenantId, id, false);
    if (!existing) throw new NotFoundException("Product not found");

    await this.repo.adminSoftDeleteProduct(tenantId, id);
    return { ok: true };
  }

  // ------------------------------------------------------------
  // Variant detail (tenant-safe)
  // ------------------------------------------------------------

  async getVariantDetail(tenantId: string, variantId: string) {
    const variant = await this.repo.getVariantById(tenantId, variantId);
    if (!variant) throw new NotFoundException("Variant not found");

    const product = await this.repo.getProductById(
      tenantId,
      variant.productId,
      false,
    );
    if (!product) throw new NotFoundException("Product not found");

    const inventory = await this.repo.getVariantInventorySnapshot(
      tenantId,
      variantId,
    );

    return {
      variant,
      product: { id: product.id, title: product.title, status: product.status },
      inventory,
      pricing: { mode: "NOT_IMPLEMENTED", prices: [] },
    };
  }

  // ------------------------------------------------------------
  // Variants (write) — HARD DELETE (tenant-safe)
  // ------------------------------------------------------------

  async createVariant(tenantId: string, productId: string, dto: any) {
    const p = await this.repo.getProductById(tenantId, productId, false);
    if (!p) throw new NotFoundException("Product not found");

    return {
      variant: await this.repo.adminCreateVariant(tenantId, productId, dto),
    };
  }

  async updateVariant(tenantId: string, variantId: string, dto: any) {
    const existing = await this.repo.getVariantById(tenantId, variantId);
    if (!existing) throw new NotFoundException("Variant not found");

    return {
      variant: await this.repo.adminUpdateVariant(tenantId, variantId, dto),
    };
  }

  async deleteVariant(tenantId: string, variantId: string) {
    const existing = await this.repo.getVariantById(tenantId, variantId);
    if (!existing) throw new NotFoundException("Variant not found");

    const inUse = await this.repo.isVariantInUse(tenantId, variantId);
    if (inUse) throw new ConflictException("Variant is in use");

    await this.repo.adminDeleteVariant(tenantId, variantId);
    return { ok: true };
  }

  // ------------------------------------------------------------
  // Options (write) — tenant-safe
  // ------------------------------------------------------------

  async createOption(tenantId: string, productId: string, dto: any) {
    const p = await this.repo.getProductById(tenantId, productId, false);
    if (!p) throw new NotFoundException("Product not found");

    return {
      option: await this.repo.adminCreateOption(tenantId, productId, dto),
    };
  }

  async addOptionValue(tenantId: string, optionId: string, dto: any) {
    const opt = await this.repo.getOptionById(tenantId, optionId);
    if (!opt) throw new NotFoundException("Option not found");

    return {
      optionValue: await this.repo.adminAddOptionValue(tenantId, optionId, dto),
    };
  }

  async deleteOption(tenantId: string, optionId: string) {
    const opt = await this.repo.getOptionById(tenantId, optionId);
    if (!opt) throw new NotFoundException("Option not found");

    const inUse = await this.repo.isOptionInUse(tenantId, optionId);
    if (inUse) throw new ConflictException("Option is in use");

    await this.repo.adminDeleteOption(tenantId, optionId);
    return { ok: true };
  }

  async deleteOptionValue(tenantId: string, optionValueId: string) {
    const val = await this.repo.getOptionValueById(tenantId, optionValueId);
    if (!val) throw new NotFoundException("Option value not found");

    const inUse = await this.repo.isOptionValueInUse(tenantId, optionValueId);
    if (inUse) throw new ConflictException("Option value is in use");

    await this.repo.adminDeleteOptionValue(tenantId, optionValueId);
    return { ok: true };
  }

  // ------------------------------------------------------------
  // READ (tenant-safe)
  // ------------------------------------------------------------

  async listCategories(tenantId: string, q: AdminCategoryListQueryDto) {
    const view = (q?.view ?? "flat") as "flat" | "tree";

    // ✅ query string -> boolean normalize
    const raw = (q as any)?.isActive;
    const isActive =
      raw === undefined || raw === null
        ? undefined
        : raw === true || raw === "true"
          ? true
          : raw === false || raw === "false"
            ? false
            : undefined;

    const rows = await this.repo.listCategories(tenantId, {
      q: q?.q,
      isActive, // ✅ artık boolean/undefined
    });

    const mapped = rows.map((r: any) => mapCategory(r));

    if (view === "flat") return { items: mapped };

    const flat = mapped.map((c: any) => ({
      id: c.id,
      name: c.name,
      parentId: c.parentId ?? null,
    }));

    return { items: this.buildCategoryTree(flat) };
  }

  async getCategory(tenantId: string, id: string) {
    const row = await this.repo.getCategoryById(tenantId, id);
    if (!row) throw new NotFoundException("Category not found");
    return { category: mapCategory(row) };
  }

  async listProducts(tenantId: string, q: AdminProductListQueryDto) {
    const limit = this.normalizeListLimit(q?.limit, 50, 200);
    const offset = this.normalizeListOffset(q?.offset);

    const { items, total } = await this.repo.listProducts({
      tenantId,
      q: q?.q,
      status: q?.status,
      categoryId: q?.categoryId,
      collectionId: q?.collectionId,
      offset,
      limit,
      publishedOnly: false,
    });

    return {
      items: items.map((x: any) => ({
        ...mapStoreProduct(x),
        stockAvailable:
          typeof x.stockAvailable === "number" ? x.stockAvailable : 0,
      })),
      pagination: { offset, limit, total },
    };
  }

  async getProduct(tenantId: string, id: string) {
    const row = await this.repo.getProductById(tenantId, id, false);
    if (!row) throw new NotFoundException("Product not found");
    return { product: mapStoreProduct(row) };
  }

  async listVariantsByProduct(tenantId: string, productId: string) {
    const p = await this.repo.getProductById(tenantId, productId, false);
    if (!p) throw new NotFoundException("Product not found");

    const variants = await this.repo.getProductVariants(
      tenantId,
      productId,
      false,
    );
    return { items: variants };
  }

  // ------------------------------------------------------------
  // MEDIA (tenant-safe, deterministic)
  // ------------------------------------------------------------

  async listProductMedia(tenantId: string, productId: string) {
    // Ürün var mı? (tenant-scope)
    const product = await this.prisma.catalogProduct.findUnique({
      where: { tenantId_id: { tenantId, id: productId } },
      select: { id: true },
    });
    if (!product) throw new NotFoundException("Product not found");

    const items = await this.productMediaRepo.listByProduct(
      tenantId,
      productId,
    );

    const thumbnail = items.find((x) => x.role === "THUMBNAIL") ?? null;
    const hero = items.find((x) => x.role === "HERO") ?? null;
    const gallery = items
      .filter((x) => x.role === "GALLERY")
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));

    return { thumbnail, hero, gallery, items };
  }

  async attachProductMedia(tenantId: string, productId: string, dto: any) {
    const fileId = String(dto?.fileId ?? "").trim();
    if (!fileId) throw new BadRequestException("fileId is required");

    const role = this.toRole(dto?.role, "GALLERY");
    const isActive = dto?.isActive ?? true;
    const metadata = dto?.metadata ?? {};
    const rankInput = dto?.rank;

    return this.prisma.$transaction(async (tx) => {
      // Ürün tenant-scope kontrol
      const product = await tx.catalogProduct.findUnique({
        where: { tenantId_id: { tenantId, id: productId } },
        select: { id: true },
      });
      if (!product) throw new NotFoundException("Product not found");

      // File tenant-scope kontrol
      const file = await tx.fileObject.findUnique({
        where: { tenantId_id: { tenantId, id: fileId } },
        select: { id: true },
      });
      if (!file) throw new NotFoundException("File not found");

      // Singleton role replace
      if (SINGLETON_ROLES.has(role)) {
        await this.productMediaRepo.deleteRoleSingleton(
          tx,
          tenantId,
          productId,
          role,
        );
      }
      // ✅ PR-2: media limit enforcement (singleton replace sonrası kontrol)
      await this.assertMediaLimitAfterOptionalSingletonReplace(
        tx,
        tenantId,
        productId,
        role,
      );

      // Rank resolve (deterministic)
      let rank: number;
      if (role === "GALLERY") {
        const n = Number(rankInput);
        if (Number.isFinite(n)) {
          rank = Math.max(0, Math.floor(n));
        } else {
          const maxRank = await this.productMediaRepo.getMaxGalleryRank(
            tx,
            tenantId,
            productId,
          );
          rank = maxRank + 1;
        }
      } else {
        const n = Number(rankInput);
        rank = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
      }

      try {
        const created = await this.productMediaRepo.create(tx, {
          tenant: { connect: { id: tenantId } },
          product: { connect: { tenantId_id: { tenantId, id: productId } } },
          file: { connect: { tenantId_id: { tenantId, id: fileId } } },
          role,
          rank,
          isActive,
          metadata,
        });

        return { media: created };
      } catch (_e: any) {
        throw new ConflictException("Media constraint conflict");
      }
    });
  }

  async updateProductMedia(
    tenantId: string,
    productId: string,
    mediaId: string,
    dto: any,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.productMedia.findFirst({
        where: { tenantId, id: mediaId },
        select: { id: true, productId: true, role: true, rank: true },
      });

      if (!existing || existing.productId !== productId) {
        throw new NotFoundException("Media not found");
      }

      const nextRole = this.toRole(
        dto?.role ?? existing.role,
        existing.role as ProductMediaRole,
      );

      // Singleton role’a geçişte replace semantics
      if (SINGLETON_ROLES.has(nextRole) && nextRole !== existing.role) {
        await this.productMediaRepo.deleteRoleSingleton(
          tx,
          tenantId,
          productId,
          nextRole,
        );
      }

      // Rank kuralı (deterministic)
      let nextRank: number | undefined = undefined;
      if (dto?.rank !== undefined) {
        const n = Number(dto.rank);
        if (!Number.isFinite(n))
          throw new BadRequestException("rank must be a number");
        nextRank = Math.max(0, Math.floor(n));
      } else if (nextRole !== "GALLERY") {
        nextRank = 0;
      }

      try {
        const updated = await this.productMediaRepo.updateById(
          tx,
          tenantId,
          productId,
          mediaId,
          {
            role: nextRole,
            rank: nextRank,
            isActive: dto?.isActive,
            metadata: dto?.metadata,
          },
        );

        if (!updated) throw new NotFoundException("Media not found");
        return { media: updated };
      } catch (_e: any) {
        throw new ConflictException("Media constraint conflict");
      }
    });
  }

  async deleteProductMedia(
    tenantId: string,
    productId: string,
    mediaId: string,
  ) {
    const res = await this.prisma.productMedia.deleteMany({
      where: { tenantId, productId, id: mediaId },
    });

    if (res.count === 0) throw new NotFoundException("Media not found");
    return { ok: true };
  }

  async reorderProductMedia(tenantId: string, productId: string, dto: any) {
    const orderedIds = dto?.orderedIds;

    if (!Array.isArray(orderedIds)) {
      throw new BadRequestException("orderedIds must be an array");
    }

    const ids = orderedIds.map((x: any) => String(x)).filter(Boolean);

    if (ids.length === 0) {
      throw new BadRequestException("orderedIds is required");
    }

    const uniq = Array.from(new Set(ids));
    if (uniq.length !== ids.length) {
      throw new BadRequestException("orderedIds contains duplicates");
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Ürün tenant-scope kontrol
        const product = await tx.catalogProduct.findUnique({
          where: { tenantId_id: { tenantId, id: productId } },
          select: { id: true },
        });
        if (!product) throw new NotFoundException("Product not found");

        const rows = await tx.productMedia.findMany({
          where: { tenantId, productId, id: { in: ids } },
          select: { id: true, role: true },
        });

        if (rows.length !== ids.length) {
          throw new BadRequestException(
            "orderedIds contains invalid media ids",
          );
        }

        if (rows.some((r) => r.role !== "GALLERY")) {
          throw new BadRequestException("Only GALLERY items can be reordered");
        }

        // rank update (deterministic)
        await Promise.all(
          ids.map((id, idx) =>
            tx.productMedia.updateMany({
              where: { tenantId, productId, id },
              data: { rank: idx },
            }),
          ),
        );

        return { ok: true };
      });
    } catch (e: any) {
      // Kural hataları maskelenmesin
      if (e instanceof HttpException) throw e;
      throw new ConflictException("Reorder failed");
    }
  }
  async productHandleExists(
    tenantId: string,
    handle: string,
    excludeId?: string,
  ) {
    const h = String(handle ?? "").trim();
    if (!h || h.length < 2) return { exists: false };

    const exists = await this.repo.productHandleExists(
      tenantId,
      h,
      excludeId ? String(excludeId) : undefined,
    );

    return { exists };
  }
}
