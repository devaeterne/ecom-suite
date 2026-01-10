import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class ProductTranslationRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByProduct(tenantId: string, productId: string) {
    return this.prisma.catalogProductTranslation.findMany({
      where: { tenantId, productId },
      orderBy: [{ localeCode: "asc" }],
    });
  }

  getByLocale(tenantId: string, productId: string, localeCode: string) {
    return this.prisma.catalogProductTranslation.findFirst({
      where: { tenantId, productId, localeCode },
    });
  }

  create(
    tenantId: string,
    productId: string,
    data: {
      localeCode: string;
      title: string;
      subtitle?: string | null;
      description?: string | null;
      seoTitle?: string | null;
      seoDescription?: string | null;
      searchKeywords?: string | null;
    }
  ) {
    return this.prisma.catalogProductTranslation.create({
      data: {
        tenantId,
        productId,
        localeCode: data.localeCode,
        title: data.title,
        subtitle: data.subtitle ?? null,
        description: data.description ?? null,
        //searchKeywords: data.searchKeywords ?? null,
        //seoTitle: data.seoTitle ?? null,
        //seoDescription: data.seoDescription ?? null,
      },
    });
  }

  async update(
    tenantId: string,
    productId: string,
    localeCode: string,
    data: {
      title?: string;
      subtitle?: string | null;
      description?: string | null;
      seoTitle?: string | null;
      seoDescription?: string | null;
      searchKeywords?: string | null;
    }
  ) {
    // CI-safe: composite key adını dert etmiyoruz
    await this.prisma.catalogProductTranslation.updateMany({
      where: { tenantId, productId, localeCode },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.subtitle !== undefined ? { subtitle: data.subtitle } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.seoTitle !== undefined ? { seoTitle: data.seoTitle } : {}),
        ...(data.seoDescription !== undefined
          ? { seoDescription: data.seoDescription }
          : {}),
        ...(data.searchKeywords !== undefined
          ? { searchKeywords: data.searchKeywords }
          : {}),
      },
    });

    return this.getByLocale(tenantId, productId, localeCode);
  }

  async delete(tenantId: string, productId: string, localeCode: string) {
    await this.prisma.catalogProductTranslation.deleteMany({
      where: { tenantId, productId, localeCode },
    });
    return { ok: true };
  }
}
