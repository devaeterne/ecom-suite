import { Injectable } from "@nestjs/common";
import { ShippingRepo } from "../../common/prisma/shipping.repo";
import {
  presentShippingCarrier,
  presentShippingCarriers,
} from "../../common/mappers";

import {
  AdminCreateShippingCarrierDto,
  AdminPatchShippingCarrierDto,
} from "../dto/admin.shipping-carrier.dto";

@Injectable()
export class ShippingCarriersAdminService {
  constructor(private readonly repo: ShippingRepo) {}

  async list(tenantId: string) {
    const rows = await this.repo.listCarriers({ tenantId });
    return presentShippingCarriers(rows);
  }

  async create(tenantId: string, dto: AdminCreateShippingCarrierDto) {
    const row = await this.repo.createCarrier({
      tenantId,
      data: {
        name: dto.name,
        code: dto.code ?? null,
        provider: dto.provider ?? null,
        metadata: dto.metadata ?? {},
      } as any,
    });
    return presentShippingCarrier(row);
  }

  async patch(tenantId: string, id: string, dto: AdminPatchShippingCarrierDto) {
    const row = await this.repo.patchCarrier({
      tenantId,
      id,
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.provider !== undefined ? { provider: dto.provider } : {}),
        ...(dto.metadata !== undefined ? { metadata: dto.metadata } : {}),
      } as any,
    });
    return presentShippingCarrier(row);
  }

  async remove(tenantId: string, id: string) {
    await this.repo.softDeleteCarrier({ tenantId, id });
    return { ok: true };
  }
}
