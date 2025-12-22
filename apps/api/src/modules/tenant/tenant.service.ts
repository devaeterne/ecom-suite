import fs from "node:fs";
import path from "node:path";
import { Injectable } from "@nestjs/common";

type TenantPublic = {
  name: string;
  locale?: string;
  currency?: string;
  branding?: { logoUrl?: string; primaryColor?: string };
  modules?: {
    verifone?: boolean;
    cod_cash?: boolean;
    shipping_manual?: boolean;
  };
};

@Injectable()
export class TenantService {
  private cached: any | null = null;

  private loadTenant(): any {
    if (this.cached) return this.cached;

    const p =
      process.env.TENANT_CONFIG_PATH ||
      path.resolve(process.cwd(), "deploy/tenant.json");
    const raw = fs.readFileSync(p, "utf-8");
    this.cached = JSON.parse(raw);
    return this.cached;
  }

  getPublicTenant(): TenantPublic {
    const t = this.loadTenant();
    return {
      name: t.name,
      locale: t.locale,
      currency: t.currency,
      branding: t.branding,
      modules: t.modules,
    };
  }
}
