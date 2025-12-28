import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { TokenService } from "@/modules/crypto/token.service";

@Injectable()
export class StoreAccessGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<any>();
    const auth = req.headers?.authorization as string | undefined;

    if (!auth || !auth.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = auth.slice("Bearer ".length).trim();
    const payload = this.tokenService.verifyAccessToken(token);

    if (payload?.typ !== "store")
      throw new UnauthorizedException("Invalid token type");

    req.user = payload;
    return true;
  }
}
