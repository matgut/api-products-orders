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
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorías por negocio (público)' })
  @ApiQuery({ name: 'businessId', required: true })
  @ApiQuery({ name: 'lang', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('businessId') businessId: string,
    @Query('lang') lang: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @I18nLang() i18nLang: string,
  ) {
    return this.categoriesService.findAll(businessId, lang ?? i18nLang, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener categoría con todas sus traducciones' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @I18nLang() lang: string) {
    return this.categoriesService.findOne(id, lang);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear categoría' })
  create(@Body() dto: CreateCategoryDto, @I18nLang() lang: string) {
    return this.categoriesService.create(dto, lang);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar categoría' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @I18nLang() lang: string,
  ) {
    return this.categoriesService.update(id, dto, lang);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar categoría' })
  remove(@Param('id', ParseUUIDPipe) id: string, @I18nLang() lang: string) {
    return this.categoriesService.remove(id, lang);
  }
}
