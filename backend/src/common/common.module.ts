import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { BatchService } from './batch.service.js';

@Global()
@Module({
  providers: [AuditService, BatchService],
  exports: [AuditService, BatchService],
})
export class CommonModule {}
