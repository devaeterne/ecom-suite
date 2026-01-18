import { ApiHeader } from "@nestjs/swagger";

export const ApiTenantHeader = () =>
  ApiHeader({
    name: "x-tenant-id",
    required: true,
    description:
      "Tenant scope header. UUID (tenantId) or tenant code (e.g. 'acme'). Required by TenantHeaderGuard.",
    schema: {
      type: "string",
      example: "acme",
    },
  });
