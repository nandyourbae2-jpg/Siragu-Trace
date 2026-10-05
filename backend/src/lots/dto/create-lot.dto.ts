import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  MinLength,
  IsPositive,
  IsObject,
} from 'class-validator';
import { LotStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateLotDto {
  @IsString()
  @MinLength(1)
  lotCode!: string;

  @IsString()
  @MinLength(1)
  productName!: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity!: number;

  @IsString()
  @MinLength(1)
  unit!: string;

  @IsOptional()
  @IsEnum(LotStatus)
  status?: LotStatus;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
