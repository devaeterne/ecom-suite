import { Module } from "@nestjs/common";
import { SessionsRepository } from "@/modules/sessions/sessions.repository";

@Module({
  providers: [SessionsRepository],
  exports: [SessionsRepository],
})
export class SessionsModule {}
