// src/modules/store/customers/dto/upsert-address.dto.ts
import { z } from "zod";

/**
 * API contract (frontend / e2e) alanları:
 * - title, address1, address2, zip, district
 *
 * Prisma model alanları:
 * - label, line1, line2, postalCode, province, countryIso2
 *
 * Bu DTO her ikisini de kabul eder.
 */
export const UpsertAddressSchema = z
  .object({
    // UI contract
    title: z.string().min(1).optional(),
    address1: z.string().min(1).optional(),
    address2: z.string().optional(),
    zip: z.string().optional(),
    district: z.string().min(1).optional(),

    // Prisma-native aliases (opsiyonel)
    label: z.string().min(1).optional(),
    line1: z.string().min(1).optional(),
    line2: z.string().optional(),
    postalCode: z.string().optional(),
    province: z.string().min(1).optional(),

    // ortak alanlar
    fullName: z.string().min(1),
    phone: z.string().min(3),
    city: z.string().min(1),
    countryIso2: z.string().min(2),

    isDefault: z.boolean().optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    // line1 zorunlu: ya address1 ya line1 gelmeli
    const hasLine1 = !!(val.address1 ?? val.line1);
    if (!hasLine1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address1"],
        message: "address1 (or line1) is required",
      });
    }

    // title opsiyonel ama label’a map edilecek: ikisi de yoksa ok (label nullable)
    // zip/postalCode opsiyonel zaten
  });

export type UpsertAddressDto = z.infer<typeof UpsertAddressSchema>;

/**
 * Prisma create/update input’a maplemek için yardımcı.
 * Serviste bunu kullanırsan TS2322 gibi tip hataları biter.
 */
export function mapUpsertAddressToPrisma(dto: UpsertAddressDto) {
  return {
    label: dto.label ?? dto.title ?? null,
    fullName: dto.fullName ?? null,
    phone: dto.phone ?? null,
    line1: dto.line1 ?? dto.address1!, // superRefine garanti ediyor
    line2: dto.line2 ?? dto.address2 ?? null,
    city: dto.city,
    province: dto.province ?? dto.district ?? null,
    postalCode: dto.postalCode ?? dto.zip ?? null,
    countryIso2: dto.countryIso2,
    isDefault: dto.isDefault ?? false,
  };
}
