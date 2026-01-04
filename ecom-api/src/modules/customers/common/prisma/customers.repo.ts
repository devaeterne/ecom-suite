import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  toCustomerMe,
  toCustomerAddressDTO,
} from "@/modules/customers/common/mappers/customer.mapper";
import type {
  CustomerMe,
  CustomerAddressDTO,
} from "@/modules/customers/common/types/customer.types";
import type { UpsertAddressDto } from "@/modules/customers/store/dto/upsert-address.dto";

@Injectable()
export class CustomersRepo {
  constructor(private readonly prisma: PrismaService) {}

  /* -----------------------------
   * Customer
   * ----------------------------- */

  async getMe(tenantId: string, customerId: string): Promise<CustomerMe> {
    const row = await this.prisma.customer.findUnique({
      where: { tenantId_id: { tenantId, id: customerId } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!row) throw new NotFoundException("Customer not found");
    return toCustomerMe(row);
  }

  async updateMe(
    tenantId: string,
    customerId: string,
    patch: {
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
    }
  ): Promise<CustomerMe> {
    const row = await this.prisma.customer.update({
      where: { tenantId_id: { tenantId, id: customerId } },
      data: {
        ...(patch.firstName !== undefined
          ? { firstName: patch.firstName }
          : {}),
        ...(patch.lastName !== undefined ? { lastName: patch.lastName } : {}),
        ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
      },
    });

    return toCustomerMe(row);
  }

  /* -----------------------------
   * Addresses
   * ----------------------------- */

  async listAddresses(
    tenantId: string,
    customerId: string
  ): Promise<CustomerAddressDTO[]> {
    const rows = await this.prisma.customerAddress.findMany({
      where: { tenantId, customerId, deletedAt: null },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return rows.map(toCustomerAddressDTO);
  }

  async createAddress(
    tenantId: string,
    customerId: string,
    dto: UpsertAddressDto
  ): Promise<CustomerAddressDTO> {
    if (dto.isDefault) {
      await this.prisma.customerAddress.updateMany({
        where: { tenantId, customerId, deletedAt: null },
        data: { isDefault: false },
      });
    }

    const data = this.mapAddressDtoToPrisma(dto);

    const row = await this.prisma.customerAddress.create({
      data: { tenantId, customerId, ...data },
    });

    return toCustomerAddressDTO(row);
  }

  async updateAddress(
    tenantId: string,
    customerId: string,
    id: string,
    dto: UpsertAddressDto
  ): Promise<CustomerAddressDTO> {
    const exists = await this.prisma.customerAddress.findFirst({
      where: { id, tenantId, customerId, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException("Address not found");

    if (dto.isDefault) {
      await this.prisma.customerAddress.updateMany({
        where: { tenantId, customerId, deletedAt: null },
        data: { isDefault: false },
      });
    }

    const data = this.mapAddressDtoToPrisma(dto);

    const row = await this.prisma.customerAddress.update({
      where: { tenantId_id: { tenantId, id } },
      data,
    });

    return toCustomerAddressDTO(row);
  }

  async deleteAddress(
    tenantId: string,
    customerId: string,
    id: string
  ): Promise<void> {
    const exists = await this.prisma.customerAddress.findFirst({
      where: { id, tenantId, customerId, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException("Address not found");

    await this.prisma.customerAddress.update({
      where: { tenantId_id: { tenantId, id } },
      data: { deletedAt: new Date(), isDefault: false },
    });
  }

  /* -----------------------------
   * Mapping (DTO -> Prisma)
   * ----------------------------- */

  private mapAddressDtoToPrisma(dto: UpsertAddressDto) {
    const anyDto = dto as any;
    const countryIso2 = dto.countryIso2 ?? anyDto.countryIso2 ?? anyDto.country;
    if (!countryIso2) throw new Error("countryIso2 missing");

    return {
      label: anyDto.title ?? anyDto.label ?? null,

      fullName: dto.fullName ?? null,
      phone: dto.phone ?? null,
      email: anyDto.email ?? null,
      company: anyDto.company ?? null,

      line1: anyDto.address1, // zorunlu
      line2: anyDto.address2 ?? null,

      city: anyDto.city,
      province: anyDto.district ?? anyDto.province ?? null,

      postalCode: anyDto.zip ?? anyDto.postalCode ?? null,
      countryIso2,

      isDefault: dto.isDefault ?? false,
    };
  }
}
