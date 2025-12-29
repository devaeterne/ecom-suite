export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export abstract class MailService {
  abstract send(msg: MailMessage): Promise<void>;
}
