import { MailMessage } from "@/infrastructure/mail/mailer";

export abstract class MailService {
  abstract send(msg: MailMessage): Promise<void>;
}
