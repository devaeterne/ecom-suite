// src/modules/auth/admin/admin/controllers/admin-auth.controller.ts

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
  HttpCode,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";

import { AdminAuthService } from "@/modules/auth/admin/admin/services/admin-auth.service";
import { AdminLoginDto } from "@/modules/auth/admin/common/dto/admin-login.dto";
import { AdminAuthResponseDto } from "@/modules/auth/admin/common/dto/admin-auth-response.dto";

import {
  COOKIE_NAMES,
  adminAccessCookieOptions,
  adminRefreshCookieOptions,
  clearAdminAccessCookieOptions,
  clearAdminRefreshCookieOptions,
} from "@/infrastructure/http/cookies";

import { AdminAccessGuard } from "@/modules/auth/admin/admin/guards/admin-access.guard";
import { AuthRateLimitService } from "@/modules/auth/rate-limit/auth-rate-limit.service";
import { AuthAuditLogService } from "@/modules/auth/audit/auth-audit-log-service";
import { AUDIT } from "@/modules/auth/audit/audit.actions";
import { ActiveTenantService } from "@/infrastructure/tenant-bootstrap/active-tenant.service";
import { TenantGuard } from "@/modules/catalog/common/tenant/tenant.guard";

function getReqMeta(req: FastifyRequest) {
  const xf = (req.headers["x-forwarded-for"] as string | undefined) ?? "";
  const ip = (xf.split(",")[0]?.trim() || (req as any).ip || undefined) as
    | string
    | undefined;

  const userAgent =
    (req.headers["user-agent"] as string | undefined) ?? undefined;

  return { ip, userAgent };
}

function pickIdentityAndTenant(user: any) {
  const tenantId = user?.tenantId as string | undefined;
  const identityId =
    (user?.identityId as string | undefined) ??
    (user?.sub as string | undefined);

  if (!tenantId || !identityId) {
    throw new UnauthorizedException("Invalid auth context");
  }

  return { tenantId, identityId };
}

@ApiTags("Admin Auth")
@Controller("admin/auth")
export class AdminAuthController {
  constructor(
    private readonly service: AdminAuthService,
    private readonly rl: AuthRateLimitService,
    private readonly audit: AuthAuditLogService,
    private readonly activeTenant: ActiveTenantService,
  ) {}

  @Post("login")
  @HttpCode(200)
  @ApiBody({ type: AdminLoginDto })
  @ApiOkResponse({ type: AdminAuthResponseDto })
  async login(
    @Body() dto: AdminLoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AdminAuthResponseDto> {
    const meta = getReqMeta(req);
    const tenantId = await this.activeTenant.getTenantId();

    try {
      await this.rl.assertAllowed(
        {
          typ: "admin",
          action: "login",
          tenantId,
          ip: meta.ip ?? null,
          identityKey: dto.email?.toLowerCase() ?? null,
        },
        10,
        5 * 60,
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
      tenantId,
      dto.email,
      dto.password,
      meta,
    );

    // Cookie-first auth: access + refresh cookie set
    reply.setCookie(
      COOKIE_NAMES.adminAccess,
      accessToken,
      adminAccessCookieOptions(),
    );
    reply.setCookie(
      COOKIE_NAMES.adminRefresh,
      refreshRaw,
      adminRefreshCookieOptions(),
    );

    // UI tarafı isterse accessToken'ı memory'de tutabilir; asıl kaynak cookie
    return { accessToken };
  }

  @Post("refresh")
  @HttpCode(200)
  @ApiOkResponse({ type: AdminAuthResponseDto })
  // Dokümantasyon standardı: tek auth scheme (adminAccessCookie)
  @ApiCookieAuth("adminAccessCookie")
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AdminAuthResponseDto> {
    const meta = getReqMeta(req);

    const refreshRaw = (req.cookies as any)?.[COOKIE_NAMES.adminRefresh];
    if (!refreshRaw) throw new UnauthorizedException("Missing refresh cookie");

    try {
      const { accessToken, refreshRaw: newRefresh } =
        await this.service.refresh(refreshRaw, meta);

      reply.setCookie(
        COOKIE_NAMES.adminAccess,
        accessToken,
        adminAccessCookieOptions(),
      );
      reply.setCookie(
        COOKIE_NAMES.adminRefresh,
        newRefresh,
        adminRefreshCookieOptions(),
      );

      return { accessToken };
    } catch (e: any) {
      // Refresh invalid/reuse => cookie temizle, client login'e düşsün
      reply.clearCookie(
        COOKIE_NAMES.adminRefresh,
        clearAdminRefreshCookieOptions(),
      );
      reply.clearCookie(
        COOKIE_NAMES.adminAccess,
        clearAdminAccessCookieOptions(),
      );
      throw e;
    }
  }

  @Post("logout")
  @HttpCode(200)
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const meta = getReqMeta(req);

    const refreshRaw = (req.cookies as any)?.[COOKIE_NAMES.adminRefresh];
    if (refreshRaw) await this.service.logout(refreshRaw, meta);

    reply.clearCookie(
      COOKIE_NAMES.adminRefresh,
      clearAdminRefreshCookieOptions(),
    );
    reply.clearCookie(
      COOKIE_NAMES.adminAccess,
      clearAdminAccessCookieOptions(),
    );

    return { ok: true };
  }

  @Post("logout-all")
  @HttpCode(200)
  @UseGuards(AdminAccessGuard, TenantGuard)
  @ApiCookieAuth("adminAccessCookie")
  async logoutAll(
    @Req() req: FastifyRequest & { user: any },
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const { tenantId, identityId } = pickIdentityAndTenant((req as any).user);

    await this.service.logoutAll(identityId, tenantId);

    reply.clearCookie(
      COOKIE_NAMES.adminRefresh,
      clearAdminRefreshCookieOptions(),
    );
    reply.clearCookie(
      COOKIE_NAMES.adminAccess,
      clearAdminAccessCookieOptions(),
    );

    return { ok: true };
  }

  @Get("me")
  @UseGuards(AdminAccessGuard, TenantGuard)
  @ApiCookieAuth("adminAccessCookie")
  me(@Req() req: FastifyRequest & { user: any }) {
    return { user: (req as any).user };
  }
}
