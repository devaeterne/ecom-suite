import {
  ConflictException,
  BadRequestException,
  Injectable,
  NotFoundException,
  HttpException,
} from "@nestjs/common";
import { Request } from "express";

import { CatalogRepo } from "@/modules/catalog/common/prisma/catalog.repo";
import {
  mapCategory,
  mapStoreProduct,
} from "@/modules/catalog/common/mappers/catalog.mappers";
import { AdminCategoryListQueryDto } from "../dto/admin-category.dto";
import { AdminProductListQueryDto } from "../dto/admin-product.dto";
import { requireTenantId } from "@/modules/catalog/common/tenant/tenant.util";

import { ProductMediaRepository } from "@/modules/catalog/common/prisma/product.media.repo";
import { PrismaService } from "@/prisma";
import { ProductMediaRole, Prisma } from "@prisma/client";

const SINGLETON_ROLES = new Set<ProductMediaRole>(["HERO", "THUMBNAIL"]);

type CategoryTreeNode = {
  id: string;
  name: string;
  parentId: string | null;
  children: CategoryTreeNode[];
};
const MAX_CATEGORY_DEPTH = 100;

@Injectable()
export class CatalogAdminService {
  constructor(
    private readonly repo: CatalogRepo,
    private readonly productMediaRepo: ProductMediaRepository,
    private readonly prisma: PrismaService
  ) {}

