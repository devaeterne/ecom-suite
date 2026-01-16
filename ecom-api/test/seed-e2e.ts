/* prisma/seed-e2e.ts */
import { PrismaService } from "@/prisma/prisma.service";
import { AuthProviderType, ProductStatus, RoleScope } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { fx } from "@test/helpers/fixtures";

/**
 * Gate E2E seed contract:
 * - Tenant + RBAC (owner/support) + store customer identity
 * - At least 1 product + 1 variant (published) + priceSet + moneyAmount
 * - At least 1 inventory location + inventory level (stock > 0)
 * - At least 1 shipping carrier
 *
 * Notes:
 * - Owner gets ALL permissions that exist in DB (future-proof)
 * - Uses upsert/createMany(skipDuplicates) for idempotency
 */

const prisma = new PrismaService();

// Testlerin direkt beklediği minimal permission key’ler (bootstrap için)
const REQUIRED_PERMISSION_KEYS = [
  // roles
  "admin:roles:read",
  "admin:roles:create",
  "admin:roles:update",
  "admin:roles:permissions",

  // permissions
  "admin:permissions:read",

  // identities
  "admin:identities:read",
  "admin:identities:create",

  // tenant
  "admin:tenant:read",
  "admin:tenant:update",

  // (opsiyonel ama pratik) catalog/inventory/pricing/orders/shipping
  "admin:catalog:read",
  "admin:catalog:write",
  "admin:inventory:read",
  "admin:inventory:write",
  "admin:pricing:read",
  "admin:pricing:write",
  "admin:orders:read",
  "admin:orders:write",
  "admin:shipping:read",
  "admin:shipping:write",
  "admin:files:read",
  "admin:files:write",
] as const;

