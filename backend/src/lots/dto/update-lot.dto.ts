import { IsEnum, IsNumber, IsObject, IsOptional, IsPositive, IsString } from 'class-validator';
import { LotStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateLotDto {
  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsEnum(LotStatus)
  status?: LotStatus;

  @IsOptional()
  @IsString()
  locationId?: string | null;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  note?: string;  // Reason for change (written to LotEvent)
}
