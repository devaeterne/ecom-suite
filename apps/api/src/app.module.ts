import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { TenantModule } from "./modules/tenant/tenant.module";
import { PrismaModule } from "./modules/prisma/prisma.module";

@Module({
  imports: [PrismaModule, TenantModule],
  controllers: [AppController],
})
export class AppModule {}
