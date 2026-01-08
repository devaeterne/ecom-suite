export type CreatePresignedUploadInput = {
  tenantId: string;
  filename: string;
  contentType: string;
  size: number;
};

export type PresignedPutResult = {
  fileId: string;
  bucket: string;
  key: string;
  putUrl: string;
  expiresAt: string; // ISO
};

export type PresignedGetResult = {
  fileId: string;
  url: string;
  expiresAt: string; // ISO
};
