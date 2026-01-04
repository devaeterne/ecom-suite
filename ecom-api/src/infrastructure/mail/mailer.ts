export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  from?: string; // "Name <mail@domain.com>" format
};
