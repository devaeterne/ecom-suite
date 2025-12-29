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

import { StoreAuthService } from "@/modules/auth/store/store-auth.service";
import { StoreAccessGuard } from "@/modules/auth/store/guards/store-access.guard";

import { StoreRegisterDto } from "@/modules/auth/store/dto/store-register.dto";
import { StoreLoginDto } from "@/modules/auth/store/dto/store-login.dto";
import { StoreResponseDto } from "@/modules/auth/store/dto/store-response.dto";

import {
  COOKIE_NAMES,
  storeRefreshCookieOptions,
  clearStoreRefreshCookieOptions,
} from "@/infrastructure/http/cookies";

@ApiTags("Store Auth")
@Controller("store/auth")
export class StoreAuthController {
  constructor(private readonly service: StoreAuthService) {}

  @Post("register")
  @ApiBody({ type: StoreRegisterDto })
  @ApiOkResponse({ type: StoreResponseDto })
  async register(
    @Body() dto: StoreRegisterDto,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<StoreResponseDto> {
    const { accessToken, refreshRaw } = await this.service.register(dto);

    reply.setCookie(
      COOKIE_NAMES.storeRefresh,
      refreshRaw,
      storeRefreshCookieOptions()
    );

    return { accessToken };
  }

  @Post("login")
  @ApiBody({ type: StoreLoginDto })
  @ApiOkResponse({ type: StoreResponseDto })
  async login(
    @Body() dto: StoreLoginDto,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<StoreResponseDto> {
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
  @ApiOkResponse({ type: StoreResponseDto })
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<StoreResponseDto> {
    const refreshRaw = (req.cookies as any)?.[COOKIE_NAMES.storeRefresh];
    if (!refreshRaw) {
      throw new UnauthorizedException("Missing refresh cookie");
    }

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
    if (refreshRaw) {
      await this.service.logout(refreshRaw);
    }

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
