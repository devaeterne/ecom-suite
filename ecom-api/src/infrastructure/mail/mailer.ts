export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export abstract class Mailer {
  abstract send(input: SendMailInput): Promise<void>;
}
