import { Module } from '@nestjs/common';
import { PackagingService } from './packaging.service.js';
import { QrActivationService } from './qr-activation.service.js';
import { PackagingController } from './packaging.controller.js';
import { QrPublicController } from './qr-public.controller.js';

@Module({
  controllers: [PackagingController, QrPublicController],
  providers: [PackagingService, QrActivationService],
  exports: [PackagingService, QrActivationService],
})
export class PackagingModule {}
