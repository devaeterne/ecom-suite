import { Module } from "@nestjs/common";
import { TokenService } from "@/modules/crypto/token.service-old";

@Module({
  providers: [TokenService],
  exports: [TokenService],
})
export class CryptoModule {}
