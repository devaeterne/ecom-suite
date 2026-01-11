import { Injectable } from "@nestjs/common";
import { ShippingRepo } from "../../common/prisma/shipping.repo";
import {
  presentShippingProfile,
  presentShippingProfiles,
} from "../../common/mappers";
import {
  AdminCreateShippingProfileDto,
  AdminPatchShippingProfileDto,
} from "../dto/admin.shipping-profile.dto";

@Injectable()
export class ShippingProfilesAdminService {
  constructor(private readonly repo: ShippingRepo) {}

  async list(tenantId: string) {
    const rows = await this.repo.listProfiles({ tenantId });
    return presentShippingProfiles(rows);
  }

  async create(tenantId: string, dto: AdminCreateShippingProfileDto) {
    const row = await this.repo.createProfile({
      tenantId,
      data: {
        name: dto.name,
        type: dto.type ?? "DEFAULT",
        metadata: dto.metadata ?? {},
      } as any,
    });
    return presentShippingProfile(row);
  }

  async patch(tenantId: string, id: string, dto: AdminPatchShippingProfileDto) {
    const row = await this.repo.patchProfile({
      tenantId,
      id,
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.metadata !== undefined ? { metadata: dto.metadata } : {}),
      } as any,
    });
    return presentShippingProfile(row);
  }

  async remove(tenantId: string, id: string) {
    await this.repo.softDeleteProfile({ tenantId, id });
    return { ok: true };
  }
}
