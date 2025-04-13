import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  path: 'healthcheck',
  version: VERSION_NEUTRAL,
})
export class HealthController {
  @Get()
  async check(): Promise<string> {
    return 'ok';
  }
}
