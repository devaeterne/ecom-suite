import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { AdminCreateFileDto } from "@/modules/files/admin/dto/admin-files.dto";
import { FilesAdminService } from "@/modules/files/admin/services/files.admin.service";

function requireTenantId(req: any): string {
  const tenantId = req?.tenant?.id ?? req?.tenantId ?? req?.user?.tenantId;

  if (!tenantId || typeof tenantId !== "string") {
    throw new BadRequestException("Tenant context missing");
  }
  return tenantId;
}

@Controller("/admin")
@UseGuards(AdminAuthGuard)
export class FilesAdminController {
  constructor(private readonly service: FilesAdminService) {}

  /**
   * POST /api/admin/files
   * body: { filename, contentType, size }
   * returns: { fileId, bucket, key, putUrl, expiresAt }
   */
  @Post("/files")
  async createPresignedPut(
    @Req() req: Request,
    @Body() dto: AdminCreateFileDto
  ) {
    const tenantId = requireTenantId(req as any);
    return this.service.createPresignedUpload({
      tenantId,
      filename: dto.filename,
      contentType: dto.contentType,
      size: dto.size,
    });
  }

  /**
   * GET /api/admin/files/:id
   * meta
   */
  @Get("/files/:id")
  async getMeta(@Req() req: Request, @Param("id") id: string) {
    const tenantId = requireTenantId(req as any);
    return this.service.getFileMeta(tenantId, id);
  }

  /**
   * GET /api/admin/files/:id/url
   * returns: { fileId, url, expiresAt }
   */
  @Get("/files/:id/url")
  async getPresignedGet(@Req() req: Request, @Param("id") id: string) {
    const tenantId = requireTenantId(req as any);
    return this.service.getPresignedDownload(tenantId, id);
  }
}
