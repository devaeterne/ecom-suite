import { Module } from "@nestjs/common";
import { FilesCommonModule } from "@/modules/files/common/files-common.module";
import { FilesAdminController } from "@/modules/files/admin/controllers/files.admin.controller";
import { FilesAdminService } from "@/modules/files/admin/services/files.admin.service";

@Module({
  imports: [FilesCommonModule],
  controllers: [FilesAdminController],
  providers: [FilesAdminService],
  exports: [],
})
export class FilesModule {}
