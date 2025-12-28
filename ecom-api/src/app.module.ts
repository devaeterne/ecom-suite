import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { CacheModule } from "./cache/cache.module";
import { StorageModule } from "./storage/storage.module";
import { HealthModule } from "./health/health.module";
import { ScheduleModule } from "@nestjs/schedule";
import { TenantBootstrapModule } from "./infrastructure/tenant-bootstrap/tenant-bootstrap.module";

@Module({
  imports: [
    PrismaModule,
    CacheModule,
    StorageModule,
    HealthModule,
    ScheduleModule.forRoot(),
    TenantBootstrapModule,
  ],
})
export class AppModule {}
