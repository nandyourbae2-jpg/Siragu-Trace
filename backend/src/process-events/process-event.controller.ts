import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Role, type AuthenticatedUser } from '../auth/auth.types.js';
import { ProcessEventService } from './process-event.service.js';
import { CreateProcessEventDto } from './dto/create-process-event.dto.js';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessEventType } from '@prisma/client';

class ListProcessEventsQuery {
  @IsOptional() @IsEnum(ProcessEventType) eventType?: ProcessEventType;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number = 0;
}

@Controller('process-events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProcessEventController {
  constructor(private readonly svc: ProcessEventService) {}

  @Get()
  findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query() q: ListProcessEventsQuery,
  ) {
    return this.svc.findAll(orgId, q);
  }

  @Post()
  @Roles(Role.OWNER, Role.OPERATOR)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProcessEventDto,
  ) {
    return this.svc.create(user.organizationId!, user.id, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.svc.findOne(orgId, id);
  }
}
