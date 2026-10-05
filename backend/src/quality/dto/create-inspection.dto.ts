import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { QualityStatus } from '@prisma/client';

export class CreateInspectionDto {
  @IsString()
  lotId!: string;

  @IsOptional()
  @IsString()
  sampleId?: string;

  @IsString()
  testMethod!: string;

  @IsString()
  result!: string;

  @IsOptional()
  @IsString()
  specificationReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(QualityStatus)
  status?: QualityStatus;
}
