import { Injectable } from "@nestjs/common";
import { ShippingRepo } from "../../common/prisma/shipping.repo";
import {
  presentShippingOption,
  presentShippingOptions,
} from "../../common/mappers";

import {
  AdminCreateShippingOptionDto,
  AdminPatchShippingOptionDto,
} from "../dto/admin.shipping-option.dto";

@Injectable()
export class ShippingOptionsAdminService {
  constructor(private readonly repo: ShippingRepo) {}

  async list(params: { tenantId: string; profileId?: string }) {
    const rows = await this.repo.listOptions(params);
    return presentShippingOptions(rows);
  }

  async create(params: {
    tenantId: string;
    profileId: string;
    dto: AdminCreateShippingOptionDto;
  }) {
    const { tenantId, profileId, dto } = params;

    const row = await this.repo.createOption({
      tenantId,
      profileId,
      data: {
        name: dto.name,
        provider: dto.provider,
        isActive: dto.isActive ?? true,
        amount: dto.amount ?? null,
        currencyCode: dto.currencyCode ?? "EUR",
        metadata: dto.metadata ?? {},
      } as any,
    });

    return presentShippingOption(row);
  }

  async patch(params: {
    tenantId: string;
    id: string;
    dto: AdminPatchShippingOptionDto;
  }) {
    const { tenantId, id, dto } = params;

    const row = await this.repo.patchOption({
      tenantId,
      id,
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.provider !== undefined ? { provider: dto.provider } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.currencyCode !== undefined
          ? { currencyCode: dto.currencyCode }
          : {}),
        ...(dto.metadata !== undefined ? { metadata: dto.metadata } : {}),
      } as any,
    });

    return presentShippingOption(row);
  }

  async remove(tenantId: string, id: string) {
    await this.repo.softDeleteOption({ tenantId, id });
    return { ok: true };
  }
}
