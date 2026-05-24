import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
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

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ enum: Role, default: Role.ADMIN })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({ enum: Language, default: Language.ES })
  @IsEnum(Language)
  @IsOptional()
  preferredLanguage?: Language;
}
