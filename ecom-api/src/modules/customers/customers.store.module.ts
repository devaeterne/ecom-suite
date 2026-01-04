// src/modules/store/customers/customers.store.module.ts
import { Module } from "@nestjs/common";
import { CustomersStoreController } from "@/modules/customers/store/controllers/customers.store.controller";
import { CustomersStoreService } from "@/modules/customers/store/services/customers.store.service";
import { CustomersCommonModule } from "./common/customers-common.module";

@Module({
  imports: [CustomersCommonModule],
  controllers: [CustomersStoreController],
  providers: [CustomersStoreService],
})
export class CustomersStoreModule {}
