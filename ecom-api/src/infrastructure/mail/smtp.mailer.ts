import { Injectable, Logger } from "@nestjs/common";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import { env } from "@/config/env";
import { PrismaService } from "@/prisma/prisma.service";
import { ActiveTenantService } from "@/infrastructure/tenant-bootstrap/active-tenant.service";
import { MailService } from "@/infrastructure/mail/mail.service";
import { MailMessage } from "@/infrastructure/mail/mailer";

function bool(v: any, fallback = false) {
  if (v === undefined || v === null) return fallback;
  const s = String(v).toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

function asFrom(name: string | undefined, email: string) {
  const n = (name ?? "").trim();
  return n ? `${n} <${email}>` : email;
}

// metadata.mail.supportEmail okuyalım (schema değiştirmeden)
function getSupportEmailFromMetadata(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const m = metadata as any;
  const v = m?.mail?.supportEmail;
  return typeof v === "string" && v.includes("@") ? v : undefined;
}

@Injectable()
export class SmtpMailService extends MailService {
  private readonly logger = new Logger(SmtpMailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activeTenant: ActiveTenantService
  ) {
    super();
  }

  async send(msg: MailMessage): Promise<void> {
    const sendEnabled = bool(
      (env as any).INVITE_SEND_MAIL ?? process.env.INVITE_SEND_MAIL,
      false
    );

    const tenantId = this.safeTenantId();
    const tenant = tenantId
      ? await this.prisma.tenant.findFirst({
          where: { id: tenantId },
          select: { name: true, metadata: true },
        })
      : null;

    const tenantSupportEmail = tenant
      ? getSupportEmailFromMetadata(tenant.metadata)
      : undefined;

    const fromEmail =
      tenantSupportEmail ??
      (env as any).SUPPORT_EMAIL ??
      process.env.SUPPORT_EMAIL ??
      (env as any).MAIL_FROM ??
      process.env.MAIL_FROM ??
      (env as any).SMTP_FROM ??
      process.env.SMTP_FROM;

    const fromName =
      tenant?.name ??
      (env as any).MAIL_FROM_NAME ??
      process.env.MAIL_FROM_NAME ??
      "Ecom";

    if (!fromEmail) {
      this.logger.warn(
        "MAIL_FROM/SMTP_FROM/SUPPORT_EMAIL is not set; sending may fail in production."
      );
    }

    const finalMsg: MailMessage = {
      ...msg,
      from: msg.from ?? (fromEmail ? asFrom(fromName, fromEmail) : msg.from),
      replyTo: msg.replyTo ?? tenantSupportEmail ?? msg.replyTo,
    };

    if (!sendEnabled) {
      this.logger.log(`[DRY-RUN] Mail not sent (INVITE_SEND_MAIL=false).`);
      this.logger.log(
        JSON.stringify(
          {
            to: finalMsg.to,
            subject: finalMsg.subject,
            from: finalMsg.from,
            replyTo: finalMsg.replyTo,
            textPreview: (finalMsg.text ?? "").slice(0, 160),
          },
          null,
          2
        )
      );
      return;
    }

    const transport = this.createTransport();
    await transport.sendMail({
      to: finalMsg.to,
      from: finalMsg.from,
      replyTo: finalMsg.replyTo,
      subject: finalMsg.subject,
      html: finalMsg.html,
      text: finalMsg.text,
    });

    this.logger.log(`Mail sent -> ${finalMsg.to} | ${finalMsg.subject}`);
  }

  private createTransport() {
    const host = (env as any).SMTP_HOST ?? process.env.SMTP_HOST;
    const portRaw = (env as any).SMTP_PORT ?? process.env.SMTP_PORT ?? "587";
    const user = (env as any).SMTP_USER ?? process.env.SMTP_USER;
    const pass = (env as any).SMTP_PASS ?? process.env.SMTP_PASS;
    const secure = bool(
      (env as any).SMTP_SECURE ?? process.env.SMTP_SECURE,
      false
    );

    if (!host) throw new Error("SMTP_HOST is missing");

    const port = Number(portRaw);
    if (Number.isNaN(port)) throw new Error(`Invalid SMTP_PORT: ${portRaw}`);

    const options: SMTPTransport.Options = {
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    };

    return nodemailer.createTransport(options);
  }

  private safeTenantId(): string | null {
    try {
      return this.activeTenant.getTenantId();
    } catch {
      return null;
    }
  }
}
