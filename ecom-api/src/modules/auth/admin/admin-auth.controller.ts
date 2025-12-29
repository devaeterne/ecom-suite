import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";

import { AdminAuthService } from "@/modules/auth/admin/admin-auth.service";
import { AdminLoginDto } from "@/modules/auth/admin/dto/admin-login.dto";
import { AdminAuthResponseDto } from "@/modules/auth/admin/dto/admin-auth-response.dto";
import {
  COOKIE_NAMES,
  adminRefreshCookieOptions,
  clearAdminRefreshCookieOptions,
} from "@/infrastructure/http/cookies";
import { AdminAccessGuard } from "@/modules/auth/admin/guards/admin-access.guard";

import { AuthRateLimitService } from "@/modules/auth/rate-limit/auth-rate-limit-service";
import { AuthAuditLogService } from "@/modules/auth/audit/auth-audit-log-service";
import { AUDIT } from "@/modules/auth/audit/audit.actions";

import { ActiveTenantService } from "@/infrastructure/tenant-bootstrap/active-tenant.service";

function getReqMeta(req: FastifyRequest) {
  const xf = (req.headers["x-forwarded-for"] as string | undefined) ?? "";
  const ip = (xf.split(",")[0]?.trim() || (req as any).ip || undefined) as
    | string
    | undefined;

  const userAgent =
    (req.headers["user-agent"] as string | undefined) ?? undefined;

  return { ip, userAgent };
}

@ApiTags("Admin Auth")
@Controller("admin/auth")
export class AdminAuthController {
  constructor(
    private readonly service: AdminAuthService,
    private readonly rl: AuthRateLimitService,
    private readonly audit: AuthAuditLogService,
    private readonly activeTenant: ActiveTenantService
  ) {}

  @Post("login")
  @ApiBody({ type: AdminLoginDto })
  @ApiOkResponse({ type: AdminAuthResponseDto })
  async login(
    @Body() dto: AdminLoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<AdminAuthResponseDto> {
    const meta = getReqMeta(req);
    const tenantId = await this.activeTenant.getTenantId();

    try {
      // 10 / 5dk (IP + email)
      await this.rl.assertAllowed(
        {
          typ: "admin",
          action: "login",
          tenantId,
          ip: meta.ip ?? null,
          identityKey: dto.email?.toLowerCase() ?? null,
        },
        10,
        5 * 60
      );
    } catch (e) {
      if (
        e instanceof HttpException &&
        e.getStatus() === HttpStatus.TOO_MANY_REQUESTS
      ) {
        const payload = e.getResponse() as any;

        await this.audit.log(tenantId, {
          action: AUDIT.ADMIN_LOGIN_RATE_LIMITED,
          success: false,
          reason: "RATE_LIMITED",
          ip: meta.ip ?? null,
          userAgent: meta.userAgent ?? null,
          meta: {
            typ: "admin",
            email: dto.email?.toLowerCase() ?? null,
            retryAfterSeconds: payload?.retryAfterSeconds ?? null,
          },
        });
      }
      throw e;
    }

    const { accessToken, refreshRaw } = await this.service.login(
      dto.email,
      dto.password,
      meta
    );

    reply.setCookie(
      COOKIE_NAMES.adminRefresh,
      refreshRaw,
      adminRefreshCookieOptions()
    );

    return { accessToken };
  }

  @Post("refresh")
  @ApiOkResponse({ type: AdminAuthResponseDto })
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<AdminAuthResponseDto> {
    const meta = getReqMeta(req);

    const refreshRaw = (req.cookies as any)?.[COOKIE_NAMES.adminRefresh];
    if (!refreshRaw) throw new UnauthorizedException("Missing refresh cookie");

    const { accessToken, refreshRaw: newRefresh } = await this.service.refresh(
      refreshRaw,
      meta
    );

    reply.setCookie(
      COOKIE_NAMES.adminRefresh,
      newRefresh,
      adminRefreshCookieOptions()
    );

    return { accessToken };
  }

  @Post("logout")
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const meta = getReqMeta(req);

    const refreshRaw = (req.cookies as any)?.[COOKIE_NAMES.adminRefresh];
    if (refreshRaw) await this.service.logout(refreshRaw, meta);

    reply.clearCookie(
      COOKIE_NAMES.adminRefresh,
      clearAdminRefreshCookieOptions()
    );

    return { ok: true };
  }

  @Post("logout-all")
  @UseGuards(AdminAccessGuard)
  @ApiBearerAuth()
  async logoutAll(
    @Req() req: FastifyRequest & { user: any },
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const { sub, tenantId } = (req as any).user;
    const meta = getReqMeta(req);

    await this.service.logoutAll(sub, tenantId);

    // refresh cookie scope: Path=/api/admin/auth/refresh
    reply.clearCookie(
      COOKIE_NAMES.adminRefresh,
      clearAdminRefreshCookieOptions()
    );

    return { ok: true };
  }

  @Get("me")
  @UseGuards(AdminAccessGuard)
  @ApiBearerAuth()
  async me(@Req() req: any) {
    const { sub, tenantId } = req.user;
    return this.service.me(sub, tenantId);
  }
}
