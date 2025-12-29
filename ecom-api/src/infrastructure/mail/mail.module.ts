import { Module } from "@nestjs/common";
import { Mailer } from "@/infrastructure/mail/mailer";
import { SmtpMailService } from "@/infrastructure/mail/smtp.mailer";

@Module({
  providers: [{ provide: Mailer, useClass: SmtpMailService }],
  exports: [Mailer],
})
export class MailModule {}
