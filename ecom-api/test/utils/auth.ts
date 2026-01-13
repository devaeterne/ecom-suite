// test/utils/auth.ts
import type { INestApplication } from "@nestjs/common";
import { agent as makeAgent, type HttpAgent } from "@test/helpers/http";
import { COOKIE_NAMES } from "@/infrastructure/http/cookies";

function pickCookie(
  setCookie: string[] | string | undefined,
  cookieName: string
): string {
  if (!setCookie) {
    throw new Error(`[auth] set-cookie missing (wanted: ${cookieName})`);
  }
  const arr = Array.isArray(setCookie) ? setCookie : [setCookie];
  const found = arr.find((c) => c.startsWith(`${cookieName}=`));
  if (!found) {
    const names = arr.map((c) => c.split("=")[0]).join(", ");
    throw new Error(
      `[auth] cookie not found: ${cookieName}. set-cookie had: ${names}`
    );
  }
  return found.split(";")[0];
}

type LoginOpts = {
  email?: string;
  password?: string;
  expectStatus?: number;
};

type LoginResult = { cookie: string; agent: HttpAgent; accessToken?: string };

export async function loginAdmin(
  app: INestApplication,
  opts?: LoginOpts
): Promise<LoginResult> {
  const ag = makeAgent(app);

  const email =
    opts?.email ??
    process.env.E2E_ADMIN_EMAIL ??
    process.env.ADMIN_EMAIL ??
    "admin@acme.com";

  const password =
    opts?.password ??
    process.env.E2E_ADMIN_PASSWORD ??
    process.env.ADMIN_PASSWORD ??
    "Admin123!";

  const expectStatus = opts?.expectStatus ?? 200;

  const res = await ag
    .post("/api/admin/auth/login")
    .send({ email, password })
    .expect(expectStatus);

  const cookie = pickCookie(
    res.headers["set-cookie"],
    COOKIE_NAMES.adminAccess
  );
  const accessToken = res.body?.accessToken as string | undefined;

  return { cookie, agent: ag, accessToken };
}

export async function loginStore(
  app: INestApplication,
  opts?: LoginOpts
): Promise<LoginResult> {
  const ag = makeAgent(app);

  const email =
    opts?.email ??
    process.env.E2E_STORE_EMAIL ??
    process.env.STORE_EMAIL ??
    "store@acme.com";

  const password =
    opts?.password ??
    process.env.E2E_STORE_PASSWORD ??
    process.env.STORE_PASSWORD ??
    "Store123!";

  const expectStatus = opts?.expectStatus ?? 200;

  const res = await ag
    .post("/api/store/auth/login")
    .send({ email, password })
    .expect(expectStatus);

  const cookie = pickCookie(
    res.headers["set-cookie"],
    COOKIE_NAMES.storeAccess
  );
  const accessToken = res.body?.accessToken as string | undefined;

  return { cookie, agent: ag, accessToken };
}
