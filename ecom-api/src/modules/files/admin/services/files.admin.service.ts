import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

import { FILES } from "@/modules/files/common/constants/files.constants";
import { MinioS3Client } from "@/modules/files/common/minio/s3.client";
import { FilesRepo } from "@/modules/files/common/prisma/files.repo";
import type {
  CreatePresignedUploadInput,
  PresignedGetResult,
  PresignedPutResult,
} from "@/modules/files/common/types/files.types";

@Injectable()
export class FilesAdminService {
  constructor(
    private readonly minio: MinioS3Client,
    private readonly repo: FilesRepo
  ) {}

  private buildObjectKey(params: {
    tenantId: string;
    filename: string;
    fileId: string;
  }) {
    const safeName = params.filename.replace(/[^\w.\-]/g, "_");
    return `tenants/${params.tenantId}/uploads/${params.fileId}-${safeName}`;
  }

  async createPresignedUpload(
    input: CreatePresignedUploadInput
  ): Promise<PresignedPutResult> {
    const fileId = randomUUID();
    const bucket = this.minio.bucket;
    const key = this.buildObjectKey({
      tenantId: input.tenantId,
      filename: input.filename,
      fileId,
    });

    // ✅ DB kaydı: bucket/key kolonları + metadata (opsiyonel)
    await this.repo.createFileObject({
      id: fileId,
      tenantId: input.tenantId,
      bucket,
      key,
      filename: input.filename,
      mimeType: input.contentType,
      size: input.size,
      metadata: {
        storage: { driver: "minio", bucket, key },
        original: { filename: input.filename },
      },
    });

    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: input.contentType,
    });

    const putUrl = await getSignedUrl(this.minio.s3, cmd, {
      expiresIn: FILES.PRESIGN_PUT_EXPIRES_SEC,
    });

    const expiresAt = new Date(
      Date.now() + FILES.PRESIGN_PUT_EXPIRES_SEC * 1000
    ).toISOString();

    return { fileId, bucket, key, putUrl, expiresAt };
  }

  async getPresignedDownload(
    tenantId: string,
    fileId: string
  ): Promise<PresignedGetResult> {
    const fo = await this.repo.getFileObjectById(tenantId, fileId);
    if (!fo) throw new NotFoundException("File not found");

    // ✅ Öncelik: kolonlar. Fallback: metadata.storage
    const bucket =
      (fo.bucket as string | null) ??
      (fo.metadata as any)?.storage?.bucket ??
      this.minio.bucket;

    const key =
      (fo.key as string | null) ?? (fo.metadata as any)?.storage?.key ?? null;

    if (!key) throw new NotFoundException("File storage key missing");

    const cmd = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await getSignedUrl(this.minio.s3, cmd, {
      expiresIn: FILES.PRESIGN_GET_EXPIRES_SEC,
    });

    const expiresAt = new Date(
      Date.now() + FILES.PRESIGN_GET_EXPIRES_SEC * 1000
    ).toISOString();

    return { fileId, url, expiresAt };
  }

  async getFileMeta(tenantId: string, fileId: string) {
    const fo = await this.repo.getFileObjectById(tenantId, fileId);
    if (!fo) throw new NotFoundException("File not found");

    const bucket =
      (fo.bucket as string | null) ??
      (fo.metadata as any)?.storage?.bucket ??
      this.minio.bucket;

    const key =
      (fo.key as string | null) ?? (fo.metadata as any)?.storage?.key ?? null;

    return {
      id: fo.id,
      tenantId: fo.tenantId,
      bucket,
      key,
      mimeType: fo.mimeType ?? null,
      size: fo.size ?? null,
      metadata: fo.metadata ?? {},
      createdAt: fo.createdAt,
    };
  }
}
