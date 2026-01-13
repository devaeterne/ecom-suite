import type { INestApplication } from "@nestjs/common";
import { createE2EApp } from "@test/helpers/bootstrap";
import { api } from "@test/helpers/http";
import { fx } from "@test/helpers/fixtures";
import { loginAdmin } from "@test/utils/auth";

describe("[EXT] Invite flow (extended e2e)", () => {
  let app: INestApplication;
  let ownerCookie: string;

  beforeAll(async () => {
    app = await createE2EApp();
    ownerCookie = (
      await loginAdmin(app, {
        email: fx.owner.email,
        password: fx.owner.password,
      })
    ).cookie;
  });

  afterAll(async () => {
    await app?.close();
  });

  const expect200or201 = (status: number) => {
    expect([200, 201]).toContain(status);
  };

  it("invite without cookie -> 401/403", async () => {
    const res = await api(app)
      .post("/api/admin/identities/whatever/invite")
      .send({});
    expect([401, 403]).toContain(res.status);
  });

  it("invite returns ok (and optionally token in test mode)", async () => {
    // 1) Create a new identity to invite
    const created = await api(app)
      .post("/api/admin/identities")
      .set("Cookie", ownerCookie)
      .send({ email: `invitee-${Date.now()}@acme.com`, roleScope: "STAFF" });

    expect200or201(created.status);

    const id = created.body?.id;
    expect(id).toBeTruthy();

    // 2) Invite
    const res = await api(app)
      .post(`/api/admin/identities/${id}/invite`)
      .set("Cookie", ownerCookie)
      .send({});

    expect200or201(res.status);
    expect(res.body?.ok).toBeTruthy();

    // Optional: if test mode echoes token
    if (process.env.INVITE_ECHO_TOKEN === "true") {
      expect(typeof res.body?.token).toBe("string");
      expect(res.body.token.length).toBeGreaterThan(10);
    }
  });
});
