import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { FileStatus } from "@prisma/client";
import { FILES } from "@/modules/files/common/constants/files.constants";
import { MinioS3Client } from "@/modules/files/common/minio/s3.client";
import { FilesRepo } from "@/modules/files/common/prisma/files.repo";
import type { CreatePresignedUploadDto } from "@/modules/files/admin/dto/files.presing.dto";
import type { CreateFileLinkDto } from "@/modules/files/admin/dto/files.link.dto";

@Injectable()
export class FilesAdminService {
  constructor(
    private readonly minio: MinioS3Client,
    private readonly repo: FilesRepo
  ) {}

  private safeName(name: string) {
    return (name ?? "").replace(/[^\w.\-]/g, "_");
  }

  private buildObjectKey(params: {
    tenantId: string;
    filename: string;
    fileId: string;
    folder?: string;
  }) {
    const safe = this.safeName(params.filename);
    const folder = params.folder ? this.safeName(params.folder) : "uploads";
    return `tenants/${params.tenantId}/${folder}/${params.fileId}-${safe}`;
  }

  async createPresignedUpload(tenantId: string, dto: CreatePresignedUploadDto) {
    if (!tenantId) throw new BadRequestException("tenantId is required");
    if (!dto?.filename) throw new BadRequestException("filename is required");
    if (!dto?.contentType)
      throw new BadRequestException("contentType is required");
    if (typeof dto?.size !== "number" || dto.size <= 0)
      throw new BadRequestException("size must be a positive number");

    const fileId = randomUUID();
    const bucket = this.minio.bucket;
    const key = this.buildObjectKey({
      tenantId,
      filename: dto.filename,
      fileId,
      folder: dto.folder,
    });

    // 1) Upload intent kaydı (id=fileId kritik)
    await this.repo.createFileObject({
      id: fileId,
      tenantId,
      bucket,
      key,
      filename: dto.filename,
      mimeType: dto.contentType,
      size: dto.size,
      status: FileStatus.UPLOADING,
      metadata: {
        storage: { driver: "minio", bucket, key },
        original: { filename: dto.filename, contentType: dto.contentType },
        intent: { createdAt: new Date().toISOString() },
      },
    });

    // 2) Presigned PUT URL (PUBLIC client ile!)
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: dto.contentType,
    });

    const putUrl = await getSignedUrl(this.minio.presignS3, cmd, {
      expiresIn: FILES.PRESIGN_PUT_EXPIRES_SEC,
    });

    const expiresAt = new Date(
      Date.now() + FILES.PRESIGN_PUT_EXPIRES_SEC * 1000
    ).toISOString();

    return { fileId, bucket, key, putUrl, expiresAt };
  }

  async completeUpload(tenantId: string, fileId: string) {
    if (!tenantId) throw new BadRequestException("tenantId is required");
    if (!fileId) throw new BadRequestException("fileId is required");

    const fo = await this.repo.getFileObjectById(tenantId, fileId);
    if (!fo) throw new NotFoundException("File not found");

    const bucket = fo.bucket;
    const key = fo.key;
    if (!bucket || !key)
      throw new BadRequestException("File storage bucket/key missing");

    try {
      // ✅ server-side doğrulama her zaman INTERNAL client ile (minio:9000)
      const head = await this.minio.s3.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key })
      );

      const size = head.ContentLength ?? fo.size ?? null;
      const mimeType = head.ContentType ?? fo.mimeType ?? null;
      const checksum = head.ETag ? String(head.ETag).replaceAll('"', "") : null;

      await this.repo.markReady({
        tenantId,
        fileId,
        size,
        mimeType,
        checksum,
        url: fo.url ?? null,
      });

      return {
        ok: true,
        fileId,
        bucket,
        key,
        size,
        mimeType,
        checksum,
        status: FileStatus.READY,
      };
    } catch (e: any) {
      // burada artık "127.0.0.1:9000" düşmemeli.
      await this.repo.markFailed(tenantId, fileId, e?.message ?? "head_failed");
      throw new BadRequestException(
        "Upload not found in storage (complete failed)"
      );
    }
  }

  async presignedDownload(tenantId: string, fileId: string) {
    if (!tenantId) throw new BadRequestException("tenantId is required");
    if (!fileId) throw new BadRequestException("fileId is required");

    const fo = await this.repo.getFileObjectById(tenantId, fileId);
    if (!fo) throw new NotFoundException("File not found");

    const bucket = fo.bucket;
    const key = fo.key;
    if (!bucket || !key)
      throw new BadRequestException("File storage key missing");

    // ✅ presigned GET => PUBLIC client ile URL üret
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(this.minio.presignS3, cmd, {
      expiresIn: FILES.PRESIGN_GET_EXPIRES_SEC,
    });

    const expiresAt = new Date(
      Date.now() + FILES.PRESIGN_GET_EXPIRES_SEC * 1000
    ).toISOString();

    return { fileId, url, expiresAt };
  }

  async linkFile(tenantId: string, fileId: string, dto: CreateFileLinkDto) {
    if (!tenantId) throw new BadRequestException("tenantId is required");
    if (!fileId) throw new BadRequestException("fileId is required");

    const fo = await this.repo.getFileObjectById(tenantId, fileId);
    if (!fo) throw new NotFoundException("File not found");

    if (fo.status !== FileStatus.READY) {
      throw new BadRequestException(`File is not READY (status=${fo.status})`);
    }

    const row = await this.repo.createLink({
      tenantId,
      fileId,
      entityType: dto.entityType,
      entityId: dto.entityId,
      role: dto.role,
      sort: dto.sort ?? 0,
      metadata: {},
    });

    return { ok: true, link: row };
  }

  async getFileMeta(tenantId: string, fileId: string) {
    if (!tenantId) throw new BadRequestException("tenantId is required");
    if (!fileId) throw new BadRequestException("fileId is required");

    const fo = await this.repo.getFileObjectById(tenantId, fileId);
    if (!fo) throw new NotFoundException("File not found");

    return {
      id: fo.id,
      bucket: fo.bucket,
      key: fo.key,
      url: fo.url ?? null,
      mimeType: fo.mimeType ?? null,
      size: fo.size ?? null,
      checksum: fo.checksum ?? null,
      filename: fo.filename ?? null,
      title: fo.title ?? null,
      altText: fo.altText ?? null,
      status: fo.status ?? null,
      createdAt: fo.createdAt,
      updatedAt: fo.updatedAt,
    };
  }

  async listLinksByFile(tenantId: string, fileId: string) {
    if (!tenantId) throw new BadRequestException("tenantId is required");
    if (!fileId) throw new BadRequestException("fileId is required");

    const fo = await this.repo.getFileObjectById(tenantId, fileId);
    if (!fo) throw new NotFoundException("File not found");

    const links = await this.repo.listLinksByFile(tenantId, fileId);
    return { items: links };
  }

  async listLinksByEntity(tenantId: string, entityType: any, entityId: string) {
    if (!tenantId) throw new BadRequestException("tenantId is required");
    if (!entityType) throw new BadRequestException("entityType is required");
    if (!entityId) throw new BadRequestException("entityId is required");

    const links = await this.repo.listLinksByEntity(
      tenantId,
      entityType,
      entityId
    );
    return { items: links };
  }
}
