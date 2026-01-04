import { Module } from "@nestjs/common";
import { SecurityModule } from "@/infrastructure/security/security.module";

@Module({
  imports: [SecurityModule],
  exports: [SecurityModule],
})
export class CryptoModule {}
