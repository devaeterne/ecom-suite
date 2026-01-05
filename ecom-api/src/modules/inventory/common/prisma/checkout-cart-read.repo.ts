import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class CheckoutCartReadRepo {
  constructor(private readonly prisma: PrismaService) {}

  async getCheckoutOrThrow(tenantId: string, checkoutId: string) {
    const checkout = await this.prisma.checkout.findFirst({
      where: { tenantId, id: checkoutId, deletedAt: null },
      select: { id: true, tenantId: true, cartId: true, status: true },
    });
    if (!checkout) throw new NotFoundException("CHECKOUT_NOT_FOUND");
    return checkout;
  }

  async getCartLineItems(tenantId: string, cartId: string) {
    return this.prisma.cartLineItem.findMany({
      where: { tenantId, cartId }, // ✅ deletedAt yok
      select: { id: true, variantId: true, quantity: true },
      orderBy: { createdAt: "asc" },
    });
  }
}
