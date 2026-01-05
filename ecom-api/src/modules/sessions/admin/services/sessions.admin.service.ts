// src/modules/sessions/admin/services/sessions.admin.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import {
  SessionsRepository,
  type SessionTyp,
} from "@/modules/sessions/common/prisma/sessions.repo";

@Injectable()
export class SessionsAdminService {
  private readonly typ: SessionTyp = "admin";

  constructor(private readonly repo: SessionsRepository) {}

  async listActive(input: { tenantId?: string; identityId?: string }) {
    const { tenantId, identityId } = input;
    if (!tenantId || !identityId) return { sessions: [] };

    const sessions = await this.repo.listActiveByIdentity({
      tenantId,
      identityId,
      typ: this.typ,
      take: 50, // panel için yeterli; istersen query ile parametreleştiririz
      orderBy: "desc",
    });

    return { sessions };
  }

  async revokeOne(input: {
    tenantId?: string;
    identityId?: string;
    sessionId: string;
  }) {
    const { tenantId, identityId, sessionId } = input;
    if (!tenantId || !identityId) return { ok: false };

    const s = await this.repo.findByIdForTenant({ tenantId, sessionId });
    if (!s) throw new NotFoundException("Session not found");
    if (s.identityId !== identityId)
      throw new ForbiddenException("Not your session");
    if (s.revokedAt) return { ok: true }; // idempotent

    await this.repo.revoke(sessionId);
    return { ok: true };
  }

  async revokeAll(input: { tenantId?: string; identityId?: string }) {
    const { tenantId, identityId } = input;
    if (!tenantId || !identityId) return { ok: false };

    await this.repo.revokeAllByIdentity({
      tenantId,
      identityId,
      typ: this.typ,
    });
    return { ok: true };
  }
}
