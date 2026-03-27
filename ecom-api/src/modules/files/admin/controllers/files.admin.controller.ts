// src/modules/files/admin/controllers/files.admin.controller.ts
import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ParseUUIDPipe } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";

import { FilesAdminService } from "@/modules/files/admin/services/files.admin.service";
import { CreatePresignedUploadDto } from "@/modules/files/admin/dto/files.presing.dto";
import { CreateFileLinkDto } from "@/modules/files/admin/dto/files.link.dto";

import { TenantId } from "@/modules/files/common/policies/tenant-id.decorator";
import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { TenantGuard } from "@/modules/catalog/common/tenant/tenant.guard";

const UUID4 = new ParseUUIDPipe({ version: "4" });

@ApiTags("Admin Files")
@ApiCookieAuth("adminAccessCookie")
@Controller("admin/files")
@UseGuards(AdminAuthGuard, TenantGuard)
export class FilesAdminController {
  constructor(private readonly service: FilesAdminService) {}

  @Get("entity/:entityType/:entityId")
  entityFiles(
    @TenantId() tenantId: string,
    @Param("entityType") entityType: string,
    @Param("entityId", UUID4) entityId: string,
  ) {
    return this.service.listLinksByEntity(tenantId, entityType, entityId);
  }

  @Post("presign-put")
  presignPut(
    @TenantId() tenantId: string,
    @Body() dto: CreatePresignedUploadDto,
  ) {
    return this.service.createPresignedUpload(tenantId, dto);
  }

  @Post(":fileId/complete")
  complete(
    @TenantId() tenantId: string,
    @Param("fileId", UUID4) fileId: string,
  ) {
    return this.service.completeUpload(tenantId, fileId);
  }

  @Get(":fileId/presign-get")
  presignGet(
    @TenantId() tenantId: string,
    @Param("fileId", UUID4) fileId: string,
  ) {
    return this.service.presignedDownload(tenantId, fileId);
  }

  @Get(":fileId")
  meta(@TenantId() tenantId: string, @Param("fileId", UUID4) fileId: string) {
    return this.service.getFileMeta(tenantId, fileId);
  }

  @Post(":fileId/link")
  link(
    @TenantId() tenantId: string,
    @Param("fileId", UUID4) fileId: string,
    @Body() dto: CreateFileLinkDto,
  ) {
    return this.service.linkFile(tenantId, fileId, dto);
  }

  @Get(":fileId/links")
  links(@TenantId() tenantId: string, @Param("fileId", UUID4) fileId: string) {
    return this.service.listLinksByFile(tenantId, fileId);
  }
}
