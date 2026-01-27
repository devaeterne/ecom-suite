import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<any>();
    const user = req?.user;

    if (!user) throw new ForbiddenException("Not authenticated");

    // Guard yanlışlıkla store tarafında kullanılırsa “fail-closed”
    if (user.typ && user.typ !== "admin") {
      throw new ForbiddenException("Admin context required");
    }

    if (user.role !== "super_admin") {
      throw new ForbiddenException("Super admin required");
    }

    return true;
  }
}
