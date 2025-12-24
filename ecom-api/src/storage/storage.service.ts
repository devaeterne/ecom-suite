import { Injectable } from "@nestjs/common";
import { S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env";

@Injectable()
export class StorageService {
  readonly bucket = env.MINIO_BUCKET;

  readonly s3 = new S3Client({
    region: "us-east-1",
    endpoint: `${env.MINIO_USE_SSL ? "https" : "http"}://minio:${
      env.MINIO_PORT
    }`,
    forcePathStyle: true,
  });
}
