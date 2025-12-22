import { Controller, Get, Inject } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("db")
export class DbController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    // mini debug (istersen sonra kaldır)
    console.log("[DbController] prisma injected?", Boolean(this.prisma));
  }

  @Get("ping")
  async ping() {
    const rows = await this.prisma.$queryRaw<
      Array<{ ok: number }>
    >`SELECT 1 as ok`;
    return { ok: true, db: rows?.[0]?.ok === 1 };
  }

  @Get("admin-users/count")
  async adminUsersCount() {
    const count = await this.prisma.adminUser.count();
    return { ok: true, count };
  }
}
