import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsOptional,
    IsUUID,
    ValidateNested,
} from 'class-validator';
import { CategoryTranslationDto } from './create-category.dto';

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  businessId?: string;

  @ApiPropertyOptional({ type: [CategoryTranslationDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CategoryTranslationDto)
  translations?: CategoryTranslationDto[];
}
