import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateSupplierDto } from './dto/create-supplier.dto.js';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.supplier.findMany({
      where: { organizationId: orgId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const s = await this.prisma.supplier.findFirst({ where: { id, organizationId: orgId } });
    if (!s) throw new NotFoundException(`Supplier "${id}" not found.`);
    return s;
  }

  async create(orgId: string, dto: CreateSupplierDto) {
    if (dto.code) {
      const dup = await this.prisma.supplier.findFirst({ where: { organizationId: orgId, code: dto.code } });
      if (dup) throw new ConflictException(`Supplier code "${dto.code}" already exists.`);
    }
    return this.prisma.supplier.create({ data: { ...dto, organizationId: orgId } });
  }

  async update(orgId: string, id: string, dto: Partial<CreateSupplierDto>) {
    await this.findOne(orgId, id);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async deactivate(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.supplier.update({ where: { id }, data: { isActive: false } });
  }
}
