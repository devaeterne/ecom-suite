import request from "supertest";
import type { INestApplication } from "@nestjs/common";

export type HttpClient = ReturnType<typeof request>;
export type HttpAgent = ReturnType<typeof request.agent>;

/**
 * Stateless client (no cookie jar)
 */
export function api(app: INestApplication) {
  return request(app.getHttpServer());
}

/**
 * Cookie-aware agent (keeps Set-Cookie between calls)
 */
export function agent(app: INestApplication): HttpAgent {
  return request.agent(app.getHttpServer());
}
