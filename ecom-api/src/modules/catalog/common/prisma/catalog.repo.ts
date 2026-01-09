import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { includes } from "zod";

type ListProductsArgs = {
  tenantId: string;
  q?: string;
  categoryId?: string;
  collectionId?: string;
  offset: number;
  limit: number;
  publishedOnly: boolean;
  includeTags?: boolean; // ✅ yeni
  includeCollections?: boolean; // ✅ opsiyonel
};

@Injectable()
export class CatalogRepo {
  constructor(private readonly prisma: PrismaService) {}

  private now() {
    return new Date();
  }

  // =========================================================
  // Categories (ProductCategory)  ✅ deletedAt YOK -> HARD DELETE
  // =========================================================
  async hasCategoryChildren(
    tenantId: string,
    categoryId: string
  ): Promise<boolean> {
    const n = await this.prisma.productCategory.count({
      where: { tenantId, parentId: categoryId },
    });
    return n > 0;
  }

  async listCategories(tenantId: string) {
    return this.prisma.productCategory.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
    });
  }

  async getCategoryById(tenantId: string, id: string) {
    return this.prisma.productCategory.findFirst({
      where: { tenantId, id },
    });
  }

  async isCategoryInUse(
    tenantId: string,
    categoryId: string
  ): Promise<boolean> {
    const n = await this.prisma.productCategoryLink.count({
      where: { tenantId, categoryId },
    });
    return n > 0;
  }

  async adminCreateCategory(
    tenantId: string,
    data: { name: string; handle: string; parentId?: string | null }
  ) {
    return this.prisma.productCategory.create({
      data: {
        tenantId,
        name: data.name,
        handle: data.handle,
        parentId: data.parentId ?? null,
      },
    });
  }
  // ✅ minimal select: cycle guard için
  async getCategoryParentRef(tenantId: string, id: string) {
    return this.prisma.productCategory.findFirst({
      where: { tenantId, id },
      select: { id: true, parentId: true },
    });
  }

  async adminUpdateCategory(
    tenantId: string,
    id: string,
    data: {
      name?: string;
      handle?: string;
      parentId?: string | null;
      rank?: number;
      isActive?: boolean;
      metadata?: any;
    }
  ) {
    return this.prisma.productCategory.update({
      where: { tenantId_id: { tenantId, id } },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.handle !== undefined ? { handle: data.handle } : {}),
        ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
        ...(data.rank !== undefined ? { rank: data.rank } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
      },
    });
  }

  async adminDeleteCategory(tenantId: string, id: string) {
    return this.prisma.productCategory.delete({
      where: { tenantId_id: { tenantId, id } },
    });
  }

  // =========================================================
  // Products (CatalogProduct) ✅ deletedAt VAR -> SOFT DELETE
  // =========================================================

  async listProducts(
    args: ListProductsArgs
  ): Promise<{ items: any[]; total: number }> {
    const {
      tenantId,
      q,
      categoryId,
      collectionId,
      offset,
      limit,
      publishedOnly,
    } = args;

    const where: any = {
      tenantId,
      deletedAt: null,
      ...(publishedOnly ? { status: "published" } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { handle: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(categoryId
        ? {
            categories: { some: { tenantId, categoryId } },
          }
        : {}),
      ...(collectionId
        ? {
            collections: { some: { tenantId, collectionId } },
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.catalogProduct.count({ where }),
      this.prisma.catalogProduct.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: [{ rank: "asc" }, { updatedAt: "desc" }],
        include: {
          categories: { include: { category: true } },
          collections: { include: { collection: true } },
          variants: true,
          tags: { include: { tag: true } }, // ✅
        },
      }),
    ]);

    return { total, items };
  }

  async getProductById(tenantId: string, id: string, publishedOnly: boolean) {
    return this.prisma.catalogProduct.findFirst({
      where: {
        tenantId,
        id,
        deletedAt: null,
        ...(publishedOnly ? { status: "published" } : {}),
      },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, handle: true, parentId: true }, // ✅ title yoksa zaten yok
            },
          },
        },
        collections: {
          include: {
            collection: { select: { id: true, title: true, handle: true } },
          },
        },
        variants: true, // istersen bunu da select ile incelt
        tags: {
          include: {
            tag: { select: { id: true, value: true } },
          },
        },
      },
    });
  }

  async adminCreateProduct(
    tenantId: string,
    data: {
      title: string;
      handle: string;
      subtitle?: string | null;
      description?: string | null;
      status?: "draft" | "published";
      categoryIds?: string[];
      collectionIds?: string[];
    }
  ) {
    const categoryIds = data.categoryIds ?? [];
    const collectionIds = data.collectionIds ?? [];

    const created = await this.prisma.$transaction(async (tx) => {
      const product = await tx.catalogProduct.create({
        data: {
          tenantId,
          title: data.title,
          handle: data.handle,
          subtitle: data.subtitle ?? null,
          description: data.description ?? null,
          status: (data.status as any) ?? "draft",
          publishedAt: (data.status === "published" ? this.now() : null) as any,
        },
      });

      if (categoryIds.length) {
        await tx.productCategoryLink.createMany({
          data: categoryIds.map((categoryId) => ({
            tenantId,
            productId: product.id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }

      if (collectionIds.length) {
        await tx.productCollectionLink.createMany({
          data: collectionIds.map((collectionId) => ({
            tenantId,
            productId: product.id,
            collectionId,
          })),
          skipDuplicates: true,
        });
      }

      return product;
    });

    // mapper beklentisi için include’lu geri dön
    return this.getProductById(tenantId, created.id, false);
  }

  async adminUpdateProduct(
    tenantId: string,
    id: string,
    data: Partial<{
      title: string;
      handle: string;
      subtitle: string | null;
      description: string | null;
      rank: number;
      seoTitle: string | null;
      seoDescription: string | null;
      searchKeywords: string | null;
      status: "draft" | "published";
      categoryIds: string[];
      collectionIds: string[];
    }>
  ) {
    const categoryIds = data.categoryIds ?? null; // null => dokunma
    const collectionIds = data.collectionIds ?? null; // null => dokunma

    await this.prisma.$transaction(async (tx) => {
      await tx.catalogProduct.update({
        where: { id },
        data: {
          title: data.title ?? undefined,
          handle: data.handle ?? undefined,
          subtitle: data.subtitle ?? undefined,
          description: data.description ?? undefined,
          rank: data.rank ?? undefined,
          seoTitle: data.seoTitle ?? undefined,
          seoDescription: data.seoDescription ?? undefined,
          searchKeywords: data.searchKeywords ?? undefined,
          status: (data.status as any) ?? undefined,
          publishedAt:
            data.status === "published"
              ? this.now()
              : data.status === "draft"
              ? null
              : undefined,
        },
      });

      // ✅ categories replace-set (sadece categoryIds gönderildiyse)
      if (categoryIds !== null) {
        await tx.productCategoryLink.deleteMany({
          where: { tenantId, productId: id },
        });
        if (categoryIds.length) {
          await tx.productCategoryLink.createMany({
            data: categoryIds.map((categoryId) => ({
              tenantId,
              productId: id,
              categoryId,
            })),
            skipDuplicates: true,
          });
        }
      }

      // ✅ collections replace-set (sadece collectionIds gönderildiyse)
      if (collectionIds !== null) {
        await tx.productCollectionLink.deleteMany({
          where: { tenantId, productId: id },
        });
        if (collectionIds.length) {
          await tx.productCollectionLink.createMany({
            data: collectionIds.map((collectionId) => ({
              tenantId,
              productId: id,
              collectionId,
            })),
            skipDuplicates: true,
          });
        }
      }
    });

    return this.getProductById(tenantId, id, false);
  }

  async adminPublishProduct(tenantId: string, id: string) {
    await this.prisma.catalogProduct.update({
      where: { id },
      data: {
        status: "published",
        publishedAt: this.now(),
      },
    });

    return this.getProductById(tenantId, id, false);
  }

  async adminUnpublishProduct(tenantId: string, id: string) {
    await this.prisma.catalogProduct.update({
      where: { id },
      data: {
        status: "draft",
        publishedAt: null,
      },
    });

    return this.getProductById(tenantId, id, false);
  }

  async adminSoftDeleteProduct(tenantId: string, id: string) {
    await this.prisma.$transaction(async (tx) => {
      // Link cleanup: category/collection/tag (silme conflict’lerini kaldırır)
      await tx.productCategoryLink.deleteMany({
        where: { tenantId, productId: id },
      });
      await tx.productCollectionLink.deleteMany({
        where: { tenantId, productId: id },
      });
      await tx.productTagLink.deleteMany({
        where: { tenantId, productId: id },
      });

      // (Opsiyonel) ürün media link’leri de temizlik
      await tx.productMedia.deleteMany({ where: { tenantId, productId: id } });

      // Soft delete product
      await tx.catalogProduct.update({
        where: { id },
        data: { deletedAt: this.now(), status: "draft", publishedAt: null },
      });
    });

    return { ok: true };
  }

  // =========================================================
  // Variants (CatalogProductVariant) ✅ deletedAt YOK -> HARD DELETE
  // =========================================================

  async getProductVariants(
    tenantId: string,
    productId: string,
    publishedOnly: boolean
  ) {
    // publishedOnly burada şimdilik kullanılmıyor; ileride product.status check ile entegre edilebilir
    return this.prisma.catalogProductVariant.findMany({
      where: { tenantId, productId, isActive: true },
      orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
    });
  }
  async getVariantInventorySnapshot(tenantId: string, variantId: string) {
    const levels = await this.prisma.inventoryLevel.findMany({
      where: { tenantId, variantId, deletedAt: null },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        locationId: true,
        stockedQuantity: true,
        reservedQuantity: true,
      },
    });

    const locationIds = Array.from(new Set(levels.map((l) => l.locationId)));

    const locations = await this.prisma.inventoryLocation.findMany({
      where: { tenantId, id: { in: locationIds }, deletedAt: null },
      select: { id: true, name: true, isDefault: true },
    });

    const locById = new Map(locations.map((l) => [l.id, l]));

    const defaultLocationId = locations.find((l) => l.isDefault)?.id ?? null;

    return {
      defaultLocationId,
      levels: levels.map((l) => ({
        locationId: l.locationId,
        locationName: locById.get(l.locationId)?.name ?? "—",
        stockedQuantity: l.stockedQuantity,
        reservedQuantity: l.reservedQuantity,
        availableQuantity: l.stockedQuantity - l.reservedQuantity,
      })),
    };
  }

  async getVariantById(tenantId: string, id: string) {
    return this.prisma.catalogProductVariant.findFirst({
      where: { tenantId, id },
    });
  }
  async getVariantInventoryLevels(tenantId: string, variantId: string) {
    return this.prisma.inventoryLevel.findMany({
      where: { tenantId, variantId },
      include: {
        location: { select: { id: true, name: true, isDefault: true } },
      },
      orderBy: [{ createdAt: "asc" }],
    });
  }

  async adminCreateVariant(
    tenantId: string,
    productId: string,
    data: { title?: string; sku?: string; barcode?: string }
  ) {
    return this.prisma.catalogProductVariant.create({
      data: {
        tenantId,
        productId,
        title: data.title ?? null,
        sku: data.sku ?? null,
        barcode: data.barcode ?? null,
      },
    });
  }

  async adminUpdateVariant(
    tenantId: string,
    id: string,
    data: {
      title?: string | null;
      sku?: string | null;
      barcode?: string | null;
      rank?: number;
      isActive?: boolean;
      metadata?: any;
    }
  ) {
    return this.prisma.catalogProductVariant.update({
      where: { tenantId_id: { tenantId, id } },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.sku !== undefined ? { sku: data.sku } : {}),
        ...(data.barcode !== undefined ? { barcode: data.barcode } : {}),
        ...(data.rank !== undefined ? { rank: data.rank } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
      },
    });
  }

  async isVariantInUse(tenantId: string, variantId: string): Promise<boolean> {
    const [cartN, orderN, invResN, invLevelN] = await this.prisma.$transaction([
      this.prisma.cartLineItem.count({ where: { tenantId, variantId } }),
      this.prisma.orderLineItem.count({ where: { tenantId, variantId } }),
      this.prisma.inventoryReservation.count({
        where: { tenantId, variantId },
      }),
      this.prisma.inventoryLevel.count({ where: { tenantId, variantId } }),
    ]);

    return cartN + orderN + invResN + invLevelN > 0;
  }

  async adminDeleteVariant(tenantId: string, id: string) {
    // FK riskini azalt: önce variant-option linklerini temizle
    await this.prisma.productVariantOptionValue.deleteMany({
      where: { tenantId, variantId: id },
    });

    return this.prisma.catalogProductVariant.delete({
      where: { id },
    });
  }

  // =========================================================
  // Options (ProductOption / ProductOptionValue)
  // =========================================================

  async getOptionById(tenantId: string, id: string) {
    return this.prisma.productOption.findFirst({
      where: { tenantId, id },
      include: { values: true },
    });
  }

  async getOptionValueById(tenantId: string, id: string) {
    return this.prisma.productOptionValue.findFirst({
      where: { tenantId, id },
    });
  }

  async isOptionInUse(tenantId: string, optionId: string): Promise<boolean> {
    // Option silmeden önce değer var mı kontrolü (kurumsal: önce cleanup endpoint’i yazılmadan silme yok)
    const n = await this.prisma.productOptionValue.count({
      where: { tenantId, optionId },
    });
    return n > 0;
  }

  async isOptionValueInUse(
    tenantId: string,
    optionValueId: string
  ): Promise<boolean> {
    const n = await this.prisma.productVariantOptionValue.count({
      where: { tenantId, optionValueId },
    });
    return n > 0;
  }

  async adminCreateOption(
    tenantId: string,
    productId: string,
    data: { title: string }
  ) {
    return this.prisma.productOption.create({
      data: { tenantId, productId, title: data.title },
      include: { values: true },
    });
  }

  async adminAddOptionValue(
    tenantId: string,
    optionId: string,
    data: { value: string }
  ) {
    return this.prisma.productOptionValue.create({
      data: { tenantId, optionId, value: data.value },
    });
  }

  async adminDeleteOption(tenantId: string, optionId: string) {
    // Service zaten isOptionInUse ile 409 veriyor; yine de güvenli davranalım:
    await this.prisma.productOptionValue.deleteMany({
      where: { tenantId, optionId },
    });

    return this.prisma.productOption.delete({
      where: { id: optionId },
    });
  }

  async adminDeleteOptionValue(tenantId: string, optionValueId: string) {
    return this.prisma.productOptionValue.delete({
      where: { id: optionValueId },
    });
  }
  // =========================================================
  // Collections (ProductCollection)  — Store tarafı bunu kullanıyor
  // =========================================================
  async listCollections(tenantId: string) {
    return this.prisma.productCollection.findMany({
      where: { tenantId },
      orderBy: [{ createdAt: "desc" }],
    });
  }

  async getCollectionById(tenantId: string, id: string) {
    return this.prisma.productCollection.findFirst({
      where: { tenantId, id },
    });
  }
}
