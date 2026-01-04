import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { TenantBootstrapModule } from "@/infrastructure/tenant-bootstrap/tenant-bootstrap.module";

import { MailService } from "@/infrastructure/mail/mail.service";
import { SmtpMailService } from "@/infrastructure/mail/smtp.mailer";

@Module({
  imports: [PrismaModule, TenantBootstrapModule],
  providers: [
    SmtpMailService,
    { provide: MailService, useExisting: SmtpMailService },
  ],
  exports: [MailService],
})
export class MailModule {}
