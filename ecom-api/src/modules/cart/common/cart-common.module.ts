import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { CartRepo } from "@/modules/cart/common/prisma/cart.repo";

@Module({
  imports: [PrismaModule],
  providers: [CartRepo],
  exports: [CartRepo],
})
export class CartCommonModule {}
