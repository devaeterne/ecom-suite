// src/modules/customers/common/customers-common.module.ts

import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { CustomersRepo } from "@/modules/customers/common/prisma/customers.repo";

@Module({
  imports: [PrismaModule],
  providers: [CustomersRepo],
  exports: [CustomersRepo],
})
export class CustomersCommonModule {}
