import { Injectable, NotFoundException } from "@nestjs/common";
import { CatalogRepo } from "@/modules/catalog/common/prisma/catalog.repo";
import {
  mapCategory,
  mapStoreProduct,
} from "@/modules/catalog/common/mappers/catalog.mappers";

@Injectable()
export class CatalogAdminService {
  constructor(private readonly repo: CatalogRepo) {}

  async createCategory(tenantId: string, dto: any) {
    const row = await this.repo.adminCreateCategory(tenantId, dto);
    return mapCategory(row);
  }

  async updateCategory(tenantId: string, id: string, dto: any) {
    // update öncesi existence check (tenant scoping)
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

    const row = await this.repo.adminPublishProduct(tenantId, id);
    return mapStoreProduct(row);
  }
}
