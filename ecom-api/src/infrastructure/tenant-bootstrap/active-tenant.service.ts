import { Injectable } from "@nestjs/common";

@Injectable()
export class ActiveTenantService {
  private tenantId: string | null = null;

  setTenantId(id: string) {
    this.tenantId = id;
  }

  getTenantId(): string {
    if (!this.tenantId) {
      throw new Error("Active tenant not initialized yet.");
    }
    return this.tenantId;
  }
}
