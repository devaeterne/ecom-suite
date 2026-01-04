import { Global, Module } from "@nestjs/common";
import { TokenService } from "./token.service";
import { HashService } from "./hash.service";

@Global()
@Module({
  providers: [TokenService, HashService],
  exports: [TokenService, HashService],
})
export class SecurityModule {}
