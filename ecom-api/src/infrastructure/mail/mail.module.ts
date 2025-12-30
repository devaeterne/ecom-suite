import { Module } from "@nestjs/common";
import { Mailer } from "@/infrastructure/mail/mailer";
import { SmtpMailService } from "@/infrastructure/mail/smtp.mailer";
import { MailService } from "@/infrastructure/mail/mail.service";

@Module({
  providers: [
    // Asıl injection token: MailService
    { provide: MailService, useClass: SmtpMailService },

    // Geriye dönük uyumluluk: Mailer isteyen yerler bozulmasın
    { provide: Mailer, useExisting: MailService },
  ],
  exports: [MailService, Mailer],
})
export class MailModule {}
