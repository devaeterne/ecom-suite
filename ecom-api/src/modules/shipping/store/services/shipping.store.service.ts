import { Injectable } from "@nestjs/common";
import { ShippingRepo } from "../../common/prisma/shipping.repo";

@Injectable()
export class ShippingStoreService {
  constructor(private readonly shippingRepo: ShippingRepo) {}

  listOptions(params: {
    tenantId: string;
    profileId?: string;
    provider?: string;
  }) {
    return this.shippingRepo.listActiveOptions(params);
  }
}
