// src/infrastructure/security/hash.service.ts

import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { env } from "@/config/env";

function resolveBcryptRounds(): number {
  const anyEnv = env as any;
  const v =
    anyEnv.BCRYPT_ROUNDS ??
    anyEnv.BCRYPT_COST ??
    anyEnv.BCRYPT_SALT_ROUNDS ??
    10;

  const n = Number(v);
  return Number.isFinite(n) && n >= 8 && n <= 15 ? n : 10;
}

@Injectable()
export class HashService {
  async hash(value: string): Promise<string> {
    return bcrypt.hash(value, resolveBcryptRounds());
  }

  async verify(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash);
  }

  // legacy
  async hashPassword(password: string): Promise<string> {
    return this.hash(password);
  }

  async verifyPassword(
    password: string,
    passwordHash: string
  ): Promise<boolean> {
    return this.verify(password, passwordHash);
  }
}
