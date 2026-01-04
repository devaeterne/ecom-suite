import { ForbiddenException } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

export async function assertOrderOwnedByCustomer(
  prisma: PrismaClient,
  {
    tenantId,
    orderId,
    customerId,
  }: {
    tenantId: string;
    orderId: string;
    customerId: string;
  }
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    select: { customerId: true },
  });

  if (!order || order.customerId !== customerId) {
    throw new ForbiddenException("not your order");
  }
}
