import { IsString, IsEnum, IsOptional } from 'class-validator';
import { VisibilityLevel } from '@prisma/client';

export class CreateEvidenceDto {
  @IsString()
  fileName!: string;

  @IsString()
  documentUrl!: string;

  @IsString()
  documentType!: string;

  @IsOptional()
  @IsEnum(VisibilityLevel)
  visibility?: VisibilityLevel;

  @IsOptional()
  @IsString()
  lotId?: string;

  @IsOptional()
  @IsString()
  processEventId?: string;

  @IsOptional()
  @IsString()
  inspectionId?: string;
}
