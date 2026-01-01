import { Injectable, NotFoundException } from "@nestjs/common";
import { CatalogRepo } from "@/modules/catalog/common/prisma/catalog.repo";
import {
  mapCategory,
  mapCollection,
  mapStoreProduct,
} from "@/modules/catalog/common/mappers/catalog.mappers";

@Injectable()
export class CatalogStoreService {
  constructor(private readonly repo: CatalogRepo) {}

  async listCategories(tenantId: string, tree: boolean) {
    const rows = await this.repo.listCategories(tenantId);
    const mapped = rows.map(mapCategory);

    if (!tree) return mapped;

    const byId = new Map(
      mapped.map((c) => [c.id, { ...c, children: [] as any[] }])
    );
    const roots: any[] = [];

    for (const c of byId.values()) {
      if (c.parentId && byId.has(c.parentId))
        byId.get(c.parentId)!.children.push(c);
      else roots.push(c);
    }
    return roots;
  }

  async getCategory(tenantId: string, id: string) {
    const row = await this.repo.getCategoryById(tenantId, id);
    if (!row) throw new NotFoundException("Category not found");
    return mapCategory(row);
  }

  async listCollections(tenantId: string) {
    const rows = await this.repo.listCollections(tenantId);
    return rows.map(mapCollection);
  }

  async listBrands(_tenantId: string) {
    // Schema’da Brand yok; şimdilik boş liste.
    return [];
  }

  async listProducts(tenantId: string, query: any) {
    const { items, total } = await this.repo.listProducts({
      tenantId,
      q: query.q,
      categoryId: query.categoryId,
      collectionId: query.collectionId,
      offset: query.offset ?? 0,
      limit: query.limit ?? 20,
      publishedOnly: true,
    });

    return { items: items.map(mapStoreProduct), total };
  }

  async getProduct(tenantId: string, id: string) {
    const row = await this.repo.getProductById(tenantId, id, true);
    if (!row) throw new NotFoundException("Product not found");
    return mapStoreProduct(row);
  }

  async getProductVariants(tenantId: string, id: string) {
    const rows = await this.repo.getProductVariants(tenantId, id, true);
    if (!rows) throw new NotFoundException("Product not found");
    return rows.map((v: any) => ({
      id: v.id,
      title: v.title,
      sku: v.sku ?? null,
      barcode: v.barcode ?? null,
      isActive: !!v.isActive,
    }));
  }
}
