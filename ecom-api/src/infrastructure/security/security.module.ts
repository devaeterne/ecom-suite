import { Module } from "@nestjs/common";
import { HashService } from "@/infrastructure/security/hash.service";
import { TokenService } from "@/infrastructure/security/token.service";

@Module({
  providers: [HashService, TokenService],
  exports: [HashService, TokenService],
})
export class SecurityModule {}
