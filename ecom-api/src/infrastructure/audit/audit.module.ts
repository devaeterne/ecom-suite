import { Module } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AdminAuditService } from "@/infrastructure/audit/admin-audit.service";

@Module({
  providers: [PrismaService, AdminAuditService],
  exports: [AdminAuditService],
})
export class AuditModule {}
