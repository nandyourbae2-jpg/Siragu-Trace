import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PublicService } from './public.service.js';

@Controller('public/v1')
export class PublicController {
  constructor(private readonly publicSvc: PublicService) {}

  @Get('lots/:token')
  async getLotPassport(@Param('token') token: string, @Req() req: Request) {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    const userAgent = req.headers['user-agent'];
    return this.publicSvc.getLotPassport(token, clientIp, userAgent);
  }

  @Get('lots/:token/pdf')
  async getLotPassportPdf(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const host = `${req.protocol}://${req.get('host')}`;
    const { pdfBytes, sha256 } = await this.publicSvc.getLotPassportPdf(token, host);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="SIRAGU-LotPassport-${token}.pdf"`,
      'Content-Length': pdfBytes.length,
      'X-Digest-SHA256': sha256,
      'Cache-Control': 'public, max-age=300',
    });
    res.end(Buffer.from(pdfBytes));
  }

  @Get('shipments/:token')
  async getShipmentPassport(@Param('token') token: string) {
    return this.publicSvc.getShipmentPassport(token);
  }

  @Get('shipments/:token/pdf')
  async getShipmentPassportPdf(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const host = `${req.protocol}://${req.get('host')}`;
    const { pdfBytes, sha256 } = await this.publicSvc.getShipmentPassportPdf(token, host);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="SIRAGU-ShipmentPassport-${token}.pdf"`,
      'Content-Length': pdfBytes.length,
      'X-Digest-SHA256': sha256,
      'Cache-Control': 'public, max-age=300',
    });
    res.end(Buffer.from(pdfBytes));
  }

  @Get('dossier/:token')
  async getDossier(@Param('token') token: string) {
    return this.publicSvc.getDossier(token);
  }

  @Get('verify/:serial')
  async legacyVerify(@Param('serial') serial: string, @Req() req: Request) {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    return this.publicSvc.getLotPassport(serial, clientIp);
  }
}
