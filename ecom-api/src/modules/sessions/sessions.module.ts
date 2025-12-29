import { Module } from "@nestjs/common";
import { SessionsRepository } from "@/modules/sessions/sessions.repository";
import { PrismaModule } from "@/prisma/prisma.module";
import { AuthAuditLogModule } from "@/modules/auth/audit/auth-audit-log.module";
import { SessionsService } from "@/modules/sessions/sessions.service";

@Module({
  imports: [PrismaModule, AuthAuditLogModule],
  providers: [SessionsRepository, SessionsService],
  exports: [SessionsRepository, SessionsService],
})
export class SessionsModule {}
