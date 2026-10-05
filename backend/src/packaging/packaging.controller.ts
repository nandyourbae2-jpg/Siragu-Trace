import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Role, type AuthenticatedUser } from '../auth/auth.types.js';
import { PackagingService } from './packaging.service.js';
import { QrActivationService } from './qr-activation.service.js';

@Controller('packaging')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PackagingController {
  constructor(
    private readonly pkgSvc: PackagingService,
    private readonly qrSvc: QrActivationService,
  ) {}

  @Post('lot/:lotId')
  @Roles(Role.OPERATOR, Role.OWNER, Role.ADMIN)
  createPackages(
    @CurrentUser('organizationId') orgId: string,
    @Param('lotId') lotId: string,
    @Body('quantity') quantity: number,
    @Body('packageSize') packageSize: number,
    @Body('unit') unit: string,
  ) {
    return this.pkgSvc.createPackages(orgId, lotId, quantity, packageSize, unit);
  }

  @Get('lot/:lotId')
  @Roles(Role.OPERATOR, Role.QA, Role.OWNER, Role.ADMIN)
  getPackages(@CurrentUser('organizationId') orgId: string, @Param('lotId') lotId: string) {
    return this.pkgSvc.getPackagesByLot(orgId, lotId);
  }

  @Get(':packageId/qr')
  @Roles(Role.OPERATOR, Role.QA, Role.OWNER, Role.ADMIN)
  getQrSerials(@CurrentUser('organizationId') orgId: string, @Param('packageId') packageId: string) {
    return this.pkgSvc.getQrSerials(orgId, packageId);
  }

  @Post('qr/:serial/activate')
  @Roles(Role.OPERATOR, Role.OWNER, Role.ADMIN)
  activateQr(
    @CurrentUser() user: AuthenticatedUser,
    @Param('serial') serial: string,
  ) {
    return this.qrSvc.activateQr(user.organizationId!, user.id, serial);
  }
}
