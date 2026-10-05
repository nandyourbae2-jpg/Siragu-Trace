import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Role, type AuthenticatedUser } from '../auth/auth.types.js';
import { BuyersService } from './buyers.service.js';
import { CreateBuyerDto } from './dto/create-buyer.dto.js';

@Controller('buyers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BuyersController {
  constructor(private readonly svc: BuyersService) {}

  @Get()
  findAll(@CurrentUser('organizationId') orgId: string) {
    return this.svc.findAll(orgId);
  }

  @Post()
  @Roles(Role.OWNER, Role.OPERATOR, Role.ADMIN)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBuyerDto,
  ) {
    return this.svc.create(user.organizationId!, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.svc.findOne(orgId, id);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.OPERATOR, Role.ADMIN)
  update(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateBuyerDto>,
  ) {
    return this.svc.update(orgId, id, dto);
  }
}
