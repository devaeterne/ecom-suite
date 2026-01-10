import { Injectable, NotFoundException } from "@nestjs/common";
import { CategoryTranslationRepository } from "@/modules/catalog/translations/common/prisma/category.translations.repo";

@Injectable()
export class CategoryTranslationsAdminService {
  constructor(private readonly repo: CategoryTranslationRepository) {}

  list(tenantId: string, categoryId: string) {
    return this.repo.listByCategory(tenantId, categoryId);
  }

  upsert(
    tenantId: string,
    categoryId: string,
    dto: {
      localeCode: string;
      title: string;
      description?: string | null;
    }
  ) {
    return this.repo.upsert(tenantId, categoryId, dto);
  }

  async remove(tenantId: string, categoryId: string, localeCode: string) {
    const existing = await this.repo.getOne(tenantId, categoryId, localeCode);
    if (!existing) throw new NotFoundException("Translation not found");
    return this.repo.deleteOne(tenantId, categoryId, localeCode);
  }
  // mevcut list/upsert/remove kalsın

  create(
    tenantId: string,
    categoryId: string,
    dto: {
      localeCode: string;
      title: string;
      description?: string | null;
    }
  ) {
    return this.upsert(tenantId, categoryId, dto);
  }

  update(
    tenantId: string,
    categoryId: string,
    localeCode: string,
    dto: {
      title?: string;
      description?: string | null;
    }
  ) {
    // update dto localeCode taşımıyorsa controller'dan gelen localeCode'u override et
    return this.upsert(tenantId, categoryId, {
      localeCode,
      title: dto.title ?? "", // title zorunluysa controller/dto tarafında zorunlu yap
      description: dto.description ?? null,
    });
  }

  delete(tenantId: string, categoryId: string, localeCode: string) {
    return this.remove(tenantId, categoryId, localeCode);
  }
}
