import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { FilesAdminService } from "@/modules/files/admin/services/files.admin.service";
import { CreatePresignedUploadDto } from "@/modules/files/admin/dto/files.presing.dto";
import { CreateFileLinkDto } from "@/modules/files/admin/dto/files.link.dto";
import { TenantId } from "@/modules/files/common/policies/tenant-id.decorator";

@Controller("admin/files")
export class FilesAdminController {
  constructor(private readonly service: FilesAdminService) {}

  @Post("presign-put")
  presignPut(
    @TenantId() tenantId: string,
    @Body() dto: CreatePresignedUploadDto
  ) {
    return this.service.createPresignedUpload(tenantId, dto);
  }

  @Post(":fileId/complete")
  complete(@TenantId() tenantId: string, @Param("fileId") fileId: string) {
    return this.service.completeUpload(tenantId, fileId);
  }

  @Get(":fileId/presign-get")
  presignGet(@TenantId() tenantId: string, @Param("fileId") fileId: string) {
    return this.service.presignedDownload(tenantId, fileId);
  }

  @Get(":fileId")
  meta(@TenantId() tenantId: string, @Param("fileId") fileId: string) {
    return this.service.getFileMeta(tenantId, fileId);
  }

  @Post(":fileId/link")
  link(
    @TenantId() tenantId: string,
    @Param("fileId") fileId: string,
    @Body() dto: CreateFileLinkDto
  ) {
    return this.service.linkFile(tenantId, fileId, dto);
  }

  @Get(":fileId/links")
  links(@TenantId() tenantId: string, @Param("fileId") fileId: string) {
    return this.service.listLinksByFile(tenantId, fileId);
  }

  @Get("entity/:entityType/:entityId")
  entityFiles(
    @TenantId() tenantId: string,
    @Param("entityType") entityType: string,
    @Param("entityId") entityId: string
  ) {
    return this.service.listLinksByEntity(tenantId, entityType, entityId);
  }
}
