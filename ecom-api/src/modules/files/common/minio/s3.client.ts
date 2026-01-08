import { Injectable } from "@nestjs/common";
import { S3Client } from "@aws-sdk/client-s3";

function baseClient(endpoint: string) {
  if (!endpoint) {
    throw new Error(
      "S3 endpoint missing. Set S3_ENDPOINT_INTERNAL / S3_ENDPOINT_PUBLIC (or legacy S3_ENDPOINT)."
    );
  }

  return new S3Client({
    region: process.env.S3_REGION!,
    endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export function createInternalS3Client() {
  const endpoint = process.env.S3_ENDPOINT_INTERNAL ?? process.env.S3_ENDPOINT;
  return baseClient(endpoint!);
}

export function createPublicS3Client() {
  const endpoint = process.env.S3_ENDPOINT_PUBLIC ?? process.env.S3_ENDPOINT;
  return baseClient(endpoint!);
}

@Injectable()
export class MinioS3Client {
  readonly bucket: string;
  readonly s3: S3Client;
  readonly presignS3: S3Client;

  constructor() {
    this.bucket = process.env.S3_BUCKET ?? process.env.MINIO_BUCKET ?? "ecom";
    this.s3 = createInternalS3Client(); // ✅ server-side HeadObject vs
    this.presignS3 = createPublicS3Client(); // ✅ presigned URL host erişimi
  }
}
