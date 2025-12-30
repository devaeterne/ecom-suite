import { Injectable } from "@nestjs/common";
import { readFileSync, statSync } from "node:fs";
import { z } from "zod";

const TenantConfigSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  isActive: z.boolean().optional().default(true),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  bootstrapAdmin: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().optional(),
  }),
});

export type TenantConfig = z.infer<typeof TenantConfigSchema>;

@Injectable()
export class TenantConfigService {
  getConfig(): TenantConfig {
    const path =
      process.env.TENANT_CONFIG_PATH ?? "/app/src/config/tenant.json";

    const st = statSync(path);
    if (st.isDirectory()) {
      throw new Error(
        `TENANT_CONFIG_PATH points to a directory, expected a file: ${path}`
      );
    }

    const raw = readFileSync(path, "utf-8");
    const json = JSON.parse(raw);
    return TenantConfigSchema.parse(json);
  }
}
