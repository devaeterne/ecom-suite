// prisma/seed/seed.ts
import "dotenv/config";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// ✅ IMPORTANT: generated client + enums buradan alınır
import {
  PrismaClient,
  MemberRole,
  UserStatus,
  AuditAction,
} from "@prisma/client";

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

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);

  // Prisma 7: adapter zorunlu
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

    // 2) User create/update
    const existingUser = await prisma.user.findUnique({ where: { email } });

    const user = existingUser
      ? await prisma.user.update({
          where: { email },
          data: { status: UserStatus.ACTIVE },
        })
      : await prisma.user.create({
          data: { email, passwordHash, status: UserStatus.ACTIVE },
        });

    // password policy
    if (forceReset || !user.passwordHash) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    }

    // 3) Membership upsert
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

    // 4) Audit only on first create
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
