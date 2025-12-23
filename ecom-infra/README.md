# ecom-infra

This repository contains **infrastructure and orchestration only** for the Ecom platform.

It is intentionally **technology-agnostic** and does **not** contain application code,
package managers, or build tools.

---

## 🎯 Purpose

`ecom-infra` is responsible for:

- Docker Compose orchestration
- PostgreSQL, Redis, MinIO
- Prisma migrate / seed / studio
- Local & production runtime configuration
- Service startup and shutdown scripts

---

## 🚫 What this repo is NOT

- ❌ Not a Node.js project
- ❌ No `package.json`
- ❌ No `node_modules`
- ❌ No pnpm / npm / yarn
- ❌ No TypeScript or build logic

All application logic lives in **separate repositories**:

- `ecom-api`
- `ecom-admin`
- `ecom-storefront`

---

## 📁 Structure

```text
ecom-infra/
├── docker/
│   ├── compose.base.yml        # DB, Redis, MinIO
│   ├── compose.api.yml         # API runtime
│   ├── compose.admin.yml       # Admin panel
│   ├── compose.storefront.yml  # Storefront
│   ├── compose.tools.yml       # Prisma / DB tools
│   └── minio/
│       └── init.sh
│
├── scripts/
│   ├── up.sh
│   ├── down.sh
│   ├── logs.sh
│   ├── db-migrate.sh
│   ├── db-seed.sh
│   └── prisma-studio.sh
│
├── .env.example
