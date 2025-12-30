/**
 * Deterministic fixture data for E2E.
 * Keep all hardcoded emails/passwords here.
 */
export const fx = {
  tenantKey: "acme",

  owner: {
    email: "admin@acme.com",
    password: "ChangeMe123!",
  },

  support: {
    email: "support@acme.com",
    password: "ChangeMe123!",
  },

  storeUser: {
    email: "buyer1@acme.com",
    password: "ChangeMe123!",
    // register payload can include more fields; keep minimal and add when needed
  },

  role: {
    name: "QA",
    scope: "STAFF",
    description: "QA role",
  },

  identity: {
    email: "staff1@acme.com",
    roleScope: "STAFF",
  },

  passwordReset: {
    email: "admin@acme.com", // enumeration test uses an existing one; we'll also test random
    randomEmail: "noone-" + Date.now() + "@example.com",
    // confirm payload is project-specific; test will validate 400/422 on bad payload
  },
} as const;
