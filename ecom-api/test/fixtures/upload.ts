// test/fixtures/uploads.ts
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { withTenantHeaders } from "@test/utils/tenant";

type PresignPutOpts = {
  adminCookie: string;
  tenantId?: string;
  tenantCode?: string;

  filename?: string;
  contentType?: string;
  size?: number;
  folder?: string;
};

function makeTinyPngBuffer() {
  // 1x1 PNG (çok küçük, CI dostu)
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/af5lYkAAAAASUVORK5CYII=",
    "base64"
  );
}

/**
 * 1) presign-put
 * 2) PUT binary to putUrl
 * 3) complete
 * -> returns fileId (READY)
 */
export async function seedUploadFile(
  app: INestApplication,
  opts: PresignPutOpts
): Promise<{ fileId: string }> {
  const server = app.getHttpServer();

  const filename = opts.filename ?? "e2e.png";
  const contentType = opts.contentType ?? "image/png";
  const bodyBuf = makeTinyPngBuffer();
  const size = opts.size ?? bodyBuf.length;
  const folder = opts.folder ?? "uploads";

  // 1) presign
  const presignReq = request(server)
    .post("/api/admin/files/presign-put")
    .set("Cookie", opts.adminCookie);

  withTenantHeaders(presignReq, {
    tenantId: opts.tenantId,
    tenantCode: opts.tenantCode,
  });

  const presignRes = await presignReq.send({
    filename,
    contentType,
    size,
    folder,
  });

  if (![200, 201].includes(presignRes.status)) {
    throw new Error(
      `[uploads.seedUploadFile] presign-put failed: ${
        presignRes.status
      } ${JSON.stringify(presignRes.body)}`
    );
  }

  const fileId = presignRes.body?.fileId;
  const putUrl = presignRes.body?.putUrl;
  if (!fileId || !putUrl) {
    throw new Error(
      `[uploads.seedUploadFile] cannot parse {fileId, putUrl}: ${JSON.stringify(
        presignRes.body
      )}`
    );
  }

  // 2) PUT to MinIO via presigned URL
  const putRes = await fetch(putUrl, {
    method: "PUT",
    headers: {
      "content-type": contentType,
    },
    body: bodyBuf,
  });

  if (!putRes.ok) {
    const txt = await putRes.text().catch(() => "");
    throw new Error(
      `[uploads.seedUploadFile] PUT failed: ${putRes.status} ${txt}`
    );
  }

  // 3) complete
  const completeReq = request(server)
    .post(`/api/admin/files/${fileId}/complete`)
    .set("Cookie", opts.adminCookie);

  withTenantHeaders(completeReq, {
    tenantId: opts.tenantId,
    tenantCode: opts.tenantCode,
  });

  const completeRes = await completeReq.send({});

  if (![200, 201].includes(completeRes.status)) {
    throw new Error(
      `[uploads.seedUploadFile] complete failed: ${
        completeRes.status
      } ${JSON.stringify(completeRes.body)}`
    );
  }

  return { fileId };
}
