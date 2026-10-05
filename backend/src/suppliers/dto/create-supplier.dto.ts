import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';

export class CreateSupplierDto {
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsEmail()  contactEmail?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() address?: string;
}
