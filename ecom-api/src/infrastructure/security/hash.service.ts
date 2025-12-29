import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { createHash, timingSafeEqual } from "crypto";

@Injectable()
export class HashService {
  private readonly SALT_ROUNDS = 12;

  sha256(raw: string) {
    return createHash("sha256").update(raw).digest("hex");
  }

  async hashPassword(raw: string): Promise<string> {
    return bcrypt.hash(raw, this.SALT_ROUNDS);
  }

  async verifyPassword(raw: string, hash: string): Promise<boolean> {
    return bcrypt.compare(raw, hash);
  }

  // opsiyonel: hex karşılaştırma (timing-safe)
  safeEqualHex(a: string, b: string) {
    const ab = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  }
}
