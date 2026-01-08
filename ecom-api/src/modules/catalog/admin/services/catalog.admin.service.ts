import { Injectable, NotFoundException } from "@nestjs/common";
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
  // WRITE (mevcut)
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

  // -------------------------
  // READ (Commit A - eksik olanlar)
  // -------------------------
  async listCategories(req: Request, q: AdminCategoryListQueryDto) {
    const tenantId = requireTenantId(req as any);
    const view = (q?.view ?? "flat") as "flat" | "tree";

    // Repo signature: listCategories(tenantId)
    // Eğer q araması eklemek istersen repo'yu sonra genişletiriz.
    const rows = await this.repo.listCategories(tenantId);

    const mapped = rows.map(mapCategory);

    if (view === "flat") {
      return { items: mapped };
    }

    // Tree build
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
      categoryId: (q as any)?.categoryId, // opsiyonel, DTO'ya eklediysen kullan
      collectionId: (q as any)?.collectionId, // opsiyonel
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

    // product var mı? repo zaten publishedOnly false ile döndürüyor
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
}
