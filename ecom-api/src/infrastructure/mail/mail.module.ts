import { Module } from "@nestjs/common";
import { Mailer } from "./mailer";
import { SmtpMailService } from "./smtp.mailer";

@Module({
  providers: [{ provide: Mailer, useClass: SmtpMailService }],
  exports: [Mailer],
})
export class MailModule {}
