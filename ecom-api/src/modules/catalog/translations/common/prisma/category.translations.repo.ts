import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

export type UpsertCategoryTranslationInput = {
  localeCode: string;
  title: string;
  description?: string | null;
};

@Injectable()
export class CategoryTranslationRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByCategory(tenantId: string, categoryId: string) {
    return this.prisma.productCategoryTranslation.findMany({
      where: { tenantId, categoryId },
      orderBy: [{ localeCode: "asc" }, { createdAt: "asc" }],
    });
  }

  getOne(tenantId: string, categoryId: string, localeCode: string) {
    return this.prisma.productCategoryTranslation.findFirst({
      where: { tenantId, categoryId, localeCode },
    });
  }

  async upsert(
    tenantId: string,
    categoryId: string,
    data: { localeCode: string; title: string; description?: string | null }
  ) {
    const { localeCode, title, description } = data;

    // önce updateMany dene
    const upd = await this.prisma.productCategoryTranslation.updateMany({
      where: { tenantId, categoryId, localeCode },
      data: { title, description: description ?? null },
    });

    if (upd.count > 0) {
      return this.getOne(tenantId, categoryId, localeCode);
    }

    // yoksa create
    return this.prisma.productCategoryTranslation.create({
      data: {
        tenantId,
        categoryId,
        localeCode,
        title,
        description: description ?? null,
      },
    });
  }

  async deleteOne(tenantId: string, categoryId: string, localeCode: string) {
    await this.prisma.productCategoryTranslation.deleteMany({
      where: { tenantId, categoryId, localeCode },
    });
    return { ok: true };
  }
}
