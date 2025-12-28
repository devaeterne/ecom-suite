import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";

import { StoreAuthService } from "./store-auth.service";
import { StoreAccessGuard } from "./guards/store-access.guard";

import { AdminLoginDto } from "../admin/dto/admin-login.dto"; // aynı DTO’yu reuse edebiliriz
import { AdminAuthResponseDto } from "../admin/dto/admin-auth-response.dto";

import {
  COOKIE_NAMES,
  storeRefreshCookieOptions,
  clearStoreRefreshCookieOptions,
} from "@/infrastructure/http/cookies";

@ApiTags("Store Auth")
@Controller("store/auth")
export class StoreAuthController {
  constructor(private readonly service: StoreAuthService) {}

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
      COOKIE_NAMES.storeRefresh,
      refreshRaw,
      storeRefreshCookieOptions()
    );
    return { accessToken };
  }

  @Post("refresh")
  @ApiOkResponse({ type: AdminAuthResponseDto })
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<AdminAuthResponseDto> {
    const refreshRaw = (req.cookies as any)?.[COOKIE_NAMES.storeRefresh];
    if (!refreshRaw) throw new UnauthorizedException("Missing refresh cookie");

    const { accessToken, refreshRaw: newRefresh } = await this.service.refresh(
      refreshRaw
    );

    reply.setCookie(
      COOKIE_NAMES.storeRefresh,
      newRefresh,
      storeRefreshCookieOptions()
    );
    return { accessToken };
  }

  @Post("logout")
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const refreshRaw = (req.cookies as any)?.[COOKIE_NAMES.storeRefresh];
    if (refreshRaw) await this.service.logout(refreshRaw);

    reply.clearCookie(
      COOKIE_NAMES.storeRefresh,
      clearStoreRefreshCookieOptions()
    );
    return { ok: true };
  }

  @Get("me")
  @UseGuards(StoreAccessGuard)
  @ApiBearerAuth()
  async me(@Req() req: any) {
    return { user: req.user };
  }
}
