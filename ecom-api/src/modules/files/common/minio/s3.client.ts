import { Injectable } from "@nestjs/common";
import { S3Client } from "@aws-sdk/client-s3";

function must(name: string, v?: string) {
  const val = (v ?? "").trim();
  if (!val) throw new Error(`Missing env: ${name}`);
  return val;
}

function boolEnv(v: string | undefined, def = false) {
  if (v == null) return def;
  return ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
}

function toNumber(v: string | undefined, def: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function normalizeEndpoint() {
  const host = must("MINIO_ENDPOINT", process.env.MINIO_ENDPOINT); // e.g. "minio" or "localhost"
  const port = toNumber(process.env.MINIO_PORT, 9000);
  const useSSL = boolEnv(process.env.MINIO_USE_SSL, false);

  // Eğer kullanıcı MINIO_ENDPOINT'e full URL yazdıysa aynen kullan.
  if (host.startsWith("http://") || host.startsWith("https://")) {
    return host;
  }

  const proto = useSSL ? "https" : "http";
  return `${proto}://${host}:${port}`;
}

@Injectable()
export class MinioS3Client {
  public readonly s3: S3Client;
  public readonly bucket: string;

  constructor() {
    const endpoint = normalizeEndpoint();
    const accessKeyId = must("MINIO_ACCESS_KEY", process.env.MINIO_ACCESS_KEY);
    const secretAccessKey = must(
      "MINIO_SECRET_KEY",
      process.env.MINIO_SECRET_KEY
    );

    this.bucket = process.env.MINIO_BUCKET?.trim() || "ecom";

    this.s3 = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      endpoint, // ✅ artık "http://minio:9000" formatında
      forcePathStyle: true, // ✅ MinIO için şart
      credentials: { accessKeyId, secretAccessKey },
    });
  }
}
