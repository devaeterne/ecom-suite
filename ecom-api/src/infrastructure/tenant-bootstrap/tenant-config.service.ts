import { Injectable } from "@nestjs/common";
import { readFileSync, statSync, existsSync } from "node:fs";
import { resolve } from "node:path";
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

// Tek config veya config listesi kabul edelim (ileriye dönük)
const TenantConfigFileSchema = z.union([
  TenantConfigSchema,
  z.array(TenantConfigSchema).min(1),
]);

export type TenantConfig = z.infer<typeof TenantConfigSchema>;

function pickFirst(cfg: z.infer<typeof TenantConfigFileSchema>): TenantConfig {
  return Array.isArray(cfg) ? cfg[0] : cfg;
}

function findDefaultConfigPath(): string {
  const candidates = [
    process.env.TENANT_CONFIG_PATH,
    resolve(process.cwd(), "src/config/tenant.json"),
    resolve(process.cwd(), "dist/config/tenant.json"),
    "/app/src/config/tenant.json",
    "/app/dist/config/tenant.json",
  ].filter(Boolean) as string[];

  const hit = candidates.find((p) => existsSync(p));
  return hit ?? process.env.TENANT_CONFIG_PATH ?? "/app/src/config/tenant.json";
}

@Injectable()
export class TenantConfigService {
  getConfig(): TenantConfig {
    const path = findDefaultConfigPath();

    const st = statSync(path);
    if (st.isDirectory()) {
      throw new Error(
        `TENANT_CONFIG_PATH points to a directory, expected a file: ${path}`
      );
    }

    const raw = readFileSync(path, "utf-8");
    const json = JSON.parse(raw);

    const parsed = TenantConfigFileSchema.parse(json);
    return pickFirst(parsed);
  }
}
