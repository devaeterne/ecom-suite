import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class ShippingRepo {
  constructor(private readonly prisma: PrismaService) {}

  // ---- STORE ----
  listActiveOptions(params: {
    tenantId: string;
    profileId?: string;
    provider?: string;
  }) {
    const { tenantId, profileId, provider } = params;

    return this.prisma.shippingOption.findMany({
      where: {
        tenantId,
        deletedAt: null,
        isActive: true,
        ...(profileId ? { profileId } : {}),
        ...(provider ? { provider: provider as any } : {}),
      },
      orderBy: [{ profileId: "asc" }, { name: "asc" }],
    });
  }

  // ---- ADMIN: CARRIERS ----
  listCarriers(params: { tenantId: string }) {
    return this.prisma.shippingCarrier.findMany({
      where: { tenantId: params.tenantId, deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  createCarrier(params: {
    tenantId: string;
    data: Prisma.ShippingCarrierCreateInput;
  }) {
    const { tenantId, data } = params;
    return this.prisma.shippingCarrier.create({
      data: { ...data, tenant: { connect: { id: tenantId } } } as any,
    });
  }

  patchCarrier(params: {
    tenantId: string;
    id: string;
    data: Prisma.ShippingCarrierUpdateInput;
  }) {
    const { tenantId, id, data } = params;
    return this.prisma.shippingCarrier.update({
      where: { tenantId_id: { tenantId, id } },
      data,
    });
  }

  softDeleteCarrier(params: { tenantId: string; id: string }) {
    const { tenantId, id } = params;
    return this.prisma.shippingCarrier.update({
      where: { tenantId_id: { tenantId, id } },
      data: { deletedAt: new Date() },
    });
  }

  // ---- ADMIN: PROFILES ----
  listProfiles(params: { tenantId: string }) {
    return this.prisma.shippingProfile.findMany({
      where: { tenantId: params.tenantId, deletedAt: null },
      orderBy: { name: "asc" },
      include: { options: { where: { deletedAt: null } } },
    });
  }

  createProfile(params: {
    tenantId: string;
    data: Prisma.ShippingProfileCreateInput;
  }) {
    const { tenantId, data } = params;
    return this.prisma.shippingProfile.create({
      data: { ...data, tenant: { connect: { id: tenantId } } } as any,
    });
  }

  patchProfile(params: {
    tenantId: string;
    id: string;
    data: Prisma.ShippingProfileUpdateInput;
  }) {
    const { tenantId, id, data } = params;
    return this.prisma.shippingProfile.update({
      where: { tenantId_id: { tenantId, id } },
      data,
    });
  }

  softDeleteProfile(params: { tenantId: string; id: string }) {
    const { tenantId, id } = params;
    return this.prisma.shippingProfile.update({
      where: { tenantId_id: { tenantId, id } },
      data: { deletedAt: new Date() },
    });
  }

  // ---- ADMIN: OPTIONS ----
  listOptions(params: { tenantId: string; profileId?: string }) {
    const { tenantId, profileId } = params;
    return this.prisma.shippingOption.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(profileId ? { profileId } : {}),
      },
      orderBy: [{ profileId: "asc" }, { name: "asc" }],
      include: { profile: true },
    });
  }

  createOption(params: {
    tenantId: string;
    profileId: string;
    data: Prisma.ShippingOptionCreateInput;
  }) {
    const { tenantId, profileId, data } = params;
    return this.prisma.shippingOption.create({
      data: {
        ...data,
        tenant: { connect: { id: tenantId } },
        profile: { connect: { tenantId_id: { tenantId, id: profileId } } },
      } as any,
    });
  }

  patchOption(params: {
    tenantId: string;
    id: string;
    data: Prisma.ShippingOptionUpdateInput;
  }) {
    const { tenantId, id, data } = params;
    return this.prisma.shippingOption.update({
      where: { tenantId_id: { tenantId, id } },
      data,
    });
  }

  softDeleteOption(params: { tenantId: string; id: string }) {
    const { tenantId, id } = params;
    return this.prisma.shippingOption.update({
      where: { tenantId_id: { tenantId, id } },
      data: { deletedAt: new Date() },
    });
  }
}