function cleanEnv(v: any) {
  return String(v ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");
}

async function main() {
  console.log("🌱 Seeding E2E test data...");

  await prisma.$connect();

  // --- 0) hashes
  const ownerHash = await bcrypt.hash(fx.owner.password, 10);
  const supportHash = await bcrypt.hash(fx.support.password, 10);
  const storeHash = await bcrypt.hash(fx.storeUser.password, 10);

  // --- 1) tenant
  const tenant = await prisma.tenant.upsert({
    where: { code: fx.tenantKey },
    create: {
      code: fx.tenantKey,
      name: "Acme Corp (E2E)",
      isActive: true,
    },
    update: {
      // no-op (idempotent)
    },
  });

  // --- 2) roles
  const ownerRole = await prisma.role.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: "owner",
      },
    },
    create: {
      tenantId: tenant.id,
      name: "owner",
      scope: RoleScope.ADMIN,
      description: "Owner with full access (E2E)",
      isActive: true,
    },
    update: {
      isActive: true,
    },
  });

  const supportRole = await prisma.role.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: "support",
      },
    },
    create: {
      tenantId: tenant.id,
      name: "support",
      scope: RoleScope.STAFF,
      description: "Support staff (E2E)",
      isActive: true,
    },
    update: {
      isActive: true,
    },
  });

  // --- 3) ensure required permissions exist (global tenantId=null)
  await prisma.permission.createMany({
    data: REQUIRED_PERMISSION_KEYS.map((key) => ({
      key,
      description: key,
      tenantId: null,
    })),
    skipDuplicates: true,
  });

  // --- 4) owner user + identity
  const ownerUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: fx.owner.email,
      },
    },
    create: {
      tenantId: tenant.id,
      email: fx.owner.email,
      name: "Admin Owner (E2E)",
      isActive: true,
    },
    update: {
      isActive: true,
    },
  });

  await prisma.authIdentity.upsert({
    where: {
      tenantId_provider_providerId: {
        tenantId: tenant.id,
        provider: AuthProviderType.EMAIL_PASSWORD,
        providerId: fx.owner.email,
      },
    },
    create: {
      tenantId: tenant.id,
      provider: AuthProviderType.EMAIL_PASSWORD,
      providerId: fx.owner.email,
      userId: ownerUser.id,
      passwordHash: ownerHash,
      passwordAlgo: "bcrypt",
      passwordUpdatedAt: new Date(),
    },
    update: {
      passwordHash: ownerHash,
      passwordUpdatedAt: new Date(),
    },
  });

  await prisma.userRoleLink.upsert({
    where: {
      tenantId_userId_roleId: {
        tenantId: tenant.id,
        userId: ownerUser.id,
        roleId: ownerRole.id,
      },
    },
    create: {
      tenantId: tenant.id,
      userId: ownerUser.id,
      roleId: ownerRole.id,
    },
    update: {},
  });

  // --- 5) support user + identity
  const supportUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: fx.support.email,
      },
    },
    create: {
      tenantId: tenant.id,
      email: fx.support.email,
      name: "Support (E2E)",
      isActive: true,
    },
    update: {
      isActive: true,
    },
  });

  await prisma.authIdentity.upsert({
    where: {
      tenantId_provider_providerId: {
        tenantId: tenant.id,
        provider: AuthProviderType.EMAIL_PASSWORD,
        providerId: fx.support.email,
      },
    },
    create: {
      tenantId: tenant.id,
      provider: AuthProviderType.EMAIL_PASSWORD,
      providerId: fx.support.email,
      userId: supportUser.id,
      passwordHash: supportHash,
      passwordAlgo: "bcrypt",
      passwordUpdatedAt: new Date(),
    },
    update: {
      passwordHash: supportHash,
      passwordUpdatedAt: new Date(),
    },
  });

  await prisma.userRoleLink.upsert({
    where: {
      tenantId_userId_roleId: {
        tenantId: tenant.id,
        userId: supportUser.id,
        roleId: supportRole.id,
      },
    },
    create: {
      tenantId: tenant.id,
      userId: supportUser.id,
      roleId: supportRole.id,
    },
    update: {},
  });

  // --- 6) link ALL permissions to owner role (future-proof)
  const allPerms = await prisma.permission.findMany({
    where: {
      deletedAt: null,
      OR: [{ tenantId: null }, { tenantId: tenant.id }],
    },
    select: { id: true, key: true, tenantId: true },
  });

  await prisma.rolePermissionLink.createMany({
    data: allPerms.map((p) => ({
      tenantId: tenant.id,
      roleId: ownerRole.id,
      permissionId: p.id,
    })),
    skipDuplicates: true,
  });

  // --- 7) store customer + identity
  const storeCustomer = await prisma.customer.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: fx.storeUser.email,
      },
    },
    create: {
      tenantId: tenant.id,
      email: fx.storeUser.email,
      firstName: "Buyer",
      lastName: "One",
    },
    update: {},
  });

  await prisma.authIdentity.upsert({
    where: {
      tenantId_provider_providerId: {
        tenantId: tenant.id,
        provider: AuthProviderType.EMAIL_PASSWORD,
        providerId: fx.storeUser.email,
      },
    },
    create: {
      tenantId: tenant.id,
      provider: AuthProviderType.EMAIL_PASSWORD,
      providerId: fx.storeUser.email,
      customerId: storeCustomer.id,
      passwordHash: storeHash,
      passwordAlgo: "bcrypt",
      passwordUpdatedAt: new Date(),
    },
    update: {
      passwordHash: storeHash,
      passwordUpdatedAt: new Date(),
    },
  });

  // --- 8) catalog: category + tag (minimal)
  const category = await prisma.catalogCategory.upsert({
    where: {
      tenantId_handle: {
        tenantId: tenant.id,
        handle: "e2e-root",
      },
    },
    create: {
      tenantId: tenant.id,
      handle: "e2e-root",
      isActive: true,
      metadata: {},
    },
    update: { isActive: true },
  });

  const tag = await prisma.catalogTag.upsert({
    where: {
      tenantId_value: {
        tenantId: tenant.id,
        value: "e2e",
      },
    },
    create: {
      tenantId: tenant.id,
      value: "e2e",
      metadata: {},
    },
    update: {},
  });

  // --- 9) catalog: product + variant (published)
  const productHandle = "e2e-product-1";
  const product = await prisma.catalogProduct.upsert({
    where: {
      tenantId_handle: {
        tenantId: tenant.id,
        handle: productHandle,
      },
    },
    create: {
      tenantId: tenant.id,
      handle: productHandle,
      status: ProductStatus.PUBLISHED,
      isActive: true,
      metadata: { e2e: true },
    },
    update: {
      status: ProductStatus.PUBLISHED,
      isActive: true,
    },
  });

  // product-category link (varsa ara tablo): güvenli yaklaşım => try/catch
  // Şemanda CatalogProductCategoryLink varsa otomatik bağlayabiliriz.
  const hasProductCategoryLink =
    typeof (prisma as any).catalogProductCategoryLink !== "undefined";
  if (hasProductCategoryLink) {
    await (prisma as any).catalogProductCategoryLink.upsert({
      where: {
        tenantId_productId_categoryId: {
          tenantId: tenant.id,
          productId: product.id,
          categoryId: category.id,
        },
      },
      create: {
        tenantId: tenant.id,
        productId: product.id,
        categoryId: category.id,
      },
      update: {},
    });
  }

  const variant = await prisma.catalogProductVariant.upsert({
    where: {
      tenantId_sku: {
        tenantId: tenant.id,
        sku: "E2E-SKU-1",
      },
    },
    create: {
      tenantId: tenant.id,
      productId: product.id,
      title: "E2E Variant",
      sku: "E2E-SKU-1",
      isActive: true,
      metadata: { e2e: true },
    },
    update: {
      productId: product.id,
      isActive: true,
    },
  });

  // product-tag link (varsa ara tablo)
  const hasProductTagLink =
    typeof (prisma as any).catalogProductTagLink !== "undefined";
  if (hasProductTagLink) {
    await (prisma as any).catalogProductTagLink.upsert({
      where: {
        tenantId_productId_tagId: {
          tenantId: tenant.id,
          productId: product.id,
          tagId: tag.id,
        },
      },
      create: {
        tenantId: tenant.id,
        productId: product.id,
        tagId: tag.id,
      },
      update: {},
    });
  }

  // --- 10) pricing: priceSet + moneyAmount (variant için base fiyat)
  const priceSet = await prisma.catalogPriceSet.upsert({
    where: {
      tenantId_variantId_priceListId: {
        tenantId: tenant.id,
        variantId: variant.id,
        priceListId: null,
      },
    },
    create: {
      tenantId: tenant.id,
      variantId: variant.id,
      priceListId: null,
      metadata: { e2e: true },
    },
    update: {},
  });

  // moneyAmount uniq: tenantId+currency+minQty+maxQty+priceListId? + priceSetId? (şemaya göre)
  // pratik: önce var mı bak, yoksa create
  const existingMoney = await prisma.catalogMoneyAmount.findFirst({
    where: {
      tenantId: tenant.id,
      priceSetId: priceSet.id,
      currencyCode: "EUR",
      minQuantity: null,
      maxQuantity: null,
      priceListId: null,
      deletedAt: null,
    },
  });

  if (!existingMoney) {
    await prisma.catalogMoneyAmount.create({
      data: {
        tenantId: tenant.id,
        priceSetId: priceSet.id,
        currencyCode: "EUR",
        amount: 1000, // 10.00 EUR gibi düşün (minor units)
        minQuantity: null,
        maxQuantity: null,
        priceListId: null,
        metadata: { e2e: true },
      },
    });
  }

  // --- 11) inventory: location + level (stock > 0)
  const location = await prisma.inventoryLocation.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: "E2E-LOC-1",
      },
    },
    create: {
      tenantId: tenant.id,
      name: "E2E Location",
      code: "E2E-LOC-1",
      isActive: true,
      metadata: { e2e: true },
    },
    update: {
      isActive: true,
    },
  });

  await prisma.inventoryLevel.upsert({
    where: {
      tenantId_locationId_variantId: {
        tenantId: tenant.id,
        locationId: location.id,
        variantId: variant.id,
      },
    },
    create: {
      tenantId: tenant.id,
      locationId: location.id,
      variantId: variant.id,
      stockedQuantity: 999,
      reservedQuantity: 0,
      metadata: { e2e: true },
    },
    update: {
      stockedQuantity: 999,
      // reservedQuantity test sırasında değişebilir; seed’de zorlamayalım
    },
  });

  // --- 12) shipping carrier (required by carrier/shipment flows)
  await prisma.shippingCarrier.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: "E2E-CARRIER-1",
      },
    },
    create: {
      tenantId: tenant.id,
      name: "E2E Carrier",
      code: "E2E-CARRIER-1",
      provider: "MANUAL",
      metadata: { e2e: true },
    },
    update: {
      name: "E2E Carrier",
      provider: "MANUAL",
    },
  });

  // --- outputs (env kolaylığı)
  console.log("✅ Tenant:", { id: tenant.id, code: tenant.code });
  console.log("✅ Users:", {
    owner: fx.owner.email,
    support: fx.support.email,
    store: fx.storeUser.email,
  });
  console.log("✅ Seed objects:", {
    categoryId: category.id,
    tagId: tag.id,
    productId: product.id,
    variantId: variant.id,
    locationId: location.id,
    carrierCode: "E2E-CARRIER-1",
  });

  console.log("");
  console.log("🧩 Copy-paste friendly env hints:");
  console.log(`E2E_TENANT_ID="${tenant.id}"`);
  console.log(`E2E_TENANT_CODE="${tenant.code}"`);
  console.log(`E2E_LOCATION_ID="${location.id}"`);
  console.log(`E2E_VARIANT_ID="${variant.id}"`);
  console.log("");
  console.log("✨ E2E seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ E2E seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
