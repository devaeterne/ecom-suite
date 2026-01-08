import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

type CreateFileObjectInput = {
  id: string;
  tenantId: string;
  bucket: string;
  key: string;
  filename: string;
  mimeType: string;
  size: number;
  metadata: any;
};

@Injectable()
export class FilesRepo {
  constructor(private readonly prisma: PrismaService) {}

  async createFileObject(data: CreateFileObjectInput) {
    // Şema: FileObject içinde key zorunlu. Bucket da sende varsa kolon olabilir.
    // Biz hem kolonlara yazıyoruz hem metadata’ya koyuyoruz.
    return this.prisma.fileObject.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,

        // ✅ kritik kolonlar
        key: data.key,
        bucket: data.bucket,

        // ✅ mevcut şemana uygun alanlar
        mimeType: data.mimeType,
        size: data.size,
        url: null,

        // ekstra
        metadata: data.metadata ?? {},
      },
    });
  }

  async getFileObjectById(tenantId: string, id: string) {
    return this.prisma.fileObject.findFirst({
      where: {
        tenantId,
        id,
        deletedAt: null,
      },
    });
  }
}
