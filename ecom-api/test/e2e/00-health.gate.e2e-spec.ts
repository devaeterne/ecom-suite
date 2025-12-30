import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";

describe("Health (gate e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("GET /api/health -> 200", async () => {
    await api(app).get("/api/health").expect(200);
  });

  it("GET /api/health/live -> 200", async () => {
    await api(app).get("/api/health/live").expect(200);
  });
});
