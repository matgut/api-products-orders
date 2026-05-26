import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';
import { Language, Role } from '../../common/enums';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, description: 'Mínimo 8 caracteres, 1 mayúscula, 1 número, 1 carácter especial' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
    message: 'password must contain at least 1 uppercase letter, 1 number and 1 special character',
  })
  password!: string;

  @ApiPropertyOptional({ enum: Role, default: Role.ADMIN })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({ enum: Language, default: Language.ES })
  @IsEnum(Language)
  @IsOptional()
  preferredLanguage?: Language;

  @ApiPropertyOptional({ description: 'UUID del negocio asignado (null para super_admin)' })
  @IsUUID()
  @IsOptional()
  businessId?: string;
}
