import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsDateString,
    IsEmail,
    IsEnum,
    IsInt,
    IsOptional,
    IsPositive,
    IsString,
    IsUUID,
    ValidateNested,
} from 'class-validator';
import { Language } from '../../common/enums';

export class CreateOrderItemDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  customerName!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '2026-06-15' })
  @IsDateString()
  deliveryDate!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty()
  @IsUUID()
  businessId!: string;

  @ApiProperty({ enum: Language, default: Language.ES })
  @IsEnum(Language)
  @IsOptional()
  language?: Language;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
