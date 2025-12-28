import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { CacheModule } from "./cache/cache.module";
import { StorageModule } from "./storage/storage.module";
import { HealthModule } from "./health/health.module";
import { ScheduleModule } from "@nestjs/schedule";
import { TenantBootstrapModule } from "@/infrastructure/tenant-bootstrap/tenant-bootstrap.module";
import { AdminAuthModule } from "@/modules/auth/admin/admin-auth.module";
import { StoreAuthModule } from "@/modules/auth/store/store-auth.module";

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
  ],
})
export class AppModule {}
