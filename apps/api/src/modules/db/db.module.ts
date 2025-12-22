import { Module } from "@nestjs/common";
import { DbController } from "./db.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [DbController],
})
export class DbModule {}
