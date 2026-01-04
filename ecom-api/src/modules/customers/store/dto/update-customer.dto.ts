// src/modules/store/customers/dto/update-customer.dto.ts
import { z } from "zod";

export const UpdateCustomerSchema = z
  .object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().min(3).optional(),
  })
  .strict();

export type UpdateCustomerDto = z.infer<typeof UpdateCustomerSchema>;
