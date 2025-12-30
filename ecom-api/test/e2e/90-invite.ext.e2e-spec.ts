import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";
import { loginAdmin, bearer } from "@test/helpers/auth";

describe("Invite flow (extended e2e)", () => {
  let app: INestApplication;
  let ownerToken!: string;

  beforeAll(async () => {
    app = await createE2EApp();
    const { accessToken } = await loginAdmin(
      app,
      fx.owner.email,
      fx.owner.password
    );
    if (!accessToken) throw new Error("accessToken missing");
    ownerToken = accessToken;
  });

  afterAll(async () => {
    await app?.close();
  });

  it("invite returns ok (and optionally token in test mode)", async () => {
    // Create a new identity to invite
    const created = await api(app)
      .post("/api/admin/identities")
      .set(bearer(ownerToken))
      .send({ email: `invitee-${Date.now()}@acme.com`, roleScope: "STAFF" })
      .expect(201);

    const id = created.body?.id;
    expect(id).toBeTruthy();

    const res = await api(app)
      .post(`/api/admin/identities/${id}/invite`)
      .set(bearer(ownerToken))
      .send({})
      .expect((r) => {
        if (![200, 201].includes(r.status))
          throw new Error(`Expected 200/201, got ${r.status}`);
      });

    expect(res.body?.ok).toBeTruthy();

    // If INVITE_ECHO_TOKEN=true, token should exist (optional assertion)
    if (process.env.INVITE_ECHO_TOKEN === "true") {
      expect(typeof res.body?.token).toBe("string");
      expect(res.body.token.length).toBeGreaterThan(10);
    }
  });
});
