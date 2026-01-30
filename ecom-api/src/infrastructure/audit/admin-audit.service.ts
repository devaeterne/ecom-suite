import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AuditAction } from "@prisma/client";

type AnyObj = Record<string, any>;

function asStr(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

function getIp(req: any): string | undefined {
  // reverse proxy varsa x-forwarded-for ilk ip
  const xff = asStr(req?.headers?.["x-forwarded-for"]);
  if (xff) return xff.split(",")[0]?.trim() || undefined;
  return asStr(req?.ip) ?? asStr(req?.raw?.ip);
}

function getUa(req: any): string | undefined {
  return asStr(req?.headers?.["user-agent"]);
}

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    req: any,
    input: {
      action: AuditAction;
      tenantId: string; // request context tenant
      actorUserId?: string | null;
      entityType: string;
      entityId?: string | null;
      entityLabel?: string | null;
      metadata?: AnyObj;
      source?: string;
      requestId?: string | null;
      before?: AnyObj | null;
      after?: AnyObj | null;
    },
  ) {
    const payload = {
      tenantId: input.tenantId,
      actorUserId: input.actorUserId ?? null,
      actorType: "user",
      actorLabel: null,

      action: input.action,

      entityType: input.entityType,
      entityId: input.entityId ?? null,
      entityLabel: input.entityLabel ?? null,

      requestId: input.requestId ?? req?.requestId ?? null,
      ip: getIp(req) ?? null,
      userAgent: getUa(req) ?? null,
      source: input.source ?? "admin",

      before: (input.before ?? null) as any,
      after: (input.after ?? null) as any,
      metadata: (input.metadata ?? {}) as any,
    };

    await this.prisma.auditLog.create({ data: payload as any });
  }
}
