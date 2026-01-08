import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { MinioS3Client } from "@/modules/files/common/minio/s3.client";
import { FilesRepo } from "@/modules/files/common/prisma/files.repo";

@Module({
  imports: [PrismaModule],
  providers: [MinioS3Client, FilesRepo],
  exports: [MinioS3Client, FilesRepo],
})
export class FilesCommonModule {}
