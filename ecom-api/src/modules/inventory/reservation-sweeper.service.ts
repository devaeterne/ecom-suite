import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "@prisma/prisma.service";

@Injectable()
export class ReservationSweeperService {
  private readonly logger = new Logger(ReservationSweeperService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 5 dakikada bir:
   * active & expiresAt < now() -> released
   */
  @Cron("*/5 * * * *")
  async sweepExpired() {
    const now = new Date();

    const res = await this.prisma.inventoryReservation.updateMany({
      where: {
        status: "active",
        deletedAt: null,
        expiresAt: { lt: now },
      },
      data: {
        status: "released",
        updatedAt: now,
      },
    });

    if (res.count > 0) {
      this.logger.log(`Released expired reservations: ${res.count}`);
    }
  }
}
