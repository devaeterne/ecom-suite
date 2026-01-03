import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { TokenService } from "@/infrastructure/security/token.service";
import { COOKIE_NAMES } from "@/infrastructure/http/cookies";

@Injectable()
export class StoreAccessGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<any>();
    const auth = req.headers?.authorization as string | undefined;

    // 1) Bearer öncelikli
    let token: string | undefined;
    let source: "header" | "cookie" | undefined;

    if (auth?.startsWith("Bearer ")) {
      token = auth.slice("Bearer ".length).trim();
      source = "header";
    }

    // 2) Cookie fallback (E2E agent / browser)
    if (!token) {
      const cookieToken = (req.cookies as any)?.[COOKIE_NAMES.storeAccess];
      if (cookieToken) {
        token = cookieToken;
        source = "cookie";
      }
    }

    if (!token) throw new UnauthorizedException("Missing access token");

    const payload = this.tokenService.verifyAccessToken(token);
    if (payload?.typ !== "store")
      throw new UnauthorizedException("Invalid token type");

    req.user = payload;
    req.customerId = payload.sub;
    req.auth = { source };
    return true;
  }
}
