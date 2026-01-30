import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { AdminMeService } from "@/modules/auth/admin/admin/services/admin-me.service";

@Controller("admin/me")
@UseGuards(AdminAuthGuard)
export class AdminMeController {
  constructor(private readonly svc: AdminMeService) {}

  @Get()
  async me(@Req() req: any) {
    return this.svc.me(req);
  }
}
