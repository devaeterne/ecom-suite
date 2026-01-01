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

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<any>();
    const auth = req.headers?.authorization as string | undefined;

    const bearer = auth?.startsWith("Bearer ")
      ? auth.slice("Bearer ".length).trim()
      : null;

    const cookieToken =
      (req.cookies as any)?.[COOKIE_NAMES.storeAccess] ?? null;

    const token = bearer ?? cookieToken;
    if (!token) throw new UnauthorizedException("Missing access token");

    const payload = this.tokenService.verifyAccessToken(token);

    if (payload?.typ !== "store") {
      throw new UnauthorizedException("Invalid token type");
    }

    const customerId = payload.tenantId ?? payload.sub ?? null;
    req.customer = { ...payload, id: customerId };
    req.auth = { source: bearer ? "header" : "cookie" };

    return true;
  }
}
