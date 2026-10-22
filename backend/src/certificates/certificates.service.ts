import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../common/audit.service.js';
import { certStatus, type CertStatus } from '../common/cert-status.js';
import { CertificateType } from '@prisma/client';

export interface CreateCertificateDto {
  type: CertificateType;
  name: string;
  number: string;
  issuer?: string;
  validUntil: string | Date;
  verifyUrl?: string;
  fileUrl?: string;
  isDemo?: boolean;
}

export interface UpdateCertificateDto {
  name?: string;
  number?: string;
  issuer?: string;
  validUntil?: string | Date;
  verifyUrl?: string;
  fileUrl?: string;
}

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(orgId: string) {
    const certs = await this.prisma.certificate.findMany({
      where: { organizationId: orgId },
      orderBy: { validUntil: 'asc' },
    });

    const now = new Date();
    return certs.map((c) => {
      const status: CertStatus = certStatus(c.validUntil, now);
      return {
        ...c,
        computedStatus: status,
      };
    });
  }

  async findOne(orgId: string, id: string) {
    const cert = await this.prisma.certificate.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!cert) throw new NotFoundException('Certificate not found');

    const status: CertStatus = certStatus(cert.validUntil, new Date());
    return {
      ...cert,
      computedStatus: status,
    };
  }

  async create(orgId: string, actorId: string, dto: CreateCertificateDto) {
    if (!dto.name || !dto.number || !dto.validUntil) {
      throw new BadRequestException('Nama sertifikat, nomor, dan masa berlaku wajib diisi.');
    }

    const validUntilDate = new Date(dto.validUntil);
    if (isNaN(validUntilDate.getTime())) {
      throw new BadRequestException('Format tanggal masa berlaku tidak valid.');
    }

    const cert = await this.prisma.certificate.create({
      data: {
        organizationId: orgId,
        type: dto.type,
        name: dto.name,
        number: dto.number,
        issuer: dto.issuer ?? null,
        validUntil: validUntilDate,
        verifyUrl: dto.verifyUrl ?? null,
        fileUrl: dto.fileUrl ?? null,
        isDemo: dto.isDemo ?? false,
      },
    });

    await this.auditService.log({
      organizationId: orgId,
      actorId,
      action: 'CERTIFICATE_CREATED',
      entity: 'Certificate',
      entityId: cert.id,
      newValue: { name: cert.name, number: cert.number, type: cert.type },
    });

    return {
      ...cert,
      computedStatus: certStatus(cert.validUntil),
    };
  }

  async update(orgId: string, actorId: string, id: string, dto: UpdateCertificateDto) {
    await this.findOne(orgId, id);

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.number !== undefined) data.number = dto.number;
    if (dto.issuer !== undefined) data.issuer = dto.issuer;
    if (dto.verifyUrl !== undefined) data.verifyUrl = dto.verifyUrl;
    if (dto.fileUrl !== undefined) data.fileUrl = dto.fileUrl;
    if (dto.validUntil !== undefined) {
      const v = new Date(dto.validUntil);
      if (isNaN(v.getTime())) throw new BadRequestException('Format tanggal masa berlaku tidak valid.');
      data.validUntil = v;
    }

    const updated = await this.prisma.certificate.update({
      where: { id },
      data,
    });

    await this.auditService.log({
      organizationId: orgId,
      actorId,
      action: 'CERTIFICATE_UPDATED',
      entity: 'Certificate',
      entityId: updated.id,
      newValue: data,
    });

    return {
      ...updated,
      computedStatus: certStatus(updated.validUntil),
    };
  }

  async delete(orgId: string, actorId: string, id: string) {
    await this.findOne(orgId, id);

    await this.prisma.certificate.delete({
      where: { id },
    });

    await this.auditService.log({
      organizationId: orgId,
      actorId,
      action: 'CERTIFICATE_DELETED',
      entity: 'Certificate',
      entityId: id,
    });
  }
}
