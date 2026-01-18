// src/modules/catalog/common/prisma/catalog.repo.ts
import { Injectable } from "@nestjs/common";
import { Prisma, ProductStatus } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

type LocaleFallback = {
  requested?: string | null;
  fallback?: string | null; // e.g. "en"
};

type ListProductsArgs = {
  tenantId: string;
  q?: string;
  status?: ProductStatus; // "draft" | "published" | "archived"
  categoryId?: string;
  collectionId?: string;
  offset: number;
  limit: number;
  publishedOnly: boolean;

  locale?: LocaleFallback;

  includeTags?: boolean;
  includeCollections?: boolean;
  includeCategoryTranslations?: boolean;
  includeProductTranslations?: boolean;
};

function uniqLocales(
  requested?: string | null,
  fallback?: string | null,
): string[] {
  return Array.from(
    new Set(
      [requested, fallback].filter(
        (x): x is string => typeof x === "string" && x.trim().length > 0,
      ),
    ),
  );
}

@Injectable()
export class CatalogRepo {
  constructor(private readonly prisma: PrismaService) {}

  private now() {
    return new Date();
  }

  // =========================================================
  // Categories (ProductCategory) — HARD DELETE
  // =========================================================

  async hasCategoryChildren(
    tenantId: string,
    categoryId: string,
  ): Promise<boolean> {
    const n = await this.prisma.productCategory.count({
      where: { tenantId, parentId: categoryId },
    });
    return n > 0;
  }

