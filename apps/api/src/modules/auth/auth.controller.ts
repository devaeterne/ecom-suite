import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {
    console.log(
      "[AuthController] auth injected:",
      !!auth,
      auth?.constructor?.name
    );
  }

  @Post("login")
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.auth.login(dto.email, dto.password, {
      userAgent: res.req.headers["user-agent"] as string | undefined,
      ip:
        (res.req.headers["x-forwarded-for"] as string | undefined)
          ?.split(",")[0]
          ?.trim() ||
        (res.req.socket?.remoteAddress ?? undefined),
    });
    console.log(
      "AuthService injected?",
      !!this.auth,
      this.auth?.constructor?.name
    );

    this.auth.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = this.auth.getRefreshCookie(req);
    if (!refreshToken) throw new UnauthorizedException("Missing refresh token");

    const result = await this.auth.refresh(refreshToken, {
      userAgent: req.headers["user-agent"] as string | undefined,
      ip:
        (req.headers["x-forwarded-for"] as string | undefined)
          ?.split(",")[0]
          ?.trim() ||
        (req.socket?.remoteAddress ?? undefined),
    });

    this.auth.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post("logout")
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = this.auth.getRefreshCookie(req);
    if (refreshToken) {
      await this.auth.revoke(refreshToken);
    }
    this.auth.clearRefreshCookie(res);
    return;
  }

  // MVP: access JWT doğrulaması guard ile eklenir (bir sonraki adım)
  @Get("me")
  async me(@Req() req: Request) {
    // şimdilik placeholder; bir sonraki adımda JwtGuard ile user'ı req.user'a koyacağız
    throw new UnauthorizedException("Add JwtAuthGuard next");
  }
}
