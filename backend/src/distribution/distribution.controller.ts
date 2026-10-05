import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Role, type AuthenticatedUser } from '../auth/auth.types.js';
import { ShipmentsService } from './shipments.service.js';
import { ComplaintsService, type CreateComplaintDto } from './complaints.service.js';

@Controller('distribution')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DistributionController {
  constructor(
    private readonly shipmentSvc: ShipmentsService,
    private readonly complaintSvc: ComplaintsService,
  ) {}

  // ── Shipments ───────────────────────────────────────────────────────────────
  
  @Post('shipments')
  @Roles(Role.OPERATOR, Role.OWNER, Role.ADMIN)
  createShipment(
    @CurrentUser() user: AuthenticatedUser,
    @Body('buyerId') buyerId: string,
    @Body('lotId') lotId: string,
    @Body('quantity') quantity: number,
    @Body('unit') unit: string,
  ) {
    return this.shipmentSvc.createShipment(user.organizationId!, user.id, buyerId, lotId, quantity, unit);
  }

  @Get('shipments/buyer/:buyerId')
  @Roles(Role.BUYER, Role.OWNER, Role.ADMIN)
  getBuyerShipments(
    @CurrentUser('organizationId') orgId: string,
    @Param('buyerId') buyerId: string,
  ) {
    return this.shipmentSvc.getBuyerShipments(orgId, buyerId);
  }

  // ── Complaints ──────────────────────────────────────────────────────────────

  @Post('complaints')
  @Roles(Role.QA, Role.OWNER, Role.BUYER, Role.ADMIN)
  createComplaint(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateComplaintDto,
  ) {
    return this.complaintSvc.createComplaint(user.organizationId!, user.id, dto);
  }

  @Post('complaints/:id/analyze')
  @Roles(Role.QA, Role.OWNER, Role.ADMIN)
  analyzeComplaint(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.complaintSvc.runImpactAnalysis(orgId, id);
  }

  @Post('complaints/:id/action')
  @Roles(Role.QA, Role.OWNER, Role.ADMIN)
  recordComplaintAction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('actionDecision') actionDecision: string,
  ) {
    return this.complaintSvc.recordAction(user.organizationId!, id, user.id, actionDecision);
  }
}
