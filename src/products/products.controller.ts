import {
  BadRequestException,
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { I18nLang } from 'nestjs-i18n';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const imageFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
    return callback(
      new BadRequestException('Only JPEG, PNG and WebP images are allowed'),
      false,
    );
  }
  callback(null, true);
};

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos por negocio (público)' })
  @ApiQuery({ name: 'businessId', required: true })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'lang', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('businessId') businessId: string,
    @Query('categoryId') categoryId: string,
    @Query('lang') lang: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @I18nLang() i18nLang: string,
  ) {
    return this.productsService.findAll(
      businessId,
      lang ?? i18nLang,
      categoryId,
      page,
      limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por id (público)' })
  @ApiQuery({ name: 'lang', required: false })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('lang') lang: string,
    @I18nLang() i18nLang: string,
  ) {
    return this.productsService.findOne(id, lang ?? i18nLang);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear producto' })
  create(
    @Body() dto: CreateProductDto,
    @I18nLang() lang: string,
    @CurrentUser() user: User,
  ) {
    return this.productsService.create(dto, lang, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar producto' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @I18nLang() lang: string,
    @CurrentUser() user: User,
  ) {
    return this.productsService.update(id, dto, lang, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar producto' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @I18nLang() lang: string,
    @CurrentUser() user: User,
  ) {
    return this.productsService.remove(id, lang, user);
  }

  @Post(':id/image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subir imagen de producto' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: MAX_IMAGE_SIZE },
    fileFilter: imageFileFilter,
  }))
  uploadImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @I18nLang() lang: string,
    @CurrentUser() user: User,
  ) {
    return this.productsService.uploadImage(id, file, lang, user);
  }
}
