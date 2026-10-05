import { Module } from '@nestjs/common';
import { LotsController } from './lots.controller.js';
import { LotsService } from './lots.service.js';
import { LotStateMachineService } from './lot-state-machine.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [LotsController],
  providers: [LotsService, LotStateMachineService],
  exports: [LotsService, LotStateMachineService],
})
export class LotsModule {}
