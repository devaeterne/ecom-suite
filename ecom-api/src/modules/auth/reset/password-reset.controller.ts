import {
  Body,
  Controller,
  Post,
  Req,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";

import { PasswordResetService } from "@/modules/auth/reset/password-reset.service";
import { ResetRequestDto } from "@/modules/auth/reset/dto/reset-request.dto";
import { ResetConfirmDto } from "@/modules/auth/reset/dto/reset-confirm.dto";

import { AuthRateLimitService } from "@modules/auth/rate-limit/auth-rate-limit-service";
import { ActiveTenantService } from "@/infrastructure/tenant-bootstrap/active-tenant.service";

import { AuthAuditLogService } from "@/modules/auth/audit/auth-audit-log-service";
import { AUDIT } from "@/modules/auth/audit/audit.actions";

function getReqMeta(req: FastifyRequest) {
  const xf = (req.headers["x-forwarded-for"] as string | undefined) ?? "";
  const ip = (xf.split(",")[0]?.trim() || (req as any).ip || null) as
    | string
    | null;
  const userAgent = (req.headers["user-agent"] as string | undefined) ?? null;
  return { ip, userAgent };
}

@ApiTags("Password Reset")
@Controller("auth/reset-password")
export class PasswordResetController {
  constructor(
    private readonly service: PasswordResetService,
    private readonly rl: AuthRateLimitService,
    private readonly activeTenant: ActiveTenantService,
    private readonly audit: AuthAuditLogService
  ) {}

  @Post("request")
  async request(@Body() dto: ResetRequestDto, @Req() req: FastifyRequest) {
    const meta = getReqMeta(req);
    const tenantId = await this.activeTenant.getTenantId();

    try {
      // 5 request / 15 dk (IP + email)
      await this.rl.assertAllowed(
        {
          typ: "store",
          action: "reset_request",
          tenantId,
          ip: meta.ip,
          identityKey: dto.email?.toLowerCase() ?? null,
        },
        5,
        15 * 60
      );
    } catch (e) {
      if (
        e instanceof HttpException &&
        e.getStatus() === HttpStatus.TOO_MANY_REQUESTS
      ) {
        const payload = e.getResponse() as any;

        await this.audit.log(tenantId, {
          action: AUDIT.PASSWORD_RESET_REQUEST_RATE_LIMITED,
          success: false,
          reason: "RATE_LIMITED",
          ip: meta.ip ?? null,
          userAgent: meta.userAgent ?? null,
          meta: {
            typ: "store",
            email: dto.email?.toLowerCase() ?? null,
            retryAfterSeconds: payload?.retryAfterSeconds ?? null,
          },
        });
      }
      throw e;
    }

    await this.service.requestReset(dto);
    return { ok: true };
  }

  @Post("confirm")
  async confirm(@Body() dto: ResetConfirmDto, @Req() req: FastifyRequest) {
    const meta = getReqMeta(req);
    const tenantId = await this.activeTenant.getTenantId();

    // confirm dto’da token alanının adı projene göre değişebilir
    const token = (dto as any).token ?? (dto as any).code ?? null;

    try {
      // 10 confirm / 15 dk (IP + token/code)
      await this.rl.assertAllowed(
        {
          typ: "store",
          action: "reset_confirm",
          tenantId,
          ip: meta.ip,
          identityKey: token,
        },
        10,
        15 * 60
      );
    } catch (e) {
      if (
        e instanceof HttpException &&
        e.getStatus() === HttpStatus.TOO_MANY_REQUESTS
      ) {
        const payload = e.getResponse() as any;

        await this.audit.log(tenantId, {
          action: AUDIT.PASSWORD_RESET_CONFIRM_RATE_LIMITED,
          success: false,
          reason: "RATE_LIMITED",
          ip: meta.ip ?? null,
          userAgent: meta.userAgent ?? null,
          meta: {
            typ: "store",
            tokenPresent: Boolean(token),
            retryAfterSeconds: payload?.retryAfterSeconds ?? null,
          },
        });
      }
      throw e;
    }

    await this.service.confirmReset(dto);
    return { ok: true };
  }
}
