import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";

import { AdminAuthService } from "@/modules/auth/admin/admin-auth.service";
import { AdminLoginDto } from "@/modules/auth/admin/dto/admin-login.dto";
import { AdminAuthResponseDto } from "@/modules/auth/admin/dto/admin-auth-response.dto";
import {
  COOKIE_NAMES,
  adminRefreshCookieOptions,
  clearAdminRefreshCookieOptions,
} from "@/infrastructure/http/cookies";

import { UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { AdminAccessGuard } from "@/modules/auth/admin/guards/admin-access.guard";

@ApiTags("Admin Auth")
@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly service: AdminAuthService) {}

  @Post("login")
  @ApiBody({ type: AdminLoginDto })
  @ApiOkResponse({ type: AdminAuthResponseDto })
  async login(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<AdminAuthResponseDto> {
    const { accessToken, refreshRaw } = await this.service.login(
      dto.email,
      dto.password
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
    const refreshRaw = (req.cookies as any)?.[COOKIE_NAMES.adminRefresh];
    if (!refreshRaw) throw new UnauthorizedException("Missing refresh cookie");

    const { accessToken, refreshRaw: newRefresh } = await this.service.refresh(
      refreshRaw
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
    const refreshRaw = (req.cookies as any)?.[COOKIE_NAMES.adminRefresh];
    if (refreshRaw) await this.service.logout(refreshRaw);

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
