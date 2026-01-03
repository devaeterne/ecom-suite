import { PrismaClient, AuthProviderType, RoleScope } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL missing");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

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
  await prisma.country.createMany({
    data: [
      { iso2: "TR", iso3: "TUR", name: "Türkiye" },
      { iso2: "US", iso3: "USA", name: "United States" },
      { iso2: "GB", iso3: "GBR", name: "United Kingdom" },
      { iso2: "ME", iso3: "MNE", name: "Montenegro" },
      { iso2: "DE", iso3: "DEU", name: "Germany" },
      { iso2: "FR", iso3: "FRA", name: "France" },
    ],
    skipDuplicates: true,
  });

  const tenantCode = "gate";
  const ownerEmail = "admin@acme.com";
  const supportEmail = "support@acme.com";
  const password = "ChangeMe123!";

  const passwordHash = await bcrypt.hash(password, 10);

  const tenant = await prisma.tenant.upsert({
    where: { code: tenantCode },
    update: {},
    create: {
      code: tenantCode,
      name: "Gate",
    },
  });

  await prisma.currency.createMany({
    data: [
      { tenantId: tenant.id, code: "EUR", symbol: "€" },
      { tenantId: tenant.id, code: "TRY", symbol: "₺" },
      { tenantId: tenant.id, code: "USD", symbol: "$" },
      { tenantId: tenant.id, code: "GBP", symbol: "£" },
    ],
    skipDuplicates: true,
  });

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
    countries: ["TR", "US", "GB", "ME", "DE", "FR"],
    currencies: ["EUR", "TRY", "USD", "GBP"],
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
