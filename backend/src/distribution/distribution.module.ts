import { Module } from '@nestjs/common';
import { ShipmentsService } from './shipments.service.js';
import { ComplaintsService } from './complaints.service.js';
import { DistributionController } from './distribution.controller.js';
import { TraceModule } from '../trace/trace.module.js';

@Module({
  imports: [TraceModule], // Required for Complaints Impact Analysis (Backward + Forward tracing)
  controllers: [DistributionController],
  providers: [ShipmentsService, ComplaintsService],
  exports: [ShipmentsService, ComplaintsService],
})
export class DistributionModule {}
