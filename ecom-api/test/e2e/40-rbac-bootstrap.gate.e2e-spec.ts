import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";
import { loginAdmin, bearer } from "@test/helpers/auth";

describe("RBAC Bootstrap (gate e2e)", () => {
  let app: INestApplication;
  let ownerToken: string | undefined;

  beforeAll(async () => {
    app = await createE2EApp();
    const { accessToken } = await loginAdmin(
      app,
      fx.owner.email,
      fx.owner.password
    );
    ownerToken = accessToken;
  });

  afterAll(async () => {
    await app?.close();
  });

  it("bootstrap is idempotent", async () => {
    if (!ownerToken)
      throw new Error("ownerToken missing (login should return accessToken)");

    await api(app)
      .post("/api/admin/rbac/bootstrap")
      .set(bearer(ownerToken))
      .expect((r) => {
        if (![200, 201].includes(r.status))
          throw new Error(`Expected 200/201, got ${r.status}`);
      });

    await api(app)
      .post("/api/admin/rbac/bootstrap")
      .set(bearer(ownerToken))
      .expect((r) => {
        if (![200, 201].includes(r.status))
          throw new Error(`Expected 200/201, got ${r.status}`);
      });
  });
});
