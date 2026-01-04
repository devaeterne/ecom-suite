// src/modules/checkout/common/policies/checkout.ownership.ts
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CHECKOUT_ERRORS } from "@/modules/checkout/common/constants/checkout.constants";

/**
 * Checkout ownership: checkout.customerId varsa sub ile eşleşmeli.
 * guest checkout senaryosu ileride gelecekse bu policy genişletilir.
 */
export async function assertCheckoutOwnedByCustomer(
  prisma: PrismaService,
  args: { tenantId: string; checkoutId: string; customerId: string }
) {
  const checkout = await prisma.checkout.findFirst({
    where: { tenantId: args.tenantId, id: args.checkoutId, deletedAt: null },
    select: { id: true, customerId: true },
  });

  if (!checkout)
    throw new NotFoundException(CHECKOUT_ERRORS.CHECKOUT_NOT_FOUND);
  if (checkout.customerId && checkout.customerId !== args.customerId) {
    throw new ForbiddenException(CHECKOUT_ERRORS.FORBIDDEN);
  }

  return checkout;
}
