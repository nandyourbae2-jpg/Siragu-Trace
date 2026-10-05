import { Controller, Get, Param } from '@nestjs/common';
import { QrActivationService } from './qr-activation.service.js';

/**
 * Public facing controller for QR Scanning verification.
 * NO JWT AUTH GUARANTEED HERE.
 */
@Controller('verify')
export class QrPublicController {
  constructor(private readonly qrSvc: QrActivationService) {}

  @Get(':serial')
  verifyQr(@Param('serial') serial: string) {
    return this.qrSvc.verifyPublicQr(serial);
  }
}
