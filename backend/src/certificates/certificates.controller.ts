import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Role, type AuthenticatedUser } from '../auth/auth.types.js';
import { CertificatesService, type CreateCertificateDto, type UpdateCertificateDto } from './certificates.service.js';

@Controller('certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CertificatesController {
  constructor(private readonly certSvc: CertificatesService) {}

  @Get()
  @Roles(Role.OPERATOR, Role.QA, Role.OWNER, Role.ADMIN, Role.MANAGER)
  findAll(@CurrentUser('organizationId') orgId: string) {
    return this.certSvc.findAll(orgId);
  }

  @Get(':id')
  @Roles(Role.OPERATOR, Role.QA, Role.OWNER, Role.ADMIN, Role.MANAGER)
  findOne(@CurrentUser('organizationId') orgId: string, @Param('id') id: string) {
    return this.certSvc.findOne(orgId, id);
  }

  @Post()
  @Roles(Role.QA, Role.OWNER, Role.ADMIN, Role.MANAGER)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCertificateDto) {
    return this.certSvc.create(user.organizationId!, user.id, dto);
  }

  @Patch(':id')
  @Roles(Role.QA, Role.OWNER, Role.ADMIN, Role.MANAGER)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCertificateDto,
  ) {
    return this.certSvc.update(user.organizationId!, user.id, id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.certSvc.delete(user.organizationId!, user.id, id);
  }
}
