import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

export type AuditLogInput = {
  action: string;

  actorIdentityId?: string | null;

  // request context
  ip?: string | null;
  userAgent?: string | null;

  // outcome
  success?: boolean;
  reason?: string | null;

  // target info (detaylı istedin)
  targetType?: string | null;
  targetId?: string | null;
  targetEmail?: string | null;

  // ek metadata
  meta?: Record<string, any>;
};

@Injectable()
export class AuthAuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(tenantId: string, input: AuditLogInput) {
    const meta = {
      success: input.success ?? true,
      reason: input.reason ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      targetEmail: input.targetEmail ?? null,
      ...(input.meta ?? {}),
    };

    try {
      await this.prisma.authAuditLog.create({
        data: {
          tenantId,
          action: input.action,
          actorIdentityId: input.actorIdentityId ?? null,
          meta,
        },
      });
    } catch {
      // Audit log auth akışını ASLA bozmasın
    }
  }
}
