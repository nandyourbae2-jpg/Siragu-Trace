import { Controller, Get, Post, Body, Param, Patch, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Role, type AuthenticatedUser } from '../auth/auth.types.js';
import { InspectionsService } from './inspections.service.js';
import { ReleaseGateService } from './release-gate.service.js';
import { EvidenceService } from './evidence.service.js';
import { CreateInspectionDto } from './dto/create-inspection.dto.js';
import { CreateEvidenceDto } from './dto/create-evidence.dto.js';
import { QualityStatus } from '@prisma/client';

@Controller('quality')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QualityController {
  constructor(
    private readonly inspectionsSvc: InspectionsService,
    private readonly releaseSvc: ReleaseGateService,
    private readonly evidenceSvc: EvidenceService,
  ) {}

  // ── Inspections ─────────────────────────────────────────────────────────────

  @Get('inspections/pending')
  @Roles(Role.QA, Role.OWNER, Role.ADMIN)
  getPendingInspections(@CurrentUser('organizationId') orgId: string) {
    return this.inspectionsSvc.findPending(orgId);
  }

  @Post('inspections')
  @Roles(Role.QA, Role.OWNER, Role.ADMIN)
  createInspection(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInspectionDto,
  ) {
    return this.inspectionsSvc.create(user.organizationId!, user.id, dto);
  }

  @Patch('inspections/:id/status')
  @Roles(Role.QA, Role.OWNER, Role.ADMIN)
  updateInspectionStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('status') status: QualityStatus,
  ) {
    return this.inspectionsSvc.updateStatus(user.organizationId!, id, user.id, status);
  }

  // ── Release Gate ────────────────────────────────────────────────────────────

  @Get('release/:lotId/check')
  @Roles(Role.QA, Role.OWNER, Role.ADMIN)
  async checkReleaseReadiness(
    @CurrentUser('organizationId') orgId: string,
    @Param('lotId') lotId: string,
  ) {
    return this.releaseSvc.checkReadiness(orgId, lotId);
  }

  @Post('release/:lotId')
  @Roles(Role.QA, Role.OWNER, Role.ADMIN)
  async executeRelease(
    @CurrentUser() user: AuthenticatedUser,
    @Param('lotId') lotId: string,
  ) {
    return this.releaseSvc.executeRelease(user.organizationId!, lotId, user.id);
  }

  // ── Evidence ────────────────────────────────────────────────────────────────

  @Post('evidence')
  @Roles(Role.QA, Role.OWNER, Role.OPERATOR, Role.ADMIN)
  createEvidence(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEvidenceDto,
  ) {
    return this.evidenceSvc.create(user.organizationId!, user.id, dto);
  }

  @Get('evidence/lot/:lotId')
  @Roles(Role.QA, Role.OWNER, Role.OPERATOR, Role.ADMIN)
  getEvidenceByLot(
    @CurrentUser('organizationId') orgId: string,
    @Param('lotId') lotId: string,
  ) {
    return this.evidenceSvc.findByLot(orgId, lotId);
  }
}
