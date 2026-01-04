import { Injectable } from "@nestjs/common";
import {
  SessionsRepository,
  SessionTyp,
} from "@/modules/sessions/common/prisma/sessions.repo";

@Injectable()
export class SessionsService {
  constructor(private readonly repo: SessionsRepository) {}

  async logoutAll(identityId: string, tenantId: string, typ: SessionTyp) {
    await this.repo.revokeAllByIdentity({ tenantId, identityId, typ });
    return { ok: true };
  }

  /**
   * Basit session limiti: aktif session sayısı max’i aşarsa en eskileri revoke.
   */
  async enforceSessionLimit(params: {
    tenantId: string;
    identityId: string;
    typ: SessionTyp;
    max: number;
  }) {
    const { tenantId, identityId, typ, max } = params;

    const active = await this.repo.listActiveByIdentity({
      tenantId,
      identityId,
      typ,
      take: max + 50,
      orderBy: "asc", // en eskiler başta
    });

    if (active.length <= max) return;

    const overflowIds = active.slice(0, active.length - max).map((s) => s.id);
    await this.repo.revokeMany(overflowIds);
  }
}
