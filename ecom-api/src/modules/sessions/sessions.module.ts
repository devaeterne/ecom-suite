// src/modules/sessions/sessions.module.ts
import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";

import { SessionsRepository } from "./common/prisma/sessions.repo";
import { SessionsAdminService } from "./admin/services/sessions.admin.service";
import { SessionsAdminController } from "./admin/controllers/sessions.admin.controller";

@Module({
  imports: [PrismaModule],
  providers: [SessionsRepository, SessionsAdminService],
  controllers: [SessionsAdminController],
  exports: [SessionsRepository],
})
export class SessionsModule {}
