import { Module } from "@nestjs/common";
import { StoreCartController } from "@/modules/cart/store/controllers/cart.controller";
import { StoreCartService } from "@/modules/cart/store/services/cart.service";
import { PrismaModule } from "@/prisma/prisma.module";
import { CartCommonModule } from "@/modules/cart/common/cart-common.module";

@Module({
  imports: [PrismaModule, CartCommonModule],
  controllers: [StoreCartController],
  providers: [StoreCartService],
})
export class StoreCartModule {}
