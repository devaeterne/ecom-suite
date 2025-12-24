# 🧩 ecom-suite

**ecom-suite** is a **fully Docker-based monorepo** architecture designed for a modern, modular e-commerce platform.  
The goal is to manage **API, Admin Panel, Storefront, and Infrastructure (infra)** as independent yet interoperable components.

This setup provides a **production-like local environment** built on the principles of scalability, observability, and ease of maintenance.

---

## 🎯 Architecture Overview

```text
ecom-suite
├── ecom-api            # Backend API (NestJS + Prisma)
├── ecom-admin          # Admin Dashboard (Planned)
├── ecom-storefront     # Customer Facing Storefront (Planned)
├── ecom-infra          # Docker, Network, Service Orch.
└── README.md
```

Each component is treated as a standalone application but communicates through a unified Docker network.

🧠 Components
1️⃣ ecom-api (Backend)
The core engine of the suite.

Tech Stack: NestJS (Fastify), Prisma ORM, PostgreSQL, Redis, MinIO (S3 compatible).

Responsibilities: Product/Stock/Category domains, API layer, Health monitoring, Cache management, and Object storage.

Key Endpoints:

GET /health → Real-time status of DB, Redis, and MinIO.

GET /docs → Swagger UI Documentation.

2️⃣ ecom-admin (Planned)
Back-office management for operations.

Features: Inventory management, price analysis, platform-based comparisons, and RBAC (Role-Based Access Control).

3️⃣ ecom-storefront (Planned)
The customer-facing web application.

Features: SEO-optimized product pages, price comparisons, and high-performance frontend.

4️⃣ ecom-infra (The Backbone)
Handles orchestration and environment consistency.

Contents: Docker Compose files, Shared network (ecom_net), Init scripts for MinIO, and Dev-specific tooling.

🐳 Docker EcosystemAll services run on a dedicated network to ensure seamless communication:Plaintext
NETWORK: 

```ecom_net
├─ [Service] api           (NestJS)
├─ [Service] postgres      (Main Database)
├─ [Service] redis         (Caching)
├─ [Service] minio         (S3 Storage)
└─ [Service] prisma_studio (Database UI)
```

Benefit: Services resolve each other via internal DNS (e.g., postgres:5432), making the transition from local to cloud seamless.🚀 Getting StartedTo spin up the entire stack, navigate to the infra directory and run the compose command:Bashcd ecom-infra

```
cd ecom-infra

docker compose \
  --env-file .env \
  -f docker/compose.base.yml \
  -f docker/compose.api.dev.yml \
  -f docker/compose.tools.yml \
  up -d

```
🔍 Access Points
```
Service	URL
API / Swagger	http://localhost:3001/docs
API Health	http://localhost:3001/health
MinIO Console	http://localhost:9001
Prisma Studio	http://localhost:5555
```

🧪 Health Checks
The API performs deep health checks to ensure reliability:

PostgreSQL: Executes SELECT 1.

Redis: Executes PING.

MinIO: Executes HeadBucket. All results are reported with latency metrics in milliseconds.

📌 Roadmap
[x] Initial API & Infra setup

[x] Dockerization & Service Orchestration

[ ] Admin Panel Integration

[ ] Storefront Application

[ ] Auth / RBAC implementation

[ ] CI/CD Pipelines

### 🔍 This repository is under active development.