import { RoleScope, AuthProviderType } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "@/prisma/prisma.service";
import { fx } from "@test/helpers/fixtures";

const prisma = new PrismaService();

// Gate e2e testlerinin beklediği permission key’ler
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
] as const;

async function main() {
  console.log("🌱 Seeding E2E test data...");

  await prisma.$connect();

  // 0) Hashes
  const ownerHash = await bcrypt.hash(fx.owner.password, 10);
  const supportHash = await bcrypt.hash(fx.support.password, 10);
  const storeHash = await bcrypt.hash(fx.storeUser.password, 10);

  // 1) Tenant
  const tenant = await prisma.tenant.upsert({
    where: { code: fx.tenantKey },
    create: {
      code: fx.tenantKey,
      name: "Acme Corp",
      isActive: true,
    },
    update: {},
  });

  // 2) Roles
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
      description: "Owner with full access",
      isActive: true,
    },
    update: {},
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
      description: "Support staff",
      isActive: true,
    },
    update: {},
  });

  // 3) Ensure required permissions exist (global tenantId=null)
  await prisma.permission.createMany({
    data: REQUIRED_PERMISSION_KEYS.map((key) => ({
      key,
      description: key,
      tenantId: null,
    })),
    skipDuplicates: true,
  });

  // 4) Load permissions (global + tenant-specific if any)
  const perms = await prisma.permission.findMany({
    where: {
      deletedAt: null,
      OR: [{ tenantId: null }, { tenantId: tenant.id }],
    },
    select: { id: true, key: true, tenantId: true },
  });

  // 5) Link all perms to owner role
  // Not: RolePermissionLink’te uniq_role_permission (tenantId, roleId, permissionId) var.
  await prisma.rolePermissionLink.createMany({
    data: perms.map((p) => ({
      tenantId: tenant.id,
      roleId: ownerRole.id,
      permissionId: p.id,
    })),
    skipDuplicates: true,
  });

  // 6) Owner user + identity + role link
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
      name: "Admin owner",
      isActive: true,
    },
    update: {},
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

  // 7) Support user + identity + role link
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
      name: "Support Staff",
      isActive: true,
    },
    update: {},
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

  // 8) Store customer + identity
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

  console.log("✅ Tenant:", tenant.code);
  console.log("✅ Roles:", {
    ownerRole: ownerRole.id,
    supportRole: supportRole.id,
  });
  console.log("✅ owner:", fx.owner.email);
  console.log("✅ Support:", fx.support.email);
  console.log("✅ Store:", fx.storeUser.email);
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
