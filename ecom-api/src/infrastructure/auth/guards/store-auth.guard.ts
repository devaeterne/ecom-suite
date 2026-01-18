import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { TokenService } from "@/infrastructure/security/token.service";
import { COOKIE_NAMES } from "@/infrastructure/http/cookies";

@Injectable()
export class StoreAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();

    const auth = req.headers?.authorization as string | undefined;
    let token: string | undefined;
    let source: "header" | "cookie" | undefined;

    if (auth?.startsWith("Bearer ")) {
      token = auth.slice("Bearer ".length).trim();
      source = "header";
    }

    if (!token) {
      const cookies = (req.cookies as any) ?? {};
      token = cookies[COOKIE_NAMES.storeAccess];
      if (token) source = "cookie";
    }

    if (!token) throw new UnauthorizedException("Missing store access token");

    const payload = this.tokenService.verifyAccessToken(token, "store");

    if (payload?.typ && payload.typ !== "store") {
      throw new UnauthorizedException("Invalid token type");
    }

    const sub = payload?.sub as string | undefined;

    req.user = {
      ...payload,
      typ: "store",
      ...(sub ? { id: payload.id ?? sub, userId: payload.userId ?? sub } : {}),
    };

    if (payload?.tenantId) req.tenant = req.tenant ?? { id: payload.tenantId };
    req.auth = { source, panel: "store" };

    return true;
  }
}
