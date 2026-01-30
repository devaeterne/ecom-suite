import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RoleScope } from "@prisma/client";

@Injectable()
export class AdminMeService {
  constructor(private readonly prisma: PrismaService) {}

  async me(req: any) {
    const userId = req?.user?.id ?? req?.user?.userId ?? null;
    const tenantId = req?.user?.tenantId ?? req?.tenant?.id ?? null;

    const email = req?.user?.email ?? null;

    // 1) token claim varsa onu kullan
    const claimRole = req?.user?.role;
    if (claimRole === "super_admin" || claimRole === "admin") {
      return { user: { id: userId, email, role: claimRole, tenantId } };
    }

    // 2) fallback: DB ile hesapla (SUPER_ADMIN scope role var mı?)
    let role: "super_admin" | "admin" = "admin";

    if (userId && tenantId) {
      const sa = await this.prisma.userRoleLink.findFirst({
        where: {
          tenantId,
          userId,
          deletedAt: null,
          role: {
            tenantId,
            deletedAt: null,
            isActive: true,
            scope: RoleScope.SUPER_ADMIN,
          },
        },
        select: { id: true },
      });

      if (sa) role = "super_admin";
    }

    return { user: { id: userId, email, role, tenantId } };
  }
}
