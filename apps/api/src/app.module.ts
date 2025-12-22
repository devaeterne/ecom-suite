import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { TenantModule } from "./modules/tenant/tenant.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { DbModule } from "./modules/db/db.module";

@Module({
  imports: [PrismaModule, TenantModule, DbModule],
  controllers: [AppController],
})
export class AppModule {}
