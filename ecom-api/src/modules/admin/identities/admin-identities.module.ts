import { Module } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { IdentitiesAdminController } from "@/modules/admin/identities/admin/controllers/identities.admin.controller";
import { IdentitiesService } from "@/modules/admin/identities/admin/services/identities.service";
import { AdminAuthModule } from "@/modules/auth/admin/admin-auth.module";
import { PasswordResetModule } from "@/modules/auth/reset/password-reset.module";
import { MailModule } from "@/infrastructure/mail/mail.module";
import { PrismaModule } from "@/prisma/prisma.module";

@Module({
  imports: [PrismaModule, AdminAuthModule, PasswordResetModule, MailModule],
  controllers: [IdentitiesAdminController],
  providers: [PrismaService, IdentitiesService],
})
export class AdminIdentitiesModule {}
