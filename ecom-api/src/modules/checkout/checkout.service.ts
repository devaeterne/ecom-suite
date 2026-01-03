import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";
import { UpsertCheckoutAddressDto } from "./dto/upsert-checkout-address.dto";
import { StartPaymentDto } from "./dto/start-payment.dto";
import {
  CartStatus,
  PaymentProvider,
  CheckoutStatus,
  PaymentStatus,
} from "@prisma/client";

function requireString(v: any, name: string) {
  if (!v || typeof v !== "string")
    throw new BadRequestException(`${name} missing`);
  return v;
}

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) {}

  private getTenantIdFromReq(req: any): string {
    return requireString(
      req?.tenantId ?? req?.user?.tenantId ?? req?.tenant?.id,
      "tenantId"
    );
  }

  private getCustomerIdFromReq(req: any): string {
    return requireString(
      req?.customerId ?? req?.user?.customerId ?? req?.customer?.id,
      "customerId"
    );
  }

  async createCheckout(req: any, dto: CreateCheckoutDto) {
    const tenantId = this.getTenantIdFromReq(req);
    const customerId = this.getCustomerIdFromReq(req);

    const currencyCode = dto.currencyCode ?? "EUR";

    // cart resolve
    const existingCart = dto.cartId
      ? await this.prisma.cart.findFirst({
          where: { tenantId, id: dto.cartId, deletedAt: null },
        })
      : await this.prisma.cart.findFirst({
          where: {
            tenantId,
            customerId,
            status: CartStatus.ACTIVE,
            deletedAt: null,
          },
          orderBy: { updatedAt: "desc" },
        });

    const cart =
      existingCart ??
      (await this.prisma.cart.create({
        data: { tenantId, customerId, status: CartStatus.ACTIVE, currencyCode },
      }));

    // checkout upsert (uniq: tenantId + cartId)
    const checkout = await this.prisma.checkout.upsert({
      where: { tenantId_cartId: { tenantId, cartId: cart.id } },
      update: {
        email: dto.email ?? undefined,
        currencyCode,
      },
      create: {
        tenantId,
        cartId: cart.id,
        customerId,
        email: dto.email ?? undefined,
        currencyCode,
        status: CheckoutStatus.OPEN,
      },
      include: { addresses: true, cart: true },
    });

    return { checkout };
  }

  async upsertAddress(
    req: any,
    checkoutId: string,
    dto: UpsertCheckoutAddressDto
  ) {
    const tenantId = this.getTenantIdFromReq(req);
    const customerId = this.getCustomerIdFromReq(req);

    const checkout = await this.prisma.checkout.findFirst({
      where: { tenantId, id: checkoutId, deletedAt: null },
      select: { id: true, customerId: true },
    });
    if (!checkout) throw new NotFoundException("checkout not found");
    if (checkout.customerId && checkout.customerId !== customerId) {
      throw new ForbiddenException("not your checkout");
    }

    // country FK check
    const c = await this.prisma.country.findUnique({
      where: { iso2: dto.countryIso2 },
      select: { iso2: true },
    });
    if (!c)
      throw new BadRequestException(`unknown countryIso2: ${dto.countryIso2}`);

    /**
     * Buradaki TS hatanın sebebi şu:
     * CheckoutAddress modelinde @@unique([tenantId, checkoutId, type]) YOK → prisma unique input üretmiyor.
     *
     * ÇÖZÜM: schema’ya unique ekle + migration üret.
     */
    const address = await this.prisma.checkoutAddress.upsert({
      where: {
        tenantId_checkoutId_type: {
          tenantId,
          checkoutId,
          type: dto.type,
        },
      },
      update: {
        fullName: dto.fullName ?? null,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        company: dto.company ?? null,
        line1: dto.line1,
        line2: dto.line2 ?? null,
        city: dto.city,
        province: dto.province ?? null,
        postalCode: dto.postalCode ?? null,
        countryIso2: dto.countryIso2,
        taxNo: dto.taxNo ?? null,
        taxOffice: dto.taxOffice ?? null,
      },
      create: {
        tenantId,
        checkoutId,
        type: dto.type,
        fullName: dto.fullName ?? null,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        company: dto.company ?? null,
        line1: dto.line1,
        line2: dto.line2 ?? null,
        city: dto.city,
        province: dto.province ?? null,
        postalCode: dto.postalCode ?? null,
        countryIso2: dto.countryIso2,
        taxNo: dto.taxNo ?? null,
        taxOffice: dto.taxOffice ?? null,
      },
    });

    return { address };
  }

  async getAvailablePaymentProviders(req: any, checkoutId: string) {
    const tenantId = this.getTenantIdFromReq(req);
    const customerId = this.getCustomerIdFromReq(req);

    const checkout = await this.prisma.checkout.findFirst({
      where: { tenantId, id: checkoutId, deletedAt: null },
      include: { addresses: true },
    });
    if (!checkout) throw new NotFoundException("checkout not found");
    if (checkout.customerId && checkout.customerId !== customerId) {
      throw new ForbiddenException("not your checkout");
    }

    const shipping =
      checkout.addresses.find((a) => a.type === "SHIPPING") ?? null;
    const countryIso2 = shipping?.countryIso2 ?? null;

    const base: Array<{ provider: PaymentProvider; reason: string }> = [
      { provider: PaymentProvider.MANUAL, reason: "bank transfer" },
    ];

    if (countryIso2 === "TR") {
      base.unshift({ provider: PaymentProvider.PAYTR, reason: "TR rule" });
    } else if (countryIso2 && ["DE", "FR", "GB"].includes(countryIso2)) {
      base.unshift({ provider: PaymentProvider.STRIPE, reason: "EU/GB rule" });
    } else if (countryIso2) {
      base.unshift({
        provider: PaymentProvider.VERIFONE,
        reason: "default rule",
      });
    }

    const enabled = await this.prisma.tenantPaymentProvider.findMany({
      where: { tenantId },
      select: { provider: true },
    });
    const enabledSet = new Set<PaymentProvider>(enabled.map((x) => x.provider));

    const usable = base.filter(
      (x) => x.provider === PaymentProvider.MANUAL || enabledSet.has(x.provider)
    );

    return { providers: usable, countryIso2 };
  }

  async startPayment(req: any, checkoutId: string, dto: StartPaymentDto) {
    const tenantId = this.getTenantIdFromReq(req);
    const customerId = this.getCustomerIdFromReq(req);

    const checkout = await this.prisma.checkout.findFirst({
      where: { tenantId, id: checkoutId, deletedAt: null },
      include: { cart: true, addresses: true },
    });
    if (!checkout) throw new NotFoundException("checkout not found");
    if (checkout.customerId && checkout.customerId !== customerId) {
      throw new ForbiddenException("not your checkout");
    }

    const { providers } = await this.getAvailablePaymentProviders(
      req,
      checkoutId
    );
    if (!providers.find((p) => p.provider === dto.provider)) {
      throw new ForbiddenException("payment provider not available");
    }

    const payment = await this.prisma.orderPayment.create({
      data: {
        tenantId,
        checkoutId: checkout.id,
        provider: dto.provider,
        status: PaymentStatus.PENDING,
        amount: checkout.grandTotal,
        totalAmount: checkout.grandTotal,
        currencyCode: checkout.currencyCode,
        metadata: {
          returnUrl: dto.returnUrl ?? null,
          cancelUrl: dto.cancelUrl ?? null,
          locale: dto.locale ?? null,
        },
      },
    });

    return { payment };
  }
}
