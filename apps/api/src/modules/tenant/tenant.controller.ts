import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("/v1/db")
export class TenantController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("ping")
  async ping() {
    const count = await this.prisma.adminUser.count();
    return { ok: true, adminUserCount: count };
  }
}
