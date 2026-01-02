import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

type ListProductsArgs = {
  tenantId: string;
  q?: string;
  categoryId?: string;
  collectionId?: string;
  offset: number;
  limit: number;
  publishedOnly: boolean;
};

@Injectable()
export class CatalogRepo {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(tenantId: string) {
    return this.prisma.productCategory.findMany({
      where: { tenantId },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
    });
  }

  async getCategoryById(tenantId: string, id: string) {
    return this.prisma.productCategory.findFirst({
      where: { tenantId, id },
    });
  }

  async listCollections(tenantId: string) {
    return this.prisma.productCollection.findMany({
      where: { tenantId },
      orderBy: { title: "asc" },
    });
  }

  async listProducts(args: ListProductsArgs) {
    const {
      tenantId,
      q,
      categoryId,
      collectionId,
      offset,
      limit,
      publishedOnly,
    } = args;

    // NOTE: Relation isimleri schema’ya göre farklıysa düzeltmen yeterli.
    // Bu repo; "productCategories" / "productCollections" gibi link tablolarını
    // include etmek yerine "categories"/"collections" ilişkisinin mevcut olduğunu varsayar.
    const where: any = {
      tenantId,
      deletedAt: null, // CatalogProduct'ta var ✅
      ...(publishedOnly ? { status: "published" } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { handle: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(categoryId
        ? {
            categories: {
              some: { categoryId }, // ✅ link field
            },
          }
        : {}),
      ...(collectionId
        ? {
            collections: {
              some: { collectionId }, // ✅ link field (ProductCollectionLink)
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.catalogProduct.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip: offset,
        take: limit,
        include: {
          categories: { include: { category: true } }, // ✅ link -> category
          collections: { include: { collection: true } }, // ✅ link -> collection
          variants: true, // ✅ variant'ta deletedAt yok
        },
      }),
      this.prisma.catalogProduct.count({ where }),
    ]);

    return { items, total };
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
        categories: { include: { category: true } },
        collections: { include: { collection: true } },
        variants: true,
      },
    });
  }

  async getProductVariants(
    tenantId: string,
    productId: string,
    publishedOnly: boolean
  ) {
    const product = await this.prisma.catalogProduct.findFirst({
      where: {
        tenantId,
        id: productId,
        deletedAt: null,
        ...(publishedOnly ? { status: "published" } : {}),
      },
      select: { id: true },
    });

    if (!product) return null;

    return this.prisma.catalogProductVariant.findMany({
      where: { tenantId, productId },
      orderBy: { createdAt: "asc" },
    });
  }

  // ===== ADMIN =====

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

  async adminUpdateCategory(
    tenantId: string,
    id: string,
    data: { name?: string; handle?: string; parentId?: string | null }
  ) {
    return this.prisma.productCategory.update({
      where: { id, tenantId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.handle !== undefined ? { handle: data.handle } : {}),
        ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
      },
    });
  }

  async adminCreateProduct(tenantId: string, data: any) {
    return this.prisma.catalogProduct.create({
      data: {
        tenantId,
        title: data.title,
        handle: data.handle,
        description: data.description ?? null,
        status: data.status ?? "draft",

        ...(data.categoryIds?.length
          ? {
              categories: {
                create: data.categoryIds.map((categoryId: string) => ({
                  categoryId, // ✅ tenantId yok
                })),
              },
            }
          : {}),

        ...(data.collectionIds?.length
          ? {
              collections: {
                create: data.collectionIds.map((collectionId: string) => ({
                  collectionId, // ✅ tenantId yok
                })),
              },
            }
          : {}),

        ...(data.variants?.length
          ? {
              variants: {
                create: data.variants.map((v: any) => ({
                  title: v.title ?? null,
                  sku: v.sku ?? null,
                  barcode: v.barcode ?? null,
                  isActive: v.isActive ?? true,
                  // ✅ tenantId yok
                })),
              },
            }
          : {}),
      },
      include: {
        categories: { include: { category: true } },
        collections: { include: { collection: true } },
        variants: true,
      },
    });
  }

  async adminUpdateProduct(tenantId: string, id: string, data: any) {
    return this.prisma.catalogProduct.update({
      // ✅ composite var ise bunu kullan (tercih)
      where: { tenantId_id: { tenantId, id } },

      // composite yoksa şu da olur:
      // where: { id, tenantId },

      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.handle !== undefined ? { handle: data.handle } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),

        ...(data.categoryIds
          ? {
              categories: {
                deleteMany: {}, // product scope içinde çalışır
                create: data.categoryIds.map((categoryId: string) => ({
                  categoryId, // ✅ tenantId YOK
                })),
              },
            }
          : {}),

        ...(data.collectionIds
          ? {
              collections: {
                deleteMany: {},
                create: data.collectionIds.map((collectionId: string) => ({
                  collectionId, // ✅ tenantId YOK
                })),
              },
            }
          : {}),
      },

      include: {
        categories: { include: { category: true } },
        collections: { include: { collection: true } },
        variants: true,
      },
    });
  }

  async adminPublishProduct(tenantId: string, id: string) {
    return this.prisma.catalogProduct.update({
      // ikisi de olur; sende hangisi çalışıyorsa onu bırak
      where: { tenantId_id: { tenantId, id } },
      // where: { id, tenantId },

      data: {
        status: "published",
        publishedAt: new Date(),
      },

      // 🔥 kritik: mapper’ın beklediği nested include
      include: {
        categories: { include: { category: true } },
        collections: { include: { collection: true } },
        variants: true,
      },
    });
  }
}
