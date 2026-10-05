import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { LotStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class ListLotsQueryDto {
  @IsOptional()
  @IsEnum(LotStatus)
  status?: LotStatus;

  @IsOptional()
  @IsString()
  search?: string;  // Searches lotCode + productName

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
