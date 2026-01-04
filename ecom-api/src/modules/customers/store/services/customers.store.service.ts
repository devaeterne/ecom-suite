// src/modules/customers/store/services/customers.store.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

import type { StoreAuthContext } from "@/modules/auth/store/common/types/store-request";
import { UpdateCustomerDto } from "@/modules/customers/store/dto/update-customer.dto";
import { UpsertAddressDto } from "@/modules/customers/store/dto/upsert-address.dto";

import {
  CUSTOMER_ERRORS,
  CUSTOMER_ADDRESS_DEFAULT_ORDER,
} from "@/modules/customers/common/constants/customer.constants";
import { getCustomerIdOrThrow } from "@/modules/customers/common/policies/customer.auth";
import { getTenantIdOrThrow } from "@/modules/customers/common/policies/customer.tenancy";
import { mapUpsertAddressDtoToPrisma } from "@/modules/customers/common/policies/customer.addresses";

@Injectable()
export class CustomersStoreService {
  constructor(private readonly prisma: PrismaService) {}

  /* ------------------------------------------------------------------
   * Customer
   * ------------------------------------------------------------------ */

  async getMe(req: StoreAuthContext) {
    const tenantId = getTenantIdOrThrow(req);
    const customerId = getCustomerIdOrThrow(req);

    const customer = await this.prisma.customer.findUnique({
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

    if (!customer)
      throw new NotFoundException(CUSTOMER_ERRORS.CUSTOMER_NOT_FOUND);
    return { customer };
  }

  async updateMe(req: StoreAuthContext, dto: UpdateCustomerDto) {
    const tenantId = getTenantIdOrThrow(req);
    const customerId = getCustomerIdOrThrow(req);

    // update: sadece gelen alanları yaz
    const customer = await this.prisma.customer.update({
      where: { tenantId_id: { tenantId, id: customerId } },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        updatedAt: true,
      },
    });

    return { customer };
  }

  /* ------------------------------------------------------------------
   * Addresses
   * ------------------------------------------------------------------ */

  async listAddresses(req: StoreAuthContext) {
    const tenantId = getTenantIdOrThrow(req);
    const customerId = getCustomerIdOrThrow(req);

    const items = await this.prisma.customerAddress.findMany({
      where: { tenantId, customerId, deletedAt: null },
      orderBy: CUSTOMER_ADDRESS_DEFAULT_ORDER,
    });

    return { addresses: items };
  }

  async createAddress(req: StoreAuthContext, dto: UpsertAddressDto) {
    const tenantId = getTenantIdOrThrow(req);
    const customerId = getCustomerIdOrThrow(req);

    const data = mapUpsertAddressDtoToPrisma(dto);

    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.customerAddress.updateMany({
          where: { tenantId, customerId, deletedAt: null },
          data: { isDefault: false },
        });
      }

      const address = await tx.customerAddress.create({
        data: {
          tenantId,
          customerId,
          ...data,
        },
      });

      return { address };
    });
  }

  async updateAddress(
    req: StoreAuthContext,
    id: string,
    dto: UpsertAddressDto
  ) {
    const tenantId = getTenantIdOrThrow(req);
    const customerId = getCustomerIdOrThrow(req);

    const exists = await this.prisma.customerAddress.findFirst({
      where: { id, tenantId, customerId, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(CUSTOMER_ERRORS.ADDRESS_NOT_FOUND);

    const data = mapUpsertAddressDtoToPrisma(dto);

    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.customerAddress.updateMany({
          where: { tenantId, customerId, deletedAt: null },
          data: { isDefault: false },
        });
      }

      const address = await tx.customerAddress.update({
        where: { tenantId_id: { tenantId, id } },
        data,
      });

      return { address };
    });
  }

  async deleteAddress(req: StoreAuthContext, id: string) {
    const tenantId = getTenantIdOrThrow(req);
    const customerId = getCustomerIdOrThrow(req);

    const exists = await this.prisma.customerAddress.findFirst({
      where: { id, tenantId, customerId, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(CUSTOMER_ERRORS.ADDRESS_NOT_FOUND);

    await this.prisma.customerAddress.update({
      where: { tenantId_id: { tenantId, id } },
      data: { deletedAt: new Date(), isDefault: false },
    });

    return { ok: true };
  }
}
