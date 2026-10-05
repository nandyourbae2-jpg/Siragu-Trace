import { Module } from '@nestjs/common';
import { TraceController } from './trace.controller.js';
import { TraceService } from './trace.service.js';

@Module({
  controllers: [TraceController],
  providers: [TraceService],
  exports: [TraceService],
})
export class TraceModule {}
