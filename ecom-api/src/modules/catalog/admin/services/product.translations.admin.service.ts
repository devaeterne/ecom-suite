import { Injectable, NotFoundException } from "@nestjs/common";
import { CatalogRepo } from "@/modules/catalog/common/prisma/catalog.repo";
import { ProductTranslationRepository } from "@/modules/catalog/translations/common/prisma/product.translation.repo";

@Injectable()
export class ProductTranslationsAdminService {
  constructor(
    private readonly catalogRepo: CatalogRepo,
    private readonly repo: ProductTranslationRepository
  ) {}

  async list(tenantId: string, productId: string) {
    const product = await this.catalogRepo.getProductById(
      tenantId,
      productId,
      false
    );
    if (!product) throw new NotFoundException("product_not_found");
    return { items: await this.repo.listByProduct(tenantId, productId) };
  }

  async create(tenantId: string, productId: string, dto: any) {
    const product = await this.catalogRepo.getProductById(
      tenantId,
      productId,
      false
    );
    if (!product) throw new NotFoundException("product_not_found");
    return this.repo.create(tenantId, productId, dto);
  }

  async update(
    tenantId: string,
    productId: string,
    localeCode: string,
    dto: any
  ) {
    const existing = await this.repo.getByLocale(
      tenantId,
      productId,
      localeCode
    );
    if (!existing) throw new NotFoundException("translation_not_found");
    return this.repo.update(tenantId, productId, localeCode, dto);
  }

  async delete(tenantId: string, productId: string, localeCode: string) {
    const existing = await this.repo.getByLocale(
      tenantId,
      productId,
      localeCode
    );
    if (!existing) throw new NotFoundException("translation_not_found");
    return this.repo.delete(tenantId, productId, localeCode);
  }
}
