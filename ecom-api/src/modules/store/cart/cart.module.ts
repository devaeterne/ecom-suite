import { Module } from "@nestjs/common";
import { StoreCartController } from "./cart.controller";
import { StoreCartService } from "./cart.service";
import { PrismaModule } from "@/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [StoreCartController],
  providers: [StoreCartService],
})
export class StoreCartModule {}
