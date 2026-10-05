import { Controller, Get, Post, Body, Param, Patch, UseGuards, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Role, type AuthenticatedUser } from '../auth/auth.types.js';
import { SuppliersService } from './suppliers.service.js';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(private readonly svc: SuppliersService) {}

  @Get()
  findAll(@CurrentUser('organizationId') orgId: string) {
    return this.svc.findAll(orgId);
  }

  @Post()
  @Roles(Role.OWNER, Role.OPERATOR, Role.ADMIN)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSupplierDto,
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
    @Body() dto: Partial<CreateSupplierDto>,
  ) {
    return this.svc.update(orgId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  deactivate(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.svc.deactivate(orgId, id);
  }
}
