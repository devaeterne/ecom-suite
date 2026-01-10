import { Injectable } from "@nestjs/common";
import { CatalogRepo } from "@/modules/catalog/common/prisma/catalog.repo";

@Injectable()
export class ProductCategoriesAdminService {
  constructor(private readonly repo: CatalogRepo) {}

  async replaceCategories(args: {
    tenantId: string;
    productId: string;
    categoryIds: string[];
  }) {
    return this.repo.replaceProductCategories(
      args.tenantId,
      args.productId,
      args.categoryIds
    );
  }
}
