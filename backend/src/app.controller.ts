import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service.js';
import { runSeed } from '../prisma/seed.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('admin/reset-demo')
  async resetDemo() {
    await runSeed();
    return {
      success: true,
      message: 'Golden Path demo state reset successfully.',
      timestamp: new Date().toISOString(),
    };
  }
}