  async listCategories(
    tenantId: string,
    opts?: { localeCode?: string; q?: string; isActive?: boolean },
  ) {
    const localeCode = opts?.localeCode;
    const q = opts?.q?.trim();
    const isActive = opts?.isActive;

    return this.prisma.productCategory.findMany({
      where: {
        tenantId,
        ...(typeof isActive === "boolean" ? { isActive } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { handle: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ rank: "asc" }, { createdAt: "asc" }],

      // ✅ include tek yerde: overwrite yok
      include: {
        _count: { select: { products: true } },

        ...(localeCode
          ? {
              productCategoryTranslations: {
                where: { tenantId, localeCode },
                take: 1,
              },
            }
          : {}),
      },
    });
  }

  async getCategoryById(tenantId: string, id: string) {
    return this.prisma.productCategory.findFirst({
      where: { tenantId, id },
    });
  }

  async getCategoryParentRef(tenantId: string, id: string) {
    return this.prisma.productCategory.findFirst({
      where: { tenantId, id },
      select: { id: true, parentId: true },
    });
  }

  async isCategoryInUse(
    tenantId: string,
    categoryId: string,
  ): Promise<boolean> {
    const n = await this.prisma.productCategoryLink.count({
      where: { tenantId, categoryId },
    });
    return n > 0;
  }

  async adminCreateCategory(
    tenantId: string,
    data: {
      name: string;
      handle: string;
      parentId?: string | null;
      isActive?: boolean;
    },
  ) {
    return this.prisma.productCategory.create({
      data: {
        tenantId,
        name: data.name,
        handle: data.handle,
        parentId: data.parentId ?? null,
        isActive: data.isActive ?? true, // ✅ ekle
      },
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
      metadata?: Prisma.InputJsonValue | null;
    },
  ) {
    return this.prisma.productCategory.update({
      where: { tenantId_id: { tenantId, id } },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.handle !== undefined ? { handle: data.handle } : {}),
        ...(data.rank !== undefined ? { rank: data.rank } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
        ...(data.metadata !== undefined
          ? {
              metadata: (data.metadata === null
                ? Prisma.JsonNull
                : data.metadata) as any,
            }
          : {}),
      },
    });
  }

  async adminDeleteCategory(tenantId: string, id: string) {
    // tenant-safe
    return this.prisma.productCategory.delete({
      where: { tenantId_id: { tenantId, id } },
    });
  }

  // =========================================================
  // Products (CatalogProduct) — SOFT DELETE
  // =========================================================

  async listProducts(
    args: ListProductsArgs,
  ): Promise<{ items: any[]; total: number }> {
    const {
      tenantId,
      q,
      categoryId,
      collectionId,
      offset,
      limit,
      publishedOnly,

      includeTags = true,
      includeCollections = true,
      includeCategoryTranslations = false,
      includeProductTranslations = false,
      locale,
    } = args;

    const localeIn = uniqLocales(
      locale?.requested ?? null,
      locale?.fallback ?? null,
    );

    const where: Prisma.CatalogProductWhereInput = {
      tenantId,
      deletedAt: null,
      ...(publishedOnly ? { status: "published" } : {}),
      ...(args.status ? { status: args.status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { handle: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(categoryId ? { categories: { some: { tenantId, categoryId } } } : {}),
      ...(collectionId
        ? { collections: { some: { tenantId, collectionId } } }
        : {}),
    };

    const include: Prisma.CatalogProductInclude = {
      variants: true,
      categories: {
        include: {
          category:
            includeCategoryTranslations && localeIn.length
              ? {
                  include: {
                    productCategoryTranslations: {
                      where: { tenantId, localeCode: { in: localeIn } },
                    },
                  },
                }
              : true,
        },
      },
      ...(includeCollections
        ? { collections: { include: { collection: true } } }
        : {}),
      ...(includeTags ? { tags: { include: { tag: true } } } : {}),
      ...(includeProductTranslations && localeIn.length
        ? {
            catalogProductTranslations: {
              where: { tenantId, localeCode: { in: localeIn } },
            },
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
        include,
      }),
    ]);

    const variantIds = Array.from(
      new Set(
        items.flatMap((p: any) =>
          Array.isArray(p.variants) ? p.variants.map((v: any) => v.id) : [],
        ),
      ),
    );

    if (variantIds.length === 0) {
      return {
        total,
        items: items.map((p: any) => ({ ...p, stockAvailable: 0 })),
      };
    }

    const invAgg = await this.prisma.inventoryLevel.groupBy({
      by: ["variantId"],
      where: {
        tenantId,
        deletedAt: null,
        variantId: { in: variantIds },
      },
      _sum: { stockedQuantity: true, reservedQuantity: true },
    });

    const availableByVariantId = new Map<string, number>(
      invAgg.map((x: any) => [
        x.variantId,
        (x._sum.stockedQuantity ?? 0) - (x._sum.reservedQuantity ?? 0),
      ]),
    );

    const itemsWithStock = items.map((p: any) => {
      const stockAvailable = Array.isArray(p.variants)
        ? p.variants.reduce(
            (acc: number, v: any) =>
              acc + (availableByVariantId.get(v.id) ?? 0),
            0,
          )
        : 0;

      return { ...p, stockAvailable };
    });

    return { total, items: itemsWithStock };
  }

  async getProductById(
    tenantId: string,
    id: string,
    publishedOnly: boolean,
    locale?: LocaleFallback,
  ) {
    const localeIn = uniqLocales(
      locale?.requested ?? null,
      locale?.fallback ?? null,
    );

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
              select: {
                id: true,
                handle: true,
                parentId: true,
                name: true,
                productCategoryTranslations: localeIn.length
                  ? {
                      where: { tenantId, localeCode: { in: localeIn } },
                      select: {
                        localeCode: true,
                        title: true,
                        description: true,
                      },
                    }
                  : false,
              },
            },
          },
        },
        collections: {
          include: {
            collection: { select: { id: true, title: true, handle: true } },
          },
        },
        variants: true,
        tags: { include: { tag: { select: { id: true, value: true } } } },
        ...(localeIn.length
          ? {
              catalogProductTranslations: {
                where: { tenantId, localeCode: { in: localeIn } },
              },
            }
          : {}),
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
      variants?: Array<{
        title: string;
        sku?: string | null;
        barcode?: string | null;
        isActive?: boolean;
      }>;
    },
  ) {
    const categoryIds = data.categoryIds ?? [];
    const collectionIds = data.collectionIds ?? [];
    const variants = data.variants ?? [];

    const created = await this.prisma.$transaction(async (tx) => {
      const product = await tx.catalogProduct.create({
        data: {
          tenantId,
          title: data.title,
          handle: data.handle,
          subtitle: data.subtitle ?? null,
          description: data.description ?? null,
          status: (data.status as any) ?? "draft",
          publishedAt: data.status === "published" ? this.now() : null,
        },
        select: { id: true },
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

      const toCreate =
        variants.length > 0
          ? variants
          : [{ title: "Default", sku: null, barcode: null, isActive: true }];

      await tx.catalogProductVariant.createMany({
        data: toCreate.map((v, idx) => ({
          tenantId,
          productId: product.id,
          title: v.title ?? null,
          sku: v.sku ?? null,
          barcode: v.barcode ?? null,
          isActive: v.isActive ?? true,
          rank: idx,
          metadata: {},
        })),
      });

      return product;
    });

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
    }>,
  ) {
    const categoryIds = data.categoryIds ?? null; // null => dokunma
    const collectionIds = data.collectionIds ?? null; // null => dokunma

    await this.prisma.$transaction(async (tx) => {
      // ✅ tenant-safe update
      await tx.catalogProduct.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.handle !== undefined ? { handle: data.handle } : {}),
          ...(data.subtitle !== undefined ? { subtitle: data.subtitle } : {}),
          ...(data.description !== undefined
            ? { description: data.description }
            : {}),
          ...(data.rank !== undefined ? { rank: data.rank } : {}),
          ...(data.seoTitle !== undefined ? { seoTitle: data.seoTitle } : {}),
          ...(data.seoDescription !== undefined
            ? { seoDescription: data.seoDescription }
            : {}),
          ...(data.searchKeywords !== undefined
            ? { searchKeywords: data.searchKeywords }
            : {}),
          ...(data.status !== undefined ? { status: data.status as any } : {}),
          ...(data.status === "published"
            ? { publishedAt: this.now() }
            : data.status === "draft"
              ? { publishedAt: null }
              : {}),
        },
      });

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
      where: { tenantId_id: { tenantId, id } },
      data: { status: "published", publishedAt: this.now() },
    });
    return this.getProductById(tenantId, id, false);
  }

  async adminUnpublishProduct(tenantId: string, id: string) {
    await this.prisma.catalogProduct.update({
      where: { tenantId_id: { tenantId, id } },
      data: { status: "draft", publishedAt: null },
    });
    return this.getProductById(tenantId, id, false);
  }

  async adminSoftDeleteProduct(tenantId: string, id: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.productCategoryLink.deleteMany({
        where: { tenantId, productId: id },
      });
      await tx.productCollectionLink.deleteMany({
        where: { tenantId, productId: id },
      });
      await tx.productTagLink.deleteMany({
        where: { tenantId, productId: id },
      });
      await tx.productMedia.deleteMany({ where: { tenantId, productId: id } });

      await tx.catalogProduct.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: this.now(), status: "draft", publishedAt: null },
      });
    });

    return { ok: true };
  }

  // =========================================================
  // Variants (CatalogProductVariant) — HARD DELETE
  // =========================================================

  async getProductVariants(
    tenantId: string,
    productId: string,
    _publishedOnly: boolean,
  ) {
    return this.prisma.catalogProductVariant.findMany({
      where: { tenantId, productId, isActive: true },
      orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
    });
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

  async replaceProductCategories(
    tenantId: string,
    productId: string,
    categoryIds: string[],
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.productCategoryLink.deleteMany({
        where: { tenantId, productId },
      });
      if (categoryIds.length) {
        await tx.productCategoryLink.createMany({
          data: categoryIds.map((categoryId) => ({
            tenantId,
            productId,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }
    });
    return this.getProductById(tenantId, productId, false);
  }

  async adminCreateVariant(
    tenantId: string,
    productId: string,
    data: {
      title?: string | null;
      sku?: string | null;
      barcode?: string | null;
      rank?: number;
      isActive?: boolean;
      metadata?: Prisma.JsonValue;
    },
  ) {
    return this.prisma.catalogProductVariant.create({
      data: {
        tenantId,
        productId,
        title: data.title ?? null,
        sku: data.sku ?? null,
        barcode: data.barcode ?? null,
        rank: data.rank ?? 0,
        isActive: data.isActive ?? true,
        metadata: (data.metadata ?? {}) as any,
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
      metadata?: Prisma.JsonValue;
    },
  ) {
    return this.prisma.catalogProductVariant.update({
      where: { tenantId_id: { tenantId, id } },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.sku !== undefined ? { sku: data.sku } : {}),
        ...(data.barcode !== undefined ? { barcode: data.barcode } : {}),
        ...(data.rank !== undefined ? { rank: data.rank } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.metadata !== undefined
          ? { metadata: data.metadata as any }
          : {}),
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
    await this.prisma.$transaction(async (tx) => {
      await tx.productVariantOptionValue.deleteMany({
        where: { tenantId, variantId: id },
      });

      // ✅ tenant-safe delete
      await tx.catalogProductVariant.delete({
        where: { tenantId_id: { tenantId, id } },
      });
    });

    return { ok: true };
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
    const n = await this.prisma.productOptionValue.count({
      where: { tenantId, optionId },
    });
    return n > 0;
  }

  async isOptionValueInUse(
    tenantId: string,
    optionValueId: string,
  ): Promise<boolean> {
    const n = await this.prisma.productVariantOptionValue.count({
      where: { tenantId, optionValueId },
    });
    return n > 0;
  }

  async adminCreateOption(
    tenantId: string,
    productId: string,
    data: { title: string },
  ) {
    return this.prisma.productOption.create({
      data: { tenantId, productId, title: data.title },
      include: { values: true },
    });
  }

  async adminAddOptionValue(
    tenantId: string,
    optionId: string,
    data: { value: string },
  ) {
    return this.prisma.productOptionValue.create({
      data: { tenantId, optionId, value: data.value },
    });
  }

  async adminDeleteOption(tenantId: string, optionId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.productOptionValue.deleteMany({ where: { tenantId, optionId } });

      // ✅ tenant-safe delete
      await tx.productOption.delete({
        where: { tenantId_id: { tenantId, id: optionId } },
      });
    });

    return { ok: true };
  }

  async adminDeleteOptionValue(tenantId: string, optionValueId: string) {
    // ✅ tenant-safe delete
    await this.prisma.productOptionValue.delete({
      where: { tenantId_id: { tenantId, id: optionValueId } },
    });
    return { ok: true };
  }

  // =========================================================
  // Collections (ProductCollection)
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
