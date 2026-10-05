import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Role, type AuthenticatedUser } from '../auth/auth.types.js';
import { LotsService } from './lots.service.js';
import { CreateLotDto } from './dto/create-lot.dto.js';
import { UpdateLotDto } from './dto/update-lot.dto.js';
import { ListLotsQueryDto } from './dto/list-lots-query.dto.js';

/**
 * Lots Controller — all routes require JWT auth.
 * Tenant scoping is automatic: organizationId always comes from the JWT.
 *
 * GET    /lots              → list (all roles)
 * POST   /lots              → create (OWNER | OPERATOR)
 * GET    /lots/:id          → get by id (all roles)
 * PATCH  /lots/:id          → update (OWNER | OPERATOR)
 * DELETE /lots/:id          → soft-delete (OWNER only)
 * GET    /lots/:id/events   → lot event trail (all roles)
 */
@Controller('lots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @Get()
  findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query() query: ListLotsQueryDto,
  ) {
    return this.lotsService.findAll(orgId, query);
  }

  @Post()
  @Roles(Role.OWNER, Role.OPERATOR)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLotDto,
  ) {
    return this.lotsService.create(user.organizationId!, user.id, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.lotsService.findOne(orgId, id);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.OPERATOR)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateLotDto,
  ) {
    return this.lotsService.update(user.organizationId!, user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.OWNER)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.lotsService.softDelete(user.organizationId!, user.id, id);
  }

  @Get(':id/events')
  getEvents(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.lotsService.getEvents(orgId, id);
  }
}
