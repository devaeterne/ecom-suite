import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";

describe("Password Reset (gate e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("request returns ok even for unknown email (no enumeration)", async () => {
    const known = await api(app)
      .post("/api/auth/reset-password/request")
      .send({ email: fx.passwordReset.email })
      .expect(201);

    const unknown = await api(app)
      .post("/api/auth/reset-password/request")
      .send({ email: fx.passwordReset.randomEmail })
      .expect(201);

    expect(known.body?.ok).toBeTruthy();
    expect(unknown.body?.ok).toBeTruthy();
  });

  it("confirm validates payload (bad payload -> 400/422)", async () => {
    const res = await api(app)
      .post("/api/auth/reset-password/confirm")
      .send({}) // intentionally wrong
      .expect((r) => {
        if (![400, 422].includes(r.status)) {
          throw new Error(`Expected 400/422, got ${r.status}`);
        }
      });

    expect(res.body).toBeTruthy();
  });
});
