//test/helpers/auth.ts

import type { INestApplication } from "@nestjs/common";
import { agent as makeAgent, api, type HttpAgent } from "@test/helpers/http";

function decodeJwtNoVerify(token: string) {
  const [, p] = token.split(".");
  const json = Buffer.from(p, "base64url").toString("utf8");
  return JSON.parse(json);
}
/**
 * Headers
 */
export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function xAdminToken(token: string) {
  return { "x-admin-token": token };
}

/**
 * Admin login
 */
export async function loginAdmin(
  app: INestApplication,
  email: string,
  password: string,
  opts?: { expectStatus?: number }
): Promise<{ accessToken?: string; agent: HttpAgent }> {
  const ag = makeAgent(app);
  const expectStatus = opts?.expectStatus ?? 200;

  const res = await ag
    .post("/api/admin/auth/login")
    .send({ email, password })
    .expect(expectStatus);

  const accessToken = res.body?.accessToken as string | undefined;
  return { accessToken, agent: ag };
}

/**
 * Store login
 */
export async function loginStore(
  app: INestApplication,
  email: string,
  password: string,
  opts?: { expectStatus?: number }
): Promise<{ accessToken?: string; agent: HttpAgent }> {
  const ag = makeAgent(app);
  const expectStatus = opts?.expectStatus ?? 200;

  const res = await ag
    .post("/api/store/auth/login")
    .send({ email, password })
    .expect(expectStatus);

  const accessToken = res.body?.accessToken as string | undefined;
  return { accessToken, agent: ag };
}

/**
 * Store register (setup)
 */
export async function registerStoreUser(app: INestApplication, payload: any) {
  const res = await api(app).post("/api/store/auth/register").send(payload);

  // policy: duplicate -> 409, success -> 200
  if (![200, 409].includes(res.status)) {
    throw new Error(
      `Unexpected register status=${res.status}, body=${JSON.stringify(
        res.body
      )}`
    );
  }
}

/**
 * Admin refresh/logout flows (cookie agent)
 */
export async function refreshAdmin(agent: HttpAgent, expectStatus = 200) {
  const res = await agent
    .post("/api/admin/auth/refresh")
    .send({})
    .expect(expectStatus);
  return res;
}

export async function logoutAdmin(agent: HttpAgent, expectStatus = 200) {
  return agent.post("/api/admin/auth/logout").send({}).expect(expectStatus);
}

export async function logoutAllAdmin(agent: HttpAgent, expectStatus = 200) {
  return agent.post("/api/admin/auth/logout-all").send({}).expect(expectStatus);
}

/**
 * Store refresh/logout flows (cookie agent)
 */
export async function refreshStore(agent: HttpAgent, expectStatus = 200) {
  return agent.post("/api/store/auth/refresh").send({}).expect(expectStatus);
}

export async function logoutStore(agent: HttpAgent, expectStatus = 200) {
  return agent.post("/api/store/auth/logout").send({}).expect(expectStatus);
}

export async function logoutAllStore(agent: HttpAgent, expectStatus = 200) {
  return agent.post("/api/store/auth/logout-all").send({}).expect(expectStatus);
}
