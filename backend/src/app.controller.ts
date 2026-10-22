import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service.js';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('admin/reset-demo')
  async resetDemo() {
    try {
      await execAsync('npx tsx prisma/seed.ts');
      return {
        success: true,
        message: 'Golden Path demo state reset successfully.',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message,
      };
    }
  }
}
