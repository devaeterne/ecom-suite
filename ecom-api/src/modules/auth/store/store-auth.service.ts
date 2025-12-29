import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { SessionsRepository } from "@/modules/sessions/sessions.repository";
import { TokenService } from "@/modules/crypto/token.service";
import { env } from "@/config/env";
import { createHash } from "crypto";
import * as bcrypt from "bcrypt";
import { ActiveTenantService } from "@/infrastructure/tenant-bootstrap/active-tenant.service";

function sha256(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

@Injectable()
export class StoreAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsRepo: SessionsRepository,
    private readonly tokenService: TokenService,
    private readonly activeTenant: ActiveTenantService
  ) {}
  // Register Method
  async register(input: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    const tenantId = await this.activeTenant.getTenantId(); // senin servisin nasıl dönüyorsa uyarlarsın

    const email = input.email.trim().toLowerCase();

    // aynı tenant’ta email varsa conflict
    const exists = await this.prisma.customer.findFirst({
      where: { tenantId, email },
      select: { id: true },
    });
    if (exists) throw new ConflictException("Email already registered");

    const passwordHash = await bcrypt.hash(input.password, 10);

    // transaction: customer + identity
    const created = await this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          tenantId,
          email,
          firstName: input.firstName,
          lastName: input.lastName,
          metadata: {},
        },
        select: {
          id: true,
          tenantId: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      const identity = await tx.authIdentity.create({
        data: {
          tenantId,
          provider: "EMAIL_PASSWORD",
          providerId: email,
          customerId: customer.id,
          passwordHash,
          passwordAlgo: "bcrypt",
          passwordUpdatedAt: new Date(),
        },
        select: { id: true, tenantId: true },
      });

      return { customer, identity };
    });

    // session + token
    const refreshRaw = this.tokenService.newRefreshToken();
    const tokenHash = sha256(refreshRaw);
    const expiresAt = new Date(
      Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
    );

    await this.sessionsRepo.create({
      tenantId: created.identity.tenantId,
      identityId: created.identity.id,
      tokenHash,
      expiresAt,
      typ: "store",
    });

    const accessToken = this.tokenService.signAccessToken(
      {
        sub: created.identity.id,
        tenantId: created.identity.tenantId,
        typ: "store",
      },
      env.ACCESS_TOKEN_TTL_SECONDS
    );

    return { accessToken, refreshRaw };
  }
  // Login, refresh ve logout metodları
  async login(email: string, password: string) {
    const identity = await this.prisma.authIdentity.findFirst({
      where: {
        provider: "EMAIL_PASSWORD",
        providerId: { equals: email, mode: "insensitive" },
      },
      select: {
        id: true,
        tenantId: true,
        passwordHash: true,
        customerId: true,
        providerId: true,
      },
    });

    // Store’da customerId zorunlu diyorsan burada enforce edebilirsin:
    if (!identity?.passwordHash)
      throw new UnauthorizedException("Invalid credentials");
    if (!identity.customerId) {
      throw new UnauthorizedException("Invalid store credentials");
    }

    const ok = await bcrypt.compare(password, identity.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    const refreshRaw = this.tokenService.newRefreshToken();
    const tokenHash = sha256(refreshRaw);
    const expiresAt = new Date(
      Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
    );

    await this.sessionsRepo.create({
      tenantId: identity.tenantId,
      identityId: identity.id,
      tokenHash,
      expiresAt,
      typ: "store",
    });

    const accessToken = this.tokenService.signAccessToken(
      {
        sub: identity.id,
        tenantId: identity.tenantId,
        typ: "store",
      },
      env.ACCESS_TOKEN_TTL_SECONDS
    );

    return { accessToken, refreshRaw };
  }

  async refresh(refreshRaw: string) {
    const tokenHash = sha256(refreshRaw);

    const session = await this.sessionsRepo.findValidByTokenHash({
      tokenHash,
      typ: "store",
    });
    if (!session) throw new UnauthorizedException("Invalid session");

    const newRefreshRaw = this.tokenService.newRefreshToken();
    const newHash = sha256(newRefreshRaw);
    const newExpiresAt = new Date(
      Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
    );

    await this.sessionsRepo.rotate(session.id, newHash, newExpiresAt);

    const accessToken = this.tokenService.signAccessToken(
      {
        sub: session.identityId,
        tenantId: session.tenantId,
        typ: "store",
      },
      env.ACCESS_TOKEN_TTL_SECONDS
    );

    return { accessToken, refreshRaw: newRefreshRaw };
  }

  async logout(refreshRaw: string) {
    const tokenHash = sha256(refreshRaw);

    const session = await this.sessionsRepo.findValidByTokenHash({
      tokenHash,
      typ: "store",
    });
    if (!session) return;

    await this.sessionsRepo.revoke(session.id);
  }
}
