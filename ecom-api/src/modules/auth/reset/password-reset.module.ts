import { Module } from "@nestjs/common";
import { PasswordResetController } from "@/modules/auth/reset/password-reset.controller";
import { PasswordResetService } from "@/modules/auth/reset/password-reset.service";
import { PrismaModule } from "@/prisma/prisma.module";
import { CryptoModule } from "@/modules/crypto/crypto.module";
import { SessionsModule } from "@/modules/sessions/sessions.module";
import { MailModule } from "@/infrastructure/mail/mail.module";
import { SecurityModule } from "@/infrastructure/security/security.module";

@Module({
  imports: [
    PrismaModule,
    SessionsModule,
    CryptoModule,
    MailModule,
    SecurityModule,
  ],
  controllers: [PasswordResetController],
  providers: [PasswordResetService],
})
export class PasswordResetModule {}
