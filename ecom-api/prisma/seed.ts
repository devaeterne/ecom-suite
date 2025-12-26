import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1) PRODUCT
  const handle = "demo-product";

  let product = await prisma.catalogProduct.findFirst({
    where: { handle, deletedAt: null },
    select: { id: true },
  });

  if (!product) {
    product = await prisma.catalogProduct.create({
      data: {
        handle,
        title: "Demo Product",
        status: "published",
        brand: "Demo Brand",
        type: "simple",
        seoTitle: "Demo Product",
        seoDescription: "Demo product description",
        publishedAt: new Date(),
        rank: 0,
        metadata: {},
      },
      select: { id: true },
    });
  } else {
    await prisma.catalogProduct.update({
      where: { id: product.id },
      data: {
        title: "Demo Product",
        status: "published",
        brand: "Demo Brand",
        type: "simple",
        seoTitle: "Demo Product",
        seoDescription: "Demo product description",
        publishedAt: new Date(),
      },
    });
  }

  // 2) VARIANT
  const sku = "SKU-001";

  let variant = await prisma.catalogProductVariant.findFirst({
    where: { sku, deletedAt: null },
    select: { id: true, productId: true },
  });

  if (!variant) {
    variant = await prisma.catalogProductVariant.create({
      data: {
        productId: product.id,
        title: "Default Variant",
        sku,
        isDefault: true,
        isActive: true,
        manageInventory: true,
        allowBackorder: false,
        metadata: {},
      },
      select: { id: true, productId: true },
    });
  } else {
    await prisma.catalogProductVariant.update({
      where: { id: variant.id },
      data: {
        productId: product.id,
        title: "Default Variant",
        isDefault: true,
        isActive: true,
        manageInventory: true,
        allowBackorder: false,
      },
    });
  }

  // 3) PRICE SET (one active default)
  const priceSetType = "default";

  let priceSet = await prisma.catalogPriceSet.findFirst({
    where: { variantId: variant.id, type: priceSetType, deletedAt: null },
    select: { id: true },
  });

  if (!priceSet) {
    priceSet = await prisma.catalogPriceSet.create({
      data: {
        variantId: variant.id,
        type: priceSetType,
        isActive: true,
        metadata: {},
      },
      select: { id: true },
    });
  } else {
    await prisma.catalogPriceSet.update({
      where: { id: priceSet.id },
      data: { isActive: true },
    });
  }

  // 4) MONEY AMOUNT (EUR 19.99 => 1999)
  const currencyCode = "EUR";
  const amount = 1999;

  const existingAmount = await prisma.catalogMoneyAmount.findFirst({
    where: {
      priceSetId: priceSet.id,
      currencyCode,
      deletedAt: null,
      isActive: true,
    },
    select: { id: true },
  });

  if (!existingAmount) {
    await prisma.catalogMoneyAmount.create({
      data: {
        priceSetId: priceSet.id,
        currencyCode,
        amount,
        isActive: true,
        metadata: {},
      },
    });
  } else {
    await prisma.catalogMoneyAmount.update({
      where: { id: existingAmount.id },
      data: { amount },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
