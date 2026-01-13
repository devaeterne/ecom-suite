import { Injectable } from "@nestjs/common";
import { S3Client } from "@aws-sdk/client-s3";

function requireEnv(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`[files] Missing env: ${name}`);
  return v;
}

function baseClient(endpoint: string) {
  if (!endpoint) {
    throw new Error(
      "S3 endpoint missing. Set S3_ENDPOINT_INTERNAL / S3_ENDPOINT_PUBLIC (or legacy S3_ENDPOINT)."
    );
  }

  const region = process.env.S3_REGION ?? "us-east-1";

  const accessKeyId =
    process.env.AWS_ACCESS_KEY_ID ?? process.env.MINIO_ROOT_USER;
  const secretAccessKey =
    process.env.AWS_SECRET_ACCESS_KEY ?? process.env.MINIO_ROOT_PASSWORD;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "[files] S3 credentials missing. Set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY (or MINIO_ROOT_USER/MINIO_ROOT_PASSWORD)."
    );
  }

  return new S3Client({
    region,
    endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function createInternalS3Client() {
  const endpoint = process.env.S3_ENDPOINT_INTERNAL ?? process.env.S3_ENDPOINT;
  return baseClient(requireEnv("S3_ENDPOINT_INTERNAL", endpoint));
}

export function createPublicS3Client() {
  const endpoint = process.env.S3_ENDPOINT_PUBLIC ?? process.env.S3_ENDPOINT;
  return baseClient(requireEnv("S3_ENDPOINT_PUBLIC", endpoint));
}

@Injectable()
export class MinioS3Client {
  readonly bucket: string;
  readonly s3: S3Client;
  readonly presignS3: S3Client;

  constructor() {
    this.bucket = process.env.S3_BUCKET ?? process.env.MINIO_BUCKET ?? "ecom";
    this.s3 = createInternalS3Client(); // server-side HeadObject
    this.presignS3 = createPublicS3Client(); // presigned URL generation
  }
}
