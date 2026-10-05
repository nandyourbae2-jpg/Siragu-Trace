import {
  IsString, IsEnum, IsOptional, IsArray, IsNumber,
  IsPositive, IsDateString, ValidateNested, ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessEventType } from '@prisma/client';

export class ProcessEventInputDto {
  @IsString()
  lotId!: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity!: number;

  @IsString()
  unit!: string;
}

export class ProcessEventOutputDto {
  /** Leave empty to auto-create a new lot. If provided, updates an existing DRAFT lot. */
  @IsOptional()
  @IsString()
  lotId?: string;

  /** Required if lotId is omitted — used to create the output lot. */
  @IsOptional()
  @IsString()
  lotCode?: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity!: number;

  @IsString()
  unit!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  waste?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  remaining?: number;
}

export class CreateProcessEventDto {
  @IsEnum(ProcessEventType)
  eventType!: ProcessEventType;

  @IsOptional()
  @IsString()
  customEventName?: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsDateString()
  startAt!: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  massBalanceNote?: string;

  @IsOptional()
  @IsArray()
  evidenceUrls?: string[];

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one input lot is required.' })
  @ValidateNested({ each: true })
  @Type(() => ProcessEventInputDto)
  inputs!: ProcessEventInputDto[];

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one output lot is required.' })
  @ValidateNested({ each: true })
  @Type(() => ProcessEventOutputDto)
  outputs!: ProcessEventOutputDto[];
}
