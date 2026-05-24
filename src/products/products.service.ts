import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { v2 as cloudinary } from 'cloudinary';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { Language } from '../common/enums';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductTranslation } from './entities/product-translation.entity';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductTranslation)
    private readonly translationsRepository: Repository<ProductTranslation>,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('cloudinary.cloudName'),
      api_key: this.configService.get<string>('cloudinary.apiKey'),
      api_secret: this.configService.get<string>('cloudinary.apiSecret'),
    });
  }

  async create(dto: CreateProductDto, lang: string) {
    const product = this.productsRepository.create({
      businessId: dto.businessId,
      categoryId: dto.categoryId,
      price: dto.price,
      available: dto.available ?? true,
      stock: dto.stock,
      translations: dto.translations,
    });

    const saved = await this.productsRepository.save(product);

    return {
      data: saved,
      message: await this.i18n.translate('products.created', { lang }),
    };
  }

  async findAll(
    businessId: string,
    lang: string,
    categoryId?: string,
    page = 1,
    limit = 10,
  ) {
    const queryLang = Object.values(Language).includes(lang as Language)
      ? (lang as Language)
      : Language.ES;

    const qb = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.translations', 'translation')
      .where('product.businessId = :businessId', { businessId })
      .andWhere('product.available = true');

    if (categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    const [products, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('product.createdAt', 'DESC')
      .getManyAndCount();

    const data = products.map((p) => {
      const translation =
        p.translations.find((t) => t.language === queryLang) ??
        p.translations[0];
      return {
        id: p.id,
        businessId: p.businessId,
        categoryId: p.categoryId,
        price: p.price,
        imageUrl: p.imageUrl,
        available: p.available,
        stock: p.stock,
        name: translation?.name ?? '',
        description: translation?.description ?? null,
        createdAt: p.createdAt,
      };
    });

    return {
      data,
      meta: { total, page, limit },
      message: await this.i18n.translate('products.list', { lang }),
    };
  }

  async findOne(id: string, lang: string) {
    const queryLang = Object.values(Language).includes(lang as Language)
      ? (lang as Language)
      : Language.ES;

    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { translations: true, category: { translations: true } },
    });

    if (!product) {
      throw new NotFoundException(
        await this.i18n.translate('products.not_found', { lang }),
      );
    }

    const translation =
      product.translations.find((t) => t.language === queryLang) ??
      product.translations[0];

    return {
      data: {
        ...product,
        name: translation?.name ?? '',
        description: translation?.description ?? null,
      },
    };
  }

  async update(id: string, dto: UpdateProductDto, lang: string) {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { translations: true },
    });

    if (!product) {
      throw new NotFoundException(
        await this.i18n.translate('products.not_found', { lang }),
      );
    }

    const { translations, ...rest } = dto;
    Object.assign(product, rest);

    if (translations) {
      await this.translationsRepository.delete({ product: { id } });
      product.translations = translations.map((t) =>
        this.translationsRepository.create({ ...t, product }),
      );
    }

    const saved = await this.productsRepository.save(product);

    return {
      data: saved,
      message: await this.i18n.translate('products.updated', { lang }),
    };
  }

  async remove(id: string, lang: string) {
    const product = await this.productsRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(
        await this.i18n.translate('products.not_found', { lang }),
      );
    }

    await this.productsRepository.remove(product);

    return {
      data: null,
      message: await this.i18n.translate('products.deleted', { lang }),
    };
  }

  async uploadImage(id: string, file: Express.Multer.File, lang: string) {
    const product = await this.productsRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(
        await this.i18n.translate('products.not_found', { lang }),
      );
    }

    const result = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: 'products', resource_type: 'image' },
            (error, result) => {
              if (error || !result) return reject(error);
              resolve(result as { secure_url: string });
            },
          )
          .end(file.buffer);
      },
    );

    product.imageUrl = result.secure_url;
    const saved = await this.productsRepository.save(product);

    return {
      data: saved,
      message: await this.i18n.translate('products.image_uploaded', { lang }),
    };
  }

  async findByIdRaw(id: string): Promise<Product | null> {
    return this.productsRepository.findOne({
      where: { id },
      relations: { translations: true },
    });
  }
}
