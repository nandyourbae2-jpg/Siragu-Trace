import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Role } from '../auth/auth.types.js';
import { IotService } from './iot.service.js';

@Controller('iot')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IotController {
  constructor(private readonly iotSvc: IotService) {}

  @Get('sensors')
  @Roles(Role.OPERATOR, Role.QA, Role.OWNER, Role.ADMIN)
  getSensors(@CurrentUser('organizationId') orgId: string) {
    return this.iotSvc.getSensors(orgId);
  }

  @Get('sensors/:sensorId/readings')
  @Roles(Role.OPERATOR, Role.QA, Role.OWNER, Role.ADMIN)
  getReadings(
    @CurrentUser('organizationId') orgId: string,
    @Param('sensorId') sensorId: string,
    @Query('hours') hours?: string,
  ) {
    return this.iotSvc.getSensorReadings(orgId, sensorId, hours ? parseInt(hours) : 24);
  }
}
