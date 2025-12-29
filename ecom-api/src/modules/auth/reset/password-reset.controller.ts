import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PasswordResetService } from "@/modules/auth/reset/password-reset.service";
import { ResetRequestDto } from "@/modules/auth/reset/dto/reset-request.dto";
import { ResetConfirmDto } from "@/modules/auth/reset/dto/reset-confirm.dto";

@ApiTags("Password Reset")
@Controller("auth/reset-password")
export class PasswordResetController {
  constructor(private readonly service: PasswordResetService) {}

  @Post("request")
  async request(@Body() dto: ResetRequestDto) {
    await this.service.requestReset(dto);
    return { ok: true };
  }

  @Post("confirm")
  async confirm(@Body() dto: ResetConfirmDto) {
    await this.service.confirmReset(dto);
    return { ok: true };
  }
}
