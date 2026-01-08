import {
  ConflictException,
  Injectable,
  NotFoundException,
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

type CategoryTreeNode = {
  id: string;
  name: string;
  parentId: string | null;
  children: CategoryTreeNode[];
};

@Injectable()
export class CatalogAdminService {
  constructor(private readonly repo: CatalogRepo) {}

  // -------------------------
  // Categories (write)
  // -------------------------
  async createCategory(tenantId: string, dto: any) {
    const row = await this.repo.adminCreateCategory(tenantId, dto);
    return mapCategory(row);
  }

  async updateCategory(tenantId: string, id: string, dto: any) {
    const existing = await this.repo.getCategoryById(tenantId, id);
    if (!existing) throw new NotFoundException("Category not found");

    const row = await this.repo.adminUpdateCategory(tenantId, id, dto);
    return mapCategory(row);
  }

  async deleteCategory(tenantId: string, id: string) {
    const existing = await this.repo.getCategoryById(tenantId, id);
    if (!existing) throw new NotFoundException("Category not found");

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

    // TODO(Aşama1.5): publish öncesi price & stock check
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
  // Variants (write) — HARD DELETE (schema’da deletedAt yok)
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

    // in-use? cart/order/reservation vb ilişkiler var: burada “güvenli” davranalım.
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
    const mapped = rows.map(mapCategory);

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
      items: items.map(mapStoreProduct),
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
      if (node.parentId && byId.has(node.parentId))
        byId.get(node.parentId)!.children.push(node);
      else roots.push(node);
    }
    return roots;
  }
}
