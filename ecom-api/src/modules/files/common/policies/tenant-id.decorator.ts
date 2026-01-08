import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from "@nestjs/common";

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req: any = ctx.switchToHttp().getRequest();

    // 1) En güvenilir kaynak: header
    const headerTenantId =
      req?.headers?.["x-tenant-id"] ??
      req?.headers?.["X-Tenant-Id"] ??
      req?.raw?.headers?.["x-tenant-id"]; // bazı adapter'larda raw üzerinden

    // 2) Uygulama içi cache alanları (varsa)
    const tenantId =
      headerTenantId ??
      req?.tenant?.id ??
      req?.tenantId ??
      req?.context?.tenant?.id ??
      req?.auth?.tenantId;

    if (!tenantId) {
      // 500 değil 400 daha doğru: client tenant context göndermemiş / pipeline set etmemiş
      throw new BadRequestException(
        "TenantId missing. Send header: x-tenant-id"
      );
    }

    return String(tenantId);
  }
);
