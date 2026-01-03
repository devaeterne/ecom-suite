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
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";

import { StoreAuthService } from "@/modules/auth/store/store-auth.service";
import { StoreAccessGuard } from "@/modules/auth/store/guards/store-access.guard";

import { StoreRegisterDto } from "@/modules/auth/store/dto/store-register.dto";
import { StoreLoginDto } from "@/modules/auth/store/dto/store-login.dto";
import { StoreAuthResponseDto } from "@/modules/auth/store/dto/store-response.dto";

import {
  COOKIE_NAMES,
  storeRefreshCookieOptions,
  clearStoreRefreshCookieOptions,
  clearStoreAccessCookieOptions,
  storeAccessCookieOptions,
} from "@/infrastructure/http/cookies";

import { AuthRateLimitService } from "@/modules/auth/rate-limit/auth-rate-limit.service";
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

@ApiTags("Store Auth")
@Controller("store/auth")
export class StoreAuthController {
  constructor(
    private readonly service: StoreAuthService,
    private readonly rl: AuthRateLimitService,
    private readonly activeTenant: ActiveTenantService,
    private readonly audit: AuthAuditLogService
  ) {}

  @Post("register")
  @HttpCode(200)
  @ApiBody({ type: StoreRegisterDto })
  @ApiOkResponse({ type: StoreAuthResponseDto })
  async register(
    @Body() dto: StoreRegisterDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<StoreAuthResponseDto> {
    const meta = getReqMeta(req);
    const tenantId = await this.activeTenant.getTenantId();

    try {
      // 5 register / 10dk (IP + email)
      await this.rl.assertAllowed(
        {
          typ: "store",
          action: "register",
          tenantId,
          ip: meta.ip,
          identityKey: dto.email?.toLowerCase() ?? null,
        },
        5,
        10 * 60
      );
    } catch (e) {
      if (
        e instanceof HttpException &&
        e.getStatus() === HttpStatus.TOO_MANY_REQUESTS
      ) {
        const payload = e.getResponse() as any;
        await this.audit.log(tenantId, {
          action: AUDIT.STORE_REGISTER_RATE_LIMITED,
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

    const { accessToken, refreshRaw } = await this.service.register(
      tenantId,
      dto,
      meta
    );

    reply.setCookie(
      COOKIE_NAMES.storeAccess,
      accessToken,
      storeAccessCookieOptions()
    );
    reply.setCookie(
      COOKIE_NAMES.storeRefresh,
      refreshRaw,
      storeRefreshCookieOptions()
    );

    return { accessToken };
  }

  @Post("login")
  @HttpCode(200)
  @ApiBody({ type: StoreLoginDto })
  @ApiOkResponse({ type: StoreAuthResponseDto })
  async login(
    @Body() dto: StoreLoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<StoreAuthResponseDto> {
    const meta = getReqMeta(req);
    const tenantId = await this.activeTenant.getTenantId();

    try {
      // 10 login / 5dk (IP + email)
      await this.rl.assertAllowed(
        {
          typ: "store",
          action: "login",
          tenantId,
          ip: meta.ip,
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
          action: AUDIT.STORE_LOGIN_RATE_LIMITED,
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

    const { accessToken, refreshRaw } = await this.service.login(
      tenantId,
      dto.email,
      dto.password,
      meta
    );

    reply.setCookie(
      COOKIE_NAMES.storeAccess,
      accessToken,
      storeAccessCookieOptions()
    );
    reply.setCookie(
      COOKIE_NAMES.storeRefresh,
      refreshRaw,
      storeRefreshCookieOptions()
    );

    return { accessToken };
  }

  @Post("refresh")
  @HttpCode(200)
  @ApiOkResponse({ type: StoreAuthResponseDto })
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<StoreAuthResponseDto> {
    const meta = getReqMeta(req);

    const refreshRaw = (req.cookies as any)?.[COOKIE_NAMES.storeRefresh];
    if (!refreshRaw) {
      throw new UnauthorizedException("Missing refresh cookie");
    }

    const { accessToken, refreshRaw: newRefresh } = await this.service.refresh(
      refreshRaw,
      meta
    );

    reply.setCookie(
      COOKIE_NAMES.storeRefresh,
      newRefresh,
      storeRefreshCookieOptions()
    );
    reply.setCookie(
      COOKIE_NAMES.storeAccess,
      accessToken,
      storeAccessCookieOptions()
    );

    return { accessToken };
  }

  @Post("logout")
  @HttpCode(200)
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const meta = getReqMeta(req);

    const refreshRaw = (req.cookies as any)?.[COOKIE_NAMES.storeRefresh];
    if (refreshRaw) {
      await this.service.logout(refreshRaw, meta);
    }

    reply.clearCookie(
      COOKIE_NAMES.storeRefresh,
      clearStoreRefreshCookieOptions()
    );
    reply.clearCookie(
      COOKIE_NAMES.storeAccess,
      clearStoreAccessCookieOptions()
    );

    return { ok: true };
  }

  @Post("logout-all")
  @UseGuards(StoreAccessGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  async logoutAll(
    @Req() req: any,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const meta = getReqMeta(req as any);

    const { sub, tenantId } = req.user;
    await this.service.logoutAll(sub, tenantId, meta);

    reply.clearCookie(
      COOKIE_NAMES.storeRefresh,
      clearStoreRefreshCookieOptions()
    );
    reply.clearCookie(
      COOKIE_NAMES.storeAccess,
      clearStoreAccessCookieOptions()
    );

    return { ok: true };
  }

  @Get("me")
  @UseGuards(StoreAccessGuard)
  @ApiBearerAuth()
  @Get("me")
  @UseGuards(StoreAccessGuard)
  @ApiBearerAuth()
  async me(@Req() req: any) {
    const { sub, tenantId } = req.user; // sub artık customerId
    return this.service.me(sub, tenantId);
  }
}
