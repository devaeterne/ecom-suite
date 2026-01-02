import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { CacheModule } from "@/cache/cache.module";
import { StorageModule } from "@/storage/storage.module";
import { HealthModule } from "@/health/health.module";
import { ScheduleModule } from "@nestjs/schedule";
import { TenantBootstrapModule } from "@/infrastructure/tenant-bootstrap/tenant-bootstrap.module";
import { AdminAuthModule } from "@/modules/auth/admin/admin-auth.module";
import { StoreAuthModule } from "@/modules/auth/store/store-auth.module";
import { MailModule } from "@/infrastructure/mail/mail.module";
import { PasswordResetModule } from "@/modules/auth/reset/password-reset.module";
import { AuthRateLimitModule } from "@/modules/auth/rate-limit/auth-rate-limit.module";
import { AdminModule } from "@/modules/admin/admin.module";
import { RedisModule } from "@nestjs-modules/ioredis";
import { redisConfig } from "@/config/redis.config";
import { CatalogModule } from "@/modules/catalog/catalog.module";

@Module({
  imports: [
    PrismaModule,
    CacheModule,
    StorageModule,
    HealthModule,
    ScheduleModule.forRoot(),
    TenantBootstrapModule,
    AdminAuthModule,
    StoreAuthModule,
    MailModule,
    PasswordResetModule,
    AuthRateLimitModule,
    AdminModule,
    RedisModule.forRoot(redisConfig),
    CatalogModule,
  ],
})
export class AppModule {}
