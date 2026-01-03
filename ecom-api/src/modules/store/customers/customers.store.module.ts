// src/modules/store/customers/customers.store.module.ts
import { Module } from "@nestjs/common";
import { CustomersStoreController } from "@/modules/store/customers/customers.store.controller";
import { CustomersStoreService } from "@/modules/store/customers/customers.store.service";
import { PrismaModule } from "@/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [CustomersStoreController],
  providers: [CustomersStoreService],
})
export class CustomersStoreModule {}
