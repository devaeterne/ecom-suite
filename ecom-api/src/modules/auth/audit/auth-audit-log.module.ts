import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { AuthAuditLogService } from "@/modules/auth/audit/auth-audit-log-service";
@Module({
  imports: [PrismaModule],
  providers: [AuthAuditLogService],
  exports: [AuthAuditLogService],
})
export class AuthAuditLogModule {}
