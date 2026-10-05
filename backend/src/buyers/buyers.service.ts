import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateBuyerDto } from './dto/create-buyer.dto.js';

@Injectable()
export class BuyersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.buyer.findMany({
      where: { organizationId: orgId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const b = await this.prisma.buyer.findFirst({ where: { id, organizationId: orgId } });
    if (!b) throw new NotFoundException(`Buyer "${id}" not found.`);
    return b;
  }

  async create(orgId: string, dto: CreateBuyerDto) {
    if (dto.code) {
      const dup = await this.prisma.buyer.findFirst({ where: { organizationId: orgId, code: dto.code } });
      if (dup) throw new ConflictException(`Buyer code "${dto.code}" already exists.`);
    }
    return this.prisma.buyer.create({ data: { ...dto, organizationId: orgId } });
  }

  async update(orgId: string, id: string, dto: Partial<CreateBuyerDto>) {
    await this.findOne(orgId, id);
    return this.prisma.buyer.update({ where: { id }, data: dto });
  }
}
