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

const notDeleted = { deletedAt: null } as const;

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
      ...notDeleted, // CatalogProduct'ta var ✅
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
        skip: offset,
        take: limit,
        orderBy: [{ createdAt: "desc" }],
        include: {
          categories: { include: { category: true } },
          collections: { include: { collection: true } },
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
        ...notDeleted,
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
        ...notDeleted,
        ...(publishedOnly ? { status: "published" } : {}),
      },
      include: {
        variants: true,
      },
    });

    return product?.variants ?? [];
  }

  async adminCreateCategory(tenantId: string, data: any) {
    return this.prisma.productCategory.create({
      data: {
        tenantId,
        name: data.name,
        handle: data.handle ?? null,
        parentId: data.parentId ?? null,
        rank: data.rank ?? 0,
      },
    });
  }

  async adminUpdateCategory(tenantId: string, id: string, data: any) {
    return this.prisma.productCategory.update({
      where: { id },
      data: {
        // tenantId check'i policy seviyesinde yapılabilir
        name: data.name ?? undefined,
        handle: data.handle ?? undefined,
        parentId: data.parentId ?? undefined,
        rank: data.rank ?? undefined,
      },
    });
  }

  async adminCreateProduct(tenantId: string, data: any) {
    return this.prisma.catalogProduct.create({
      data: {
        tenantId,
        title: data.title,
        handle: data.handle ?? null,
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
                  collectionId,
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
    // Basit update: links'i komple resetlemek yerine ileride patch mantığı eklenebilir.
    // Şimdilik: categoryIds/collectionIds gelirse set gibi davran.
    return this.prisma.catalogProduct.update({
      where: { id },
      data: {
        title: data.title ?? undefined,
        handle: data.handle ?? undefined,
        description: data.description ?? undefined,
        status: data.status ?? undefined,

        ...(Array.isArray(data.categoryIds)
          ? {
              categories: {
                deleteMany: {},
                create: data.categoryIds.map((categoryId: string) => ({
                  categoryId,
                })),
              },
            }
          : {}),

        ...(Array.isArray(data.collectionIds)
          ? {
              collections: {
                deleteMany: {},
                create: data.collectionIds.map((collectionId: string) => ({
                  collectionId,
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
      where: { id },
      data: {
        status: "published",
      },
      include: {
        categories: { include: { category: true } },
        collections: { include: { collection: true } },
        variants: true,
      },
    });
  }
}
