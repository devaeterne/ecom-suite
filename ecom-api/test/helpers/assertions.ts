// test/utils/assertions.ts
export function expect200(res: any) {
  expect(res.status).toBe(200);
  return res;
}

export function expect201(res: any) {
  expect(res.status).toBe(201);
  return res;
}

export function expect204(res: any) {
  expect(res.status).toBe(204);
  return res;
}

export function expect400(res: any) {
  expect(res.status).toBe(400);
  return res;
}

export function expect401(res: any) {
  expect(res.status).toBe(401);
  return res;
}

export function expect403(res: any) {
  expect(res.status).toBe(403);
  return res;
}

export function expect404(res: any) {
  expect(res.status).toBe(404);
  return res;
}

// Opsiyonel: domain error code alanı varsa (ör. { code: "SOME_ERROR" })
export function expectErrorCode(res: any, code: string) {
  const body = res.body ?? {};
  const got = body.code ?? body.errorCode ?? body.error?.code;
  expect(got).toBe(code);
  return res;
}