  private async assertNoCategoryCycle(
    tenantId: string,
    categoryId: string,
    newParentId: string | null | undefined
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
          "Cycle detected: cannot move under descendant"
        );
      }
      cursor = await this.repo.getCategoryParentRef(tenantId, cursor.parentId);
      if (!cursor) break;
    }
  }

  // -------------------------
  // Categories (write)
  // -------------------------
  async createCategory(tenantId: string, dto: any) {
    if (dto.parentId) {
      const parent = await this.repo.getCategoryById(tenantId, dto.parentId);
      if (!parent) throw new NotFoundException("Parent category not found");
    }
    const row = await this.repo.adminCreateCategory(tenantId, dto);
    return mapCategory(row);
  }

  async updateCategory(tenantId: string, id: string, dto: any) {
    const existing = await this.repo.getCategoryById(tenantId, id);
    if (!existing) throw new NotFoundException("Category not found");

    await this.assertNoCategoryCycle(tenantId, id, dto.parentId);

    const row = await this.repo.adminUpdateCategory(tenantId, id, dto);
    return mapCategory(row);
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

  // -------------------------
  // Products (write)
  // -------------------------
  async createProduct(tenantId: string, dto: any) {
    const row = await this.repo.adminCreateProduct(tenantId, dto);
    return mapStoreProduct(row);
  }

  async updateProduct(tenantId: string, id: string, dto: any) {
    const existing = await this.repo.getProductById(tenantId, id, false);
    if (!existing) throw new NotFoundException("Product not found");

    const row = await this.repo.adminUpdateProduct(tenantId, id, dto);
    return mapStoreProduct(row);
  }

  async publishProduct(tenantId: string, id: string) {
    const existing = await this.repo.getProductById(tenantId, id, false);
    if (!existing) throw new NotFoundException("Product not found");

    const row = await this.repo.adminPublishProduct(tenantId, id);
    return mapStoreProduct(row);
  }

  async unpublishProduct(tenantId: string, id: string) {
    const existing = await this.repo.getProductById(tenantId, id, false);
    if (!existing) throw new NotFoundException("Product not found");

    const row = await this.repo.adminUnpublishProduct(tenantId, id);
    return mapStoreProduct(row);
  }

  async deleteProduct(tenantId: string, id: string) {
    const existing = await this.repo.getProductById(tenantId, id, false);
    if (!existing) throw new NotFoundException("Product not found");

    await this.repo.adminSoftDeleteProduct(tenantId, id);
    return { ok: true };
  }

  // -------------------------
  // Variant detail
  // -------------------------
  async getVariantDetail(req: Request, variantId: string) {
    const tenantId = requireTenantId(req as any);

    const variant = await this.repo.getVariantById(tenantId, variantId);
    if (!variant) throw new NotFoundException("Variant not found");

    const product = await this.repo.getProductById(
      tenantId,
      variant.productId,
      false
    );
    if (!product) throw new NotFoundException("Product not found");

    const inventory = await this.repo.getVariantInventorySnapshot(
      tenantId,
      variantId
    );

    return {
      variant,
      product: { id: product.id, title: product.title, status: product.status },
      inventory,
      pricing: { mode: "NOT_IMPLEMENTED", prices: [] },
    };
  }

  // -------------------------
  // Variants (write) — HARD DELETE
  // -------------------------
  async createVariant(tenantId: string, productId: string, dto: any) {
    const p = await this.repo.getProductById(tenantId, productId, false);
    if (!p) throw new NotFoundException("Product not found");

    return this.repo.adminCreateVariant(tenantId, productId, dto);
  }

  async updateVariant(tenantId: string, variantId: string, dto: any) {
    const existing = await this.repo.getVariantById(tenantId, variantId);
    if (!existing) throw new NotFoundException("Variant not found");

    return this.repo.adminUpdateVariant(tenantId, variantId, dto);
  }

  async deleteVariant(tenantId: string, variantId: string) {
    const existing = await this.repo.getVariantById(tenantId, variantId);
    if (!existing) throw new NotFoundException("Variant not found");

    const inUse = await this.repo.isVariantInUse(tenantId, variantId);
    if (inUse) throw new ConflictException("Variant is in use");

    await this.repo.adminDeleteVariant(tenantId, variantId);
    return { ok: true };
  }

  // -------------------------
  // Options (write)
  // -------------------------
  async createOption(tenantId: string, productId: string, dto: any) {
    const p = await this.repo.getProductById(tenantId, productId, false);
    if (!p) throw new NotFoundException("Product not found");

    return this.repo.adminCreateOption(tenantId, productId, dto);
  }

  async addOptionValue(tenantId: string, optionId: string, dto: any) {
    const opt = await this.repo.getOptionById(tenantId, optionId);
    if (!opt) throw new NotFoundException("Option not found");

    return this.repo.adminAddOptionValue(tenantId, optionId, dto);
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

  // -------------------------
  // READ (Commit A)
  // -------------------------
  async listCategories(req: Request, q: AdminCategoryListQueryDto) {
    const tenantId = requireTenantId(req as any);
    const view = (q?.view ?? "flat") as "flat" | "tree";

    const rows = await this.repo.listCategories(tenantId);
    const mapped = rows.map((r) => mapCategory(r));

    if (view === "flat") return { items: mapped };

    const flat = mapped.map((c: any) => ({
      id: c.id,
      name: c.name,
      parentId: c.parentId ?? null,
    }));

    return { items: this.buildCategoryTree(flat) };
  }

  async getCategory(req: Request, id: string) {
    const tenantId = requireTenantId(req as any);
    const row = await this.repo.getCategoryById(tenantId, id);
    if (!row) throw new NotFoundException("Category not found");
    return { category: mapCategory(row) };
  }

  async listProducts(req: Request, q: AdminProductListQueryDto) {
    const tenantId = requireTenantId(req as any);
    const limit = q?.limit ?? 50;
    const offset = q?.offset ?? 0;

    const { items, total } = await this.repo.listProducts({
      tenantId,
      q: q?.q,
      categoryId: (q as any)?.categoryId,
      collectionId: (q as any)?.collectionId,
      offset,
      limit,
      publishedOnly: false,
    });

    return {
      items: items.map((x) => mapStoreProduct(x)),
      pagination: { offset, limit, total },
    };
  }

  async getProduct(req: Request, id: string) {
    const tenantId = requireTenantId(req as any);
    const row = await this.repo.getProductById(tenantId, id, false);
    if (!row) throw new NotFoundException("Product not found");
    return { product: mapStoreProduct(row) };
  }

  async listVariantsByProduct(req: Request, productId: string) {
    const tenantId = requireTenantId(req as any);
    const p = await this.repo.getProductById(tenantId, productId, false);
    if (!p) throw new NotFoundException("Product not found");

    const variants = await this.repo.getProductVariants(
      tenantId,
      productId,
      false
    );
    return { items: variants };
  }

  private buildCategoryTree(
    flat: Array<{ id: string; name: string; parentId: string | null }>
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

  // -------------------------
  // MEDIA
  // -------------------------

  /**
   * Ürün medyalarını role bazında “view model” şeklinde döndürür:
   * - thumbnail (0/1)
   * - hero (0/1)
   * - gallery (0..n) rank asc
   * - items (tam liste)
   */
  async listProductMedia(tenantId: string, productId: string) {
    const items = await this.productMediaRepo.listByProduct(
      tenantId,
      productId
    );

    const thumbnail = items.find((x) => x.role === "THUMBNAIL") ?? null;
    const hero = items.find((x) => x.role === "HERO") ?? null;
    const gallery = items
      .filter((x) => x.role === "GALLERY")
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));

    return { thumbnail, hero, gallery, items };
  }

  /**
   * Media attach:
   * - role default: GALLERY
   * - HERO/THUMBNAIL: replace semantics (eskiyi sil, yenisini ekle)
   * - rank:
   *   - GALLERY rank yoksa max+1
   *   - diğer roller rank yoksa 0
   */
  async attachProductMedia(tenantId: string, productId: string, dto: any) {
    const role = (dto.role ?? "GALLERY") as ProductMediaRole;
    const isActive = dto.isActive ?? true;
    const metadata = dto.metadata ?? {};
    const fileId = dto.fileId as string;

    return this.prisma.$transaction(async (tx) => {
      // file var mı? (FK zaten var ama daha iyi hata mesajı)
      const file = await tx.fileObject.findUnique({
        where: { tenantId_id: { tenantId, id: fileId } },
        select: { id: true },
      });
      if (!file) throw new NotFoundException("File not found");

      // ürün var mı? (FK var ama mesaj için iyi)
      const product = await tx.catalogProduct.findUnique({
        where: { tenantId_id: { tenantId, id: productId } },
        select: { id: true },
      });
      if (!product) throw new NotFoundException("Product not found");

      if (SINGLETON_ROLES.has(role)) {
        await this.productMediaRepo.deleteRoleSingleton(
          tx,
          tenantId,
          productId,
          role
        );
      }

      let rank = dto.rank as number | undefined;
      if (role === "GALLERY" && (rank === undefined || rank === null)) {
        const maxRank = await this.productMediaRepo.getMaxGalleryRank(
          tx,
          tenantId,
          productId
        );
        rank = maxRank + 1;
      }
      if (role !== "GALLERY" && (rank === undefined || rank === null)) {
        rank = 0;
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
      } catch (e: any) {
        // P2002 unique violation vs → 409
        throw new ConflictException("Media constraint conflict");
      }
    });
  }

  async updateProductMedia(
    tenantId: string,
    productId: string,
    id: string,
    dto: any
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.productMedia.findFirst({
        where: { tenantId, id },
      });
      if (!existing || existing.productId !== productId) {
        throw new NotFoundException("Media not found");
      }

      const nextRole = (dto.role ?? existing.role) as ProductMediaRole;

      // Role singleton’a geçiyorsa replace semantics:
      if (SINGLETON_ROLES.has(nextRole) && nextRole !== existing.role) {
        await this.productMediaRepo.deleteRoleSingleton(
          tx,
          tenantId,
          productId,
          nextRole
        );
      }

      // rank kuralı: GALLERY dışı rank yoksa 0’a çek
      let nextRank = dto.rank as number | undefined;
      if (nextRank === undefined && nextRole !== "GALLERY") nextRank = 0;

      try {
        const updated = await this.productMediaRepo.updateById(
          tx,
          tenantId,
          productId,
          id,
          {
            role: nextRole,
            rank: nextRank,
            isActive: dto.isActive,
            metadata: dto.metadata,
          }
        );

        if (!updated) throw new NotFoundException("Media not found");
        return { media: updated };
      } catch (e: any) {
        throw new ConflictException("Media constraint conflict");
      }
    });
  }

  async deleteProductMedia(tenantId: string, productId: string, id: string) {
    const res = await this.prisma.productMedia.deleteMany({
      where: { tenantId, productId, id },
    });
    if (res.count === 0) throw new NotFoundException("Media not found");
    return { ok: true };
  }

  /**
   * Reorder sadece GALLERY için.
   * orderedIds: ürünün GALLERY media id’lerinin yeni sırası
   */
  async reorderProductMedia(tenantId: string, productId: string, dto: any) {
    if (!dto || !Array.isArray(dto.orderedIds)) {
      throw new BadRequestException("orderedIds must be an array");
    }

    const orderedIds: string[] = dto.orderedIds;

    // duplicate guard (kurumsal kalite: deterministik)
    const uniq = Array.from(new Set(orderedIds));
    if (uniq.length !== orderedIds.length) {
      throw new BadRequestException("orderedIds contains duplicates");
    }
    if (orderedIds.length === 0) {
      throw new BadRequestException("orderedIds is required");
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const rows = await tx.productMedia.findMany({
          where: { tenantId, productId, id: { in: orderedIds } },
          select: { id: true, role: true },
        });

        if (rows.length !== orderedIds.length) {
          throw new BadRequestException(
            "orderedIds contains invalid media ids"
          );
        }
        if (rows.some((r) => r.role !== "GALLERY")) {
          throw new BadRequestException("Only GALLERY items can be reordered");
        }

        // rank update (bulk + deterministic)
        await Promise.all(
          orderedIds.map((id, idx) =>
            tx.productMedia.updateMany({
              where: { tenantId, productId, id },
              data: { rank: idx },
            })
          )
        );

        return { ok: true };
      });
    } catch (e: any) {
      // ✅ kural hataları (400/404) maskelenmesin
      if (e instanceof HttpException) throw e;

      // burada log bas (stack + prisma code)
      // this.logger.error({ err: e, tenantId, productId, orderedIds }, "reorder failed");

      throw new ConflictException("Reorder failed");
    }
  }
}
