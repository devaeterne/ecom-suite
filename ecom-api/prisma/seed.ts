import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.product.upsert({
    where: { sku: "SKU-001" },
    update: {},
    create: {
      sku: "SKU-001",
      title: "Demo Product",
      price: 1999,
      currency: "EUR",
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
