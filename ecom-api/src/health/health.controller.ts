import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOkResponse } from "@nestjs/swagger";
import { HealthService } from "@/health/health.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOkResponse({
    description: "Service health status (db/redis/minio)",
  })
  async getHealth() {
    return this.health.check();
  }

  @Get("live")
  async live() {
    // Liveness: proses ayakta mı?
    return { status: "ok" };
  }
}
