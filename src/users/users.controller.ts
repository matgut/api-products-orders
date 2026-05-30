import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/enums';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear usuario (solo super_admin)' })
  create(@Body() dto: CreateUserDto, @I18nLang() lang: string) {
    return this.usersService.create(dto, lang);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @I18nLang() lang: string,
  ) {
    return this.usersService.findAll(page, limit, lang);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por id' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @I18nLang() lang: string) {
    return this.usersService.findOne(id, lang);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @I18nLang() lang: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.update(id, dto, lang, currentUser);
  }

  @Patch(':id/password')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Cambiar contraseña de usuario' })
  changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangePasswordDto,
    @I18nLang() lang: string,
  ) {
    return this.usersService.changePassword(id, dto, lang);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Activar/desactivar usuario' })
  toggleActive(
    @Param('id', ParseUUIDPipe) id: string,
    @I18nLang() lang: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.toggleActive(id, lang, currentUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar usuario' })
  remove(@Param('id', ParseUUIDPipe) id: string, @I18nLang() lang: string) {
    return this.usersService.remove(id, lang);
  }
}
