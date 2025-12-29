import { Module } from "@nestjs/common";
import { CacheModule } from "@/cache/cache.module";
import { AuthRateLimitService } from "@/modules/auth/rate-limit/auth-rate-limit-service";

@Module({
  imports: [CacheModule],
  providers: [AuthRateLimitService],
  exports: [AuthRateLimitService],
})
export class AuthRateLimitModule {}
