import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Role, type AuthenticatedUser } from '../auth/auth.types.js';
import { ReportsService, type ReportFilterDto } from './reports.service.js';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsSvc: ReportsService) {}

  @Post('export')
  @Roles(Role.OPERATOR, Role.QA, Role.OWNER, Role.ADMIN)
  requestExport(
    @CurrentUser() user: AuthenticatedUser,
    @Body() filters: ReportFilterDto,
  ) {
    return this.reportsSvc.requestExport(user.organizationId!, user.id, filters);
  }

  @Get('jobs')
  @Roles(Role.OPERATOR, Role.QA, Role.OWNER, Role.ADMIN)
  getRecentJobs(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsSvc.getRecentJobs(user.organizationId!, user.id);
  }

  @Get('jobs/:jobId')
  @Roles(Role.OPERATOR, Role.QA, Role.OWNER, Role.ADMIN)
  getJobStatus(
    @CurrentUser('organizationId') orgId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.reportsSvc.getJobStatus(orgId, jobId);
  }
}
