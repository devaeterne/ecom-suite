import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

import { PrismaService } from "../prisma/prisma.service";
import { env } from "../config/env";

type CheckResult = {
  ok: boolean;
  ms: number;
  error?: string;
};

type TimedResult<T> = {
  ms: number;
  value?: T;
  error?: string;
};

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly s3: S3Client;

  constructor(private readonly prisma: PrismaService) {
    // Redis
    this.redis = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 800,
    });

    // MinIO (S3 compatible)
    // Not: host'ı sabitlemek yerine env.MINIO_ENDPOINT'i kullanmak daha sağlıklı.

    const endpoint = `${env.MINIO_USE_SSL ? "https" : "http"}://minio:${
      env.MINIO_PORT
    }`;

    this.s3 = new S3Client({
      region: "us-east-1",
      endpoint,
      forcePathStyle: true,
      // credentials: {
      //   accessKeyId: env.MINIO_ACCESS_KEY,
      //   secretAccessKey: env.MINIO_SECRET_KEY,
      // },
    });
  }

  async onModuleDestroy() {
    try {
      await this.redis.quit();
    } catch {
      // noop
    }
  }

  private async timed<T>(fn: () => Promise<T>): Promise<TimedResult<T>> {
    const start = Date.now();
    try {
      const value = await fn();
      return { ms: Date.now() - start, value };
    } catch (e: any) {
      return { ms: Date.now() - start, error: e?.message ?? String(e) };
    }
  }

  private toCheckResult(
    result: TimedResult<unknown>,
    ok: boolean
  ): CheckResult {
    return {
      ok,
      ms: result.ms,
      ...(result.error ? { error: result.error } : {}),
    };
  }

  async check() {
    const db = await this.timed(async () => {
      // Prisma ping (en güvenlisi)
      // PrismaService doğrudan PrismaClient ise: this.prisma.$queryRaw kullan.
      // Eğer wrapper ise: this.prisma.client.$queryRaw.
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    });

    const redis = await this.timed(async () => {
      if (this.redis.status !== "ready") await this.redis.connect();
      return (await this.redis.ping()) === "PONG";
    });

    const minio = await this.timed(async () => {
      await this.s3.send(new HeadBucketCommand({ Bucket: env.MINIO_BUCKET }));
      return true;
    });

    const dbRes = this.toCheckResult(db, !db.error);
    const redisRes = this.toCheckResult(
      redis,
      !redis.error && redis.value === true
    );
    const minioRes = this.toCheckResult(minio, !minio.error);

    const overall = dbRes.ok && redisRes.ok && minioRes.ok;

    return {
      status: overall ? "ok" : "degraded",
      uptimeSec: Math.floor(process.uptime()),
      checks: {
        db: dbRes,
        redis: redisRes,
        minio: minioRes,
      },
    };
  }
}
