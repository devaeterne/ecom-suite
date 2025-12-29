import { Injectable } from "@nestjs/common";
import nodemailer from "nodemailer";
import { env } from "@/config/env";
import { MailService, MailMessage } from "@/infrastructure/mail/mail.service";

@Injectable()
export class SmtpMailService extends MailService {
  private transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
      : undefined,
  });

  async send(msg: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: env.MAIL_FROM,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    });
  }
}
