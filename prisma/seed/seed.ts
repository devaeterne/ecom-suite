import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  PrismaClient,
  MemberRole,
  UserStatus,
  AuditAction,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is missing (seed)");

  // ✅ Prisma 7 + adapter
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  try {
    const orgName = process.env.SEED_ORG_NAME || "Default Store";
    const orgSlug = process.env.SEED_ORG_SLUG || slugify(orgName);

    const email = (process.env.SEED_ADMIN_EMAIL || "admin@local.dev")
      .trim()
      .toLowerCase();

    const password = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
    const passwordHash = await bcrypt.hash(password, 10);

    const forceReset =
      (process.env.SEED_FORCE_PASSWORD_RESET || "false") === "true";

    // 1) Organization upsert
    const organization = await prisma.organization.upsert({
      where: { slug: orgSlug },
      update: { name: orgName },
      create: { name: orgName, slug: orgSlug },
    });

    // 2) User create/update (prod-safe)
    const existingUser = await prisma.user.findUnique({ where: { email } });

    const user = existingUser
      ? await prisma.user.update({
          where: { email },
          data: { status: UserStatus.ACTIVE },
        })
      : await prisma.user.create({
          data: { email, passwordHash, status: UserStatus.ACTIVE },
        });

    // Password policy:
    // - forceReset=true => her seed koşuşunda şifreyi güncelle (DEV)
    // - forceReset=false => yalnızca passwordHash boşsa set et (OAuth vb.)
    if (forceReset) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    } else if (!user.passwordHash) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    }

    // 3) Membership upsert => OWNER
    await prisma.membership.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: user.id,
        },
      },
      update: { role: MemberRole.OWNER },
      create: {
        organizationId: organization.id,
        userId: user.id,
        role: MemberRole.OWNER,
      },
    });

    // 4) Audit: sadece ilk kullanıcı create'inde
    if (!existingUser) {
      await prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          action: AuditAction.AUTH_REGISTER,
          entityType: "organization",
          entityId: organization.id,
          metadata: { seeded: true, email, orgSlug },
        },
      });
    }

    console.log("✅ Seed completed:");
    console.log(`   Org:  ${organization.name} (${organization.slug})`);
    console.log(`   User: ${user.email} (OWNER)`);
    console.log(`   Force password reset: ${forceReset}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
