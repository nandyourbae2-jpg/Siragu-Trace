import { Module } from '@nestjs/common';
import { ProcessEventController } from './process-event.controller.js';
import { ProcessEventService } from './process-event.service.js';
import { MassBalanceService } from './mass-balance.service.js';
import { LotsModule } from '../lots/lots.module.js';

@Module({
  imports: [LotsModule], // Brings in LotStateMachineService
  controllers: [ProcessEventController],
  providers: [ProcessEventService, MassBalanceService],
  exports: [ProcessEventService],
})
export class ProcessEventsModule {}
