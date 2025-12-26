import { Module } from "@nestjs/common";
import { ReservationSweeperService } from "./reservation-sweeper.service";

@Module({
  providers: [ReservationSweeperService],
  exports: [ReservationSweeperService],
})
export class InventoryModule {}
