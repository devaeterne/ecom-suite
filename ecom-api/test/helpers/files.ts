// test/helpers/files.ts
import type { INestApplication } from "@nestjs/common";
import { api, type HttpAgent } from "@test/helpers/http";

/**
 * MinIO presigned URL'ler bazen container host'u döner (minio/ecom_minio).
 * Jest local koşumda bunu localhost'a rewrite ederek gerçek PUT yapıyoruz.
 */
export function rewriteMinioToLocal(url: string) {
  return url
    .replace("http://minio:9000", "http://localhost:9000")
    .replace("http://ecom_minio:9000", "http://localhost:9000")
    .replace("https://minio:9000", "https://localhost:9000")
    .replace("https://ecom_minio:9000", "https://localhost:9000");
}

export type PresignPutBody = {
  fileId?: string;
  putUrl?: string;

  // bazı implementasyonlar farklı isim kullanabilir
  file?: { id?: string };
  uploadUrl?: string;
  url?: string;
  presignedUrl?: string;
};

export function pickPresignPut(body: PresignPutBody): {
  fileId: string;
  putUrl: string;
} {
  const fileId = body.fileId ?? body.file?.id;
  const putUrl = body.putUrl ?? body.uploadUrl ?? body.url ?? body.presignedUrl;

  if (!fileId || !putUrl) {
    throw new Error(
      `[files] presign-put parse failed: fileId=${String(
        fileId
      )} putUrl=${String(putUrl)} body=${JSON.stringify(body)}`
    );
  }
  return { fileId, putUrl };
}

/**
 * Node 18+ fetch varsayımıyla.
 * Eğer fetch yoksa test env'inizde polyfill gerekir.
 */
export async function putToPresignedUrl(params: {
  putUrl: string;
  contentType: string;
  size?: number;
}): Promise<{ etag: string }> {
  const { putUrl, contentType, size = 1024 } = params;

  const finalUrl = rewriteMinioToLocal(putUrl);
  const buf = Buffer.alloc(size);

  const res = await fetch(finalUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: buf,
  });

  if (!res.ok) {
    const text = await safeReadText(res);
    throw new Error(
      `[files] PUT failed status=${res.status} body=${text ?? ""}`
    );
  }

  const etag = res.headers.get("etag")?.replaceAll('"', "") ?? "dummy";
  return { etag };
}

async function safeReadText(res: Response) {
  try {
    return await res.text();
  } catch {
    return null;
  }
}

export async function presignPut(params: {
  agent: HttpAgent; // adminAgent (cookie agent)
  tenantHeader: Record<string, string>;
  filename: string;
  contentType: string;
  size: number;
  expectStatus?: (r: any) => void;
}) {
  const { agent, tenantHeader, filename, contentType, size, expectStatus } =
    params;

  // Supertest agent yoksa api(app) ile de yapılabilir.
  // Biz adminAgent üzerinde gideceğiz.
  const req = agent
    .post("/api/admin/files/presign-put")
    .set(tenantHeader)
    .send({ filename, contentType, size });

  const res = expectStatus ? await req.expect(expectStatus) : await req;
  const { fileId, putUrl } = pickPresignPut(res.body as PresignPutBody);

  return { fileId, putUrl, raw: res.body };
}

export async function completeUpload(params: {
  agent: HttpAgent;
  tenantHeader: Record<string, string>;
  fileId: string;
  etag?: string;
  expectStatus?: (r: any) => void;
}) {
  const { agent, tenantHeader, fileId, etag, expectStatus } = params;

  const req = agent
    .post(`/api/admin/files/${fileId}/complete`)
    .set(tenantHeader)
    .send(etag ? { etag } : {});

  const res = expectStatus ? await req.expect(expectStatus) : await req;
  return res.body;
}

/**
 * Full pipeline:
 * presign-put -> PUT -> complete
 */
export async function uploadFileE2E(params: {
  agent: HttpAgent;
  tenantHeader: Record<string, string>;
  filename: string;
  contentType?: string;
  size?: number;
  expectStatus?: (r: any) => void; // 200/201 tolerant
}) {
  const {
    agent,
    tenantHeader,
    filename,
    contentType = "application/octet-stream",
    size = 1024,
    expectStatus,
  } = params;

  const presign = await presignPut({
    agent,
    tenantHeader,
    filename,
    contentType,
    size,
    expectStatus,
  });

  const { etag } = await putToPresignedUrl({
    putUrl: presign.putUrl,
    contentType,
    size,
  });

  await completeUpload({
    agent,
    tenantHeader,
    fileId: presign.fileId,
    etag,
    expectStatus,
  });

  return { fileId: presign.fileId, etag, putUrl: presign.putUrl };
}

/**
 * Storefront / public API yerine admin API için kısa client,
 * bazı testlerde INestApplication üzerinden direkt çağrı gerekirse.
 */
export function filesApi(app: INestApplication) {
  return api(app);
}
