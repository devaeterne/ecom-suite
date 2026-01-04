import { Injectable } from "@nestjs/common";

export type ActiveTenant = {
  id: string;
  code?: string;
};

@Injectable()
export class ActiveTenantService {
  private tenant: ActiveTenant | null = null;

  setTenantId(id: string) {
    this.tenant = { ...(this.tenant ?? {}), id } as ActiveTenant;
  }

  setTenant(tenant: ActiveTenant) {
    this.tenant = tenant;
  }

  getTenantId(): string {
    if (!this.tenant?.id) {
      throw new Error("Active tenant not initialized yet.");
    }
    return this.tenant.id;
  }

  getTenant(): ActiveTenant {
    if (!this.tenant?.id) {
      throw new Error("Active tenant not initialized yet.");
    }
    return this.tenant;
  }
}
