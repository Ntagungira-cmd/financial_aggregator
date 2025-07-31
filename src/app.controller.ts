import { Controller, Get } from '@nestjs/common';
import * as os from 'os';

@Controller()
export class AppController {
  @Get()
  getHost(): string {
    // Test if the load balancer is round robining requests between the instances
    return `Hello from server instance: ${os.hostname()}`;
  }
}
