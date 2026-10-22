import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Role } from '../auth/auth.types.js';
import { IotService } from './iot.service.js';
import { Scenario } from './temp-scoring.js';

@Controller('iot/v1')
export class IotController {
  constructor(private readonly iotSvc: IotService) {}

  @Get('sensors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.QA, Role.OWNER, Role.ADMIN, Role.MANAGER)
  getSensors(@CurrentUser('organizationId') orgId: string) {
    return this.iotSvc.getSensors(orgId);
  }

  @Get('sensors/:sensorId/readings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.QA, Role.OWNER, Role.ADMIN, Role.MANAGER)
  getReadings(
    @CurrentUser('organizationId') orgId: string,
    @Param('sensorId') sensorId: string,
    @Query('hours') hours?: string,
  ) {
    return this.iotSvc.getSensorReadings(orgId, sensorId, hours ? parseInt(hours) : 24);
  }

  @Get('boxes/:boxId/readings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.QA, Role.OWNER, Role.ADMIN, Role.MANAGER)
  getBoxReadings(
    @CurrentUser('organizationId') orgId: string,
    @Param('boxId') boxId: string,
  ) {
    return this.iotSvc.getBoxReadings(orgId, boxId);
  }

  @Get('alerts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.QA, Role.OWNER, Role.ADMIN, Role.MANAGER)
  getAlerts(@CurrentUser('organizationId') orgId: string) {
    return this.iotSvc.getAlerts(orgId);
  }

  @Post('readings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.QA, Role.OWNER, Role.ADMIN, Role.MANAGER)
  ingestReadings(
    @CurrentUser('organizationId') orgId: string,
    @Body()
    body: {
      deviceId: string;
      boxId?: string;
      readings: Array<{ ts: string; tempC: number; rhPct?: number; battery?: number }>;
    },
  ) {
    return this.iotSvc.ingestReadings(orgId, body);
  }

  @Post('import-csv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.QA, Role.OWNER, Role.ADMIN, Role.MANAGER)
  importCsv(
    @CurrentUser('organizationId') orgId: string,
    @Body()
    body: {
      boxId: string;
      csvContent: string;
      deviceId?: string;
    },
  ) {
    return this.iotSvc.importCsv(orgId, body.boxId, body.csvContent, body.deviceId);
  }

  @Post('simulate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.QA, Role.OWNER, Role.ADMIN, Role.MANAGER)
  simulate(
    @CurrentUser('organizationId') orgId: string,
    @Body()
    body: {
      boxId: string;
      scenario: Scenario;
      durationHours?: number;
    },
  ) {
    return this.iotSvc.simulateScenario(orgId, body.boxId, body.scenario, body.durationHours ?? 16);
  }
}
