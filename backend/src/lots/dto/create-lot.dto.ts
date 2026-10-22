import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  MinLength,
  IsPositive,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { LotStatus, LotType, BpomType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateLotDto {
  @IsString()
  @MinLength(1)
  lotCode!: string;

  @IsString()
  @MinLength(1)
  productName!: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  grossWeight?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  tareWeight?: number;

  @IsString()
  @MinLength(1)
  unit!: string;

  @IsOptional()
  @IsEnum(LotStatus)
  status?: LotStatus;

  @IsOptional()
  @IsEnum(LotType)
  lotType?: LotType;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsEnum(BpomType)
  bpomType?: BpomType;

  @IsOptional()
  @IsString()
  bpomNumber?: string;

  @IsOptional()
  @IsString()
  halalCertId?: string;

  @IsOptional()
  @IsString()
  distributorName?: string;

  @IsOptional()
  @IsBoolean()
  isDemo?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
