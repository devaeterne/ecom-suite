// src/modules/store/customers/customers.store.service.ts
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { UpdateCustomerDto } from "@/modules/store/customers/dto/update-customer.dto";
import { UpsertAddressDto } from "@/modules/store/customers/dto/upsert-address.dto";

@Injectable()
export class CustomersStoreService {
  constructor(private readonly prisma: PrismaService) {}

  /* ------------------------------------------------------------------
   * Helpers
   * ------------------------------------------------------------------ */

  private getCustomerIdFromReq(req: any): string {
    const customerId = req?.user?.sub;
    if (!customerId) throw new UnauthorizedException("Unauthenticated");
    return customerId;
  }

  private getTenantIdFromReq(req: any): string {
    const tenantId = req?.tenant?.id ?? req?.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException("Tenant not resolved");
    return tenantId;
  }

  /**
   * DTO -> Prisma CustomerAddress alan mapping’i.
   * DTO: title/address1/address2/district/zip/countryIso2
   * DB : label/line1/line2/province/postalCode/countryIso2
   */
  private mapAddressDtoToData(dto: UpsertAddressDto) {
    // dto.countryIso2 zorunlu; geriye dönük "country" kullanan client varsa destekle:
    const anyDto = dto as any;
    const countryIso2 = dto.countryIso2 ?? anyDto.countryIso2 ?? anyDto.country;
    if (!countryIso2) {
      // Zod zaten yakalar ama runtime safeguard:
      throw new UnauthorizedException("countryIso2 missing");
    }

    return {
      // label
      label: (dto as any).title ?? (dto as any).label ?? null,

      fullName: dto.fullName ?? null,
      phone: dto.phone ?? null,
      email: (dto as any).email ?? null,
      company: (dto as any).company ?? null,

      line1: (dto as any).address1, // zorunlu
      line2: (dto as any).address2 ?? null,

      city: (dto as any).city,
      province: (dto as any).district ?? (dto as any).province ?? null,

      postalCode: (dto as any).zip ?? (dto as any).postalCode ?? null,
      countryIso2,

      isDefault: dto.isDefault ?? false,
    };
  }

  /* ------------------------------------------------------------------
   * Customer
   * ------------------------------------------------------------------ */

  async getMe(req: any) {
    const tenantId = this.getTenantIdFromReq(req);
    const customerId = this.getCustomerIdFromReq(req);

    // Customer büyük olasılıkla tenant scoped: @@unique([tenantId, id])
    const customer = await this.prisma.customer.findUnique({
      where: {
        tenantId_id: { tenantId, id: customerId },
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

    if (!customer) throw new NotFoundException("Customer not found");
    return { customer };
  }

  async updateMe(req: any, dto: UpdateCustomerDto) {
    const tenantId = this.getTenantIdFromReq(req);
    const customerId = this.getCustomerIdFromReq(req);

    const customer = await this.prisma.customer.update({
      where: {
        tenantId_id: { tenantId, id: customerId },
      },
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
      },
    });

    return { customer };
  }

  /* ------------------------------------------------------------------
   * Addresses
   * ------------------------------------------------------------------ */

  async listAddresses(req: any) {
    const tenantId = this.getTenantIdFromReq(req);
    const customerId = this.getCustomerIdFromReq(req);

    const items = await this.prisma.customerAddress.findMany({
      where: {
        tenantId,
        customerId,
        deletedAt: null,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return { addresses: items };
  }

  async createAddress(req: any, dto: UpsertAddressDto) {
    const tenantId = this.getTenantIdFromReq(req);
    const customerId = this.getCustomerIdFromReq(req);

    if (dto.isDefault) {
      await this.prisma.customerAddress.updateMany({
        where: { tenantId, customerId, deletedAt: null },
        data: { isDefault: false },
      });
    }

    const data = this.mapAddressDtoToData(dto);

    const address = await this.prisma.customerAddress.create({
      data: {
        tenantId,
        customerId,
        ...data,
      },
    });

    return { address };
  }

  async updateAddress(req: any, id: string, dto: UpsertAddressDto) {
    const tenantId = this.getTenantIdFromReq(req);
    const customerId = this.getCustomerIdFromReq(req);

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

    const data = this.mapAddressDtoToData(dto);

    const address = await this.prisma.customerAddress.update({
      where: {
        tenantId_id: { tenantId, id },
      },
      data,
    });

    return { address };
  }

  async deleteAddress(req: any, id: string) {
    const tenantId = this.getTenantIdFromReq(req);
    const customerId = this.getCustomerIdFromReq(req);

    const exists = await this.prisma.customerAddress.findFirst({
      where: { id, tenantId, customerId, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException("Address not found");

    await this.prisma.customerAddress.update({
      where: { tenantId_id: { tenantId, id } },
      data: { deletedAt: new Date() },
    });

    return { ok: true };
  }
}
