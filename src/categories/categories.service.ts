import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { Language } from '../common/enums';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryTranslation } from './entities/category-translation.entity';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(CategoryTranslation)
    private readonly translationsRepository: Repository<CategoryTranslation>,
    private readonly i18n: I18nService,
  ) {}

  async create(dto: CreateCategoryDto, lang: string) {
    const category = this.categoriesRepository.create({
      businessId: dto.businessId,
      translations: dto.translations,
    });

    const saved = await this.categoriesRepository.save(category);

    return {
      data: saved,
      message: await this.i18n.translate('common.created', { lang }),
    };
  }

  async findAll(businessId: string, lang: string, page = 1, limit = 10) {
    const queryLang = Object.values(Language).includes(lang as Language)
      ? (lang as Language)
      : Language.ES;

    const [categories, total] = await this.categoriesRepository.findAndCount({
      where: { businessId },
      relations: { translations: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const data = categories.map((cat) => {
      const translation =
        cat.translations.find((t) => t.language === queryLang) ??
        cat.translations[0];
      return {
        id: cat.id,
        businessId: cat.businessId,
        name: translation?.name ?? '',
        description: translation?.description ?? null,
        createdAt: cat.createdAt,
      };
    });

    return {
      data,
      meta: { total, page, limit },
      message: await this.i18n.translate('common.success', { lang }),
    };
  }

  async findOne(id: string, lang: string) {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: { translations: true },
    });

    if (!category) {
      throw new NotFoundException(
        await this.i18n.translate('common.not_found', { lang }),
      );
    }

    return { data: category };
  }

  async update(id: string, dto: UpdateCategoryDto, lang: string) {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: { translations: true },
    });

    if (!category) {
      throw new NotFoundException(
        await this.i18n.translate('common.not_found', { lang }),
      );
    }

    if (dto.businessId) {
      category.businessId = dto.businessId;
    }

    if (dto.translations) {
      // Eliminar traducciones anteriores y reemplazar
      await this.translationsRepository.delete({ category: { id } });
      category.translations = dto.translations.map((t) =>
        this.translationsRepository.create({ ...t, category }),
      );
    }

    const saved = await this.categoriesRepository.save(category);

    return {
      data: saved,
      message: await this.i18n.translate('common.updated', { lang }),
    };
  }

  async remove(id: string, lang: string) {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(
        await this.i18n.translate('common.not_found', { lang }),
      );
    }

    await this.categoriesRepository.remove(category);

    return {
      data: null,
      message: await this.i18n.translate('common.deleted', { lang }),
    };
  }
}
