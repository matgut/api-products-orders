import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    Matches,
} from 'class-validator';
import { Language } from '../../common/enums';

export class CreateBusinessDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Slug único (solo letras, números y guiones)' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener letras minúsculas, números y guiones',
  })
  slug!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsEmail()
  notificationEmail!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notificationWhatsapp?: string;

  @ApiPropertyOptional({ enum: Language, default: Language.ES })
  @IsEnum(Language)
  @IsOptional()
  defaultLanguage?: Language;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  notifyViaEmail?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  notifyViaWhatsapp?: boolean;
}
