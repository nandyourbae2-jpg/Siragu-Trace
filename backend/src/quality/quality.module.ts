import { Module } from '@nestjs/common';
import { QualityController } from './quality.controller.js';
import { InspectionsService } from './inspections.service.js';
import { ReleaseGateService } from './release-gate.service.js';
import { EvidenceService } from './evidence.service.js';
import { LotsModule } from '../lots/lots.module.js';

@Module({
  imports: [LotsModule], // Brings in LotStateMachineService
  controllers: [QualityController],
  providers: [InspectionsService, ReleaseGateService, EvidenceService],
  exports: [InspectionsService, ReleaseGateService, EvidenceService],
})
export class QualityModule {}
