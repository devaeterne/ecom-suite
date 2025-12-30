// src/prisma/seed.ts
import { PrismaClient, AuthProviderType, RoleScope } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function upsertRole(params: {
  tenantId: string;
  name: string;
  scope: RoleScope;
}) {
  const existing = await prisma.role.findFirst({
    where: { tenantId: params.tenantId, name: params.name, deletedAt: null },
  });

  if (existing) return existing;

  return prisma.role.create({
    data: {
      tenantId: params.tenantId,
      name: params.name,
      scope: params.scope,
    },
  });
}

async function upsertUserWithPassword(params: {
  tenantId: string;
  email: string;
  passwordHash: string;
  isActive?: boolean;
}) {
  // User unique: @@unique([tenantId, email])
  const user = await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: params.tenantId, email: params.email },
    },
    update: {
      isActive: params.isActive ?? true,
    },
    create: {
      tenantId: params.tenantId,
      email: params.email,
      isActive: params.isActive ?? true,
    },
  });

  // AuthIdentity unique: @@unique([tenantId, providerType, providerId])
  // EMAIL/PASSWORD için providerId'yi email'e sabitlemek pratik ve deterministik.
  await prisma.authIdentity.upsert({
    where: {
      tenantId_provider_providerId: {
        tenantId: params.tenantId,
        provider: AuthProviderType.EMAIL_PASSWORD,
        providerId: params.email,
      },
    },
    update: {
      userId: user.id,
      passwordHash: params.passwordHash,
    },
    create: {
      tenantId: params.tenantId,
      userId: user.id,
      provider: AuthProviderType.EMAIL_PASSWORD,
      providerId: params.email,
      passwordHash: params.passwordHash,
    },
  });

  return user;
}

async function ensureUserRoleLink(params: {
  tenantId: string;
  userId: string;
  roleId: string;
}) {
  // uniq_user_role: @@unique([tenantId, userId, roleId])
  await prisma.userRoleLink.upsert({
    where: {
      tenantId_userId_roleId: {
        tenantId: params.tenantId,
        userId: params.userId,
        roleId: params.roleId,
      },
    },
    update: {},
    create: {
      tenantId: params.tenantId,
      userId: params.userId,
      roleId: params.roleId,
    },
  });
}

async function main() {
  const tenantCode = "gate";
  const ownerEmail = "admin@acme.com";
  const supportEmail = "support@acme.com";
  const password = "ChangeMe123!";

  const passwordHash = await bcrypt.hash(password, 10);

  // Tenant unique: code
  const tenant = await prisma.tenant.upsert({
    where: { code: tenantCode },
    update: {},
    create: {
      code: tenantCode,
      name: "Gate",
    },
  });

  // Roles unique: (tenantId, name)
  const ownerRole = await upsertRole({
    tenantId: tenant.id,
    name: "Owner",
    scope: RoleScope.STAFF,
  });
  const supportRole = await upsertRole({
    tenantId: tenant.id,
    name: "Support",
    scope: RoleScope.STAFF,
  });

  // Users + Password AuthIdentity
  const ownerUser = await upsertUserWithPassword({
    tenantId: tenant.id,
    email: ownerEmail,
    passwordHash,
    isActive: true,
  });

  const supportUser = await upsertUserWithPassword({
    tenantId: tenant.id,
    email: supportEmail,
    passwordHash,
    isActive: true,
  });

  // Role links
  await ensureUserRoleLink({
    tenantId: tenant.id,
    userId: ownerUser.id,
    roleId: ownerRole.id,
  });
  await ensureUserRoleLink({
    tenantId: tenant.id,
    userId: supportUser.id,
    roleId: supportRole.id,
  });

  console.log("✅ Seed completed:", {
    tenant: tenant.code,
    ownerEmail,
    supportEmail,
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
