import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/config/env";

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket = env.MINIO_BUCKET;

  private readonly s3 = new S3Client({
    region: "us-east-1",
    endpoint: `${env.MINIO_USE_SSL ? "https" : "http"}://${
      env.MINIO_ENDPOINT
    }:${env.MINIO_PORT}`,
    forcePathStyle: true,
    credentials: {
      // .env: MINIO_ROOT_USER / MINIO_ROOT_PASSWORD
      accessKeyId: env.MINIO_ROOT_USER,
      secretAccessKey: env.MINIO_ROOT_PASSWORD,
    },
  });

  async onModuleInit() {
    if (process.env.STORAGE_ENABLED === "false") {
      this.logger.warn(
        "Storage disabled (STORAGE_ENABLED=false). Skipping bucket ensure."
      );
      return;
    }
    await this.ensureBucket();
  }

  /**
   * Uygulama açılışında: bucket yoksa oluştur.
   */
  async ensureBucket(): Promise<void> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      this.logger.warn(`Bucket '${this.bucket}' not found. Creating...`);
      await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket '${this.bucket}' created.`);
    }
  }

  /**
   * API üzerinden upload: buffer + contentType ile put.
   */
  async putObject(params: {
    key: string;
    body: Buffer;
    contentType: string;
    cacheControl?: string;
    metadata?: Record<string, string>;
  }): Promise<{ key: string }> {
    const { key, body, contentType, cacheControl, metadata } = params;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: cacheControl,
        Metadata: metadata,
      })
    );

    return { key };
  }

  /**
   * Admin görüntüleme için presigned GET.
   */
  async getPresignedGetUrl(params: {
    key: string;
    expiresInSeconds?: number;
  }): Promise<string> {
    const { key, expiresInSeconds = 120 } = params;

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }
}
