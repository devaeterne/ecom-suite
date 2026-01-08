import { Injectable } from "@nestjs/common";
import { Prisma, FileStatus } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class FilesRepo {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * File intent / metadata kaydı.
   * Not: select kullanmıyoruz -> tip uyuşmazlığı riskini sıfırlar.
   */
  createFileObject(input: {
    id?: string; // ✅ eklendi (service fileId’yi buraya basacak)
    tenantId: string;
    bucket: string;
    key: string;
    url?: string | null;
    mimeType?: string | null;
    size?: number | null;
    checksum?: string | null;
    width?: number | null;
    height?: number | null;
    filename?: string | null;
    title?: string | null;
    altText?: string | null;
    metadata?: Prisma.InputJsonValue;
    status?: FileStatus;
  }) {
    return this.prisma.fileObject.create({
      data: {
        ...(input.id ? { id: input.id } : {}), // ✅ id override
        tenantId: input.tenantId,
        bucket: input.bucket,
        key: input.key,
        url: input.url ?? null,
        mimeType: input.mimeType ?? null,
        size: input.size ?? null,
        checksum: input.checksum ?? null,
        width: input.width ?? null,
        height: input.height ?? null,
        filename: input.filename ?? null,
        title: input.title ?? null,
        altText: input.altText ?? null,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        status: input.status ?? FileStatus.UPLOADING,
      },
    });
  }

  /**
   * @@unique([tenantId, id]) -> where: { tenantId_id: { tenantId, id } }
   */
  getFileObjectById(tenantId: string, fileId: string) {
    return this.prisma.fileObject.findUnique({
      where: {
        tenantId_id: { tenantId, id: fileId },
      },
    });
  }

  /**
   * @@unique([tenantId, bucket, key]) -> where: { tenantId_bucket_key: { ... } }
   * (Prisma bu compound unique adını alan isimlerinden üretir.)
   */
  getFileObjectByBucketKey(tenantId: string, bucket: string, key: string) {
    return this.prisma.fileObject.findUnique({
      where: {
        tenantId_bucket_key: { tenantId, bucket, key },
      },
    });
  }

  /**
   * READY'ye çek + storage metadata update.
   */
  async markReady(params: {
    tenantId: string;
    fileId: string;
    size?: number | null;
    mimeType?: string | null;
    checksum?: string | null;
    url?: string | null;
    width?: number | null;
    height?: number | null;
  }) {
    return this.prisma.fileObject.update({
      where: { tenantId_id: { tenantId: params.tenantId, id: params.fileId } },
      data: {
        status: FileStatus.READY,
        size: params.size ?? undefined,
        mimeType: params.mimeType ?? undefined,
        checksum: params.checksum ?? undefined,
        url: params.url ?? undefined,
        width: params.width ?? undefined,
        height: params.height ?? undefined,
      },
    });
  }

  /**
   * FAILED'e çek + metadata içine hata yaz.
   */
  async markFailed(tenantId: string, fileId: string, reason: string) {
    const existing = await this.getFileObjectById(tenantId, fileId);
    const meta = (existing?.metadata ?? {}) as any;

    return this.prisma.fileObject.update({
      where: { tenantId_id: { tenantId, id: fileId } },
      data: {
        status: FileStatus.FAILED,
        metadata: {
          ...meta,
          error: { message: reason, at: new Date().toISOString() },
        } as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Soft delete (deletedAt set) + status=DELETED.
   */
  async softDelete(tenantId: string, fileId: string) {
    return this.prisma.fileObject.update({
      where: { tenantId_id: { tenantId, id: fileId } },
      data: {
        status: FileStatus.DELETED,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * FileLink create
   * entityType / role sende enum olabilir: dto’dan direkt gelir.
   */
  createLink(input: {
    tenantId: string;
    fileId: string;
    entityType: any;
    entityId: string;
    role: any;
    sort?: number;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.fileLink.create({
      data: {
        tenantId: input.tenantId,
        fileId: input.fileId,
        entityType: input.entityType,
        entityId: input.entityId,
        role: input.role,
        sort: input.sort ?? 0,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  listLinksByFile(tenantId: string, fileId: string) {
    return this.prisma.fileLink.findMany({
      where: { tenantId, fileId },
      orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
    });
  }

  listLinksByEntity(tenantId: string, entityType: any, entityId: string) {
    return this.prisma.fileLink.findMany({
      where: { tenantId, entityType, entityId },
      orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
    });
  }
}
