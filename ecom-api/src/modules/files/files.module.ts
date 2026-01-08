import { Module } from "@nestjs/common";
import { FilesCommonModule } from "@/modules/files/common/files-common.module";
import { FilesAdminController } from "@/modules/files/admin/controllers/files.admin.controller";
import { FilesAdminService } from "@/modules/files/admin/services/files.admin.service";
import { MinioS3Client } from "./common/minio/s3.client";
import { FilesRepo } from "./common/prisma/files.repo";

@Module({
  imports: [FilesCommonModule],
  controllers: [FilesAdminController],
  providers: [FilesAdminService, MinioS3Client, FilesRepo],
  exports: [],
})
export class FilesModule {}
