import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { TenantModule } from "./modules/tenant/tenant.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { DbModule } from "./modules/db/db.module";
import { AuthModule } from "./modules/auth/auth.module";

@Module({
  imports: [PrismaModule, TenantModule, DbModule, AuthModule],
  controllers: [AppController],
})
export class AppModule {}
