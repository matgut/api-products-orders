import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { v2 as cloudinary } from 'cloudinary';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business } from './entities/business.entity';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('cloudinary.cloudName'),
      api_key: this.configService.get<string>('cloudinary.apiKey'),
      api_secret: this.configService.get<string>('cloudinary.apiSecret'),
    });
  }

  async create(dto: CreateBusinessDto, lang: string) {
    const existing = await this.businessRepository.findOne({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(
        await this.i18n.translate('common.conflict', { lang }),
      );
    }

    const business = this.businessRepository.create(dto);
    const saved = await this.businessRepository.save(business);

    return {
      data: saved,
      message: await this.i18n.translate('common.created', { lang }),
    };
  }

  async findAll(page = 1, limit = 10, lang: string) {
    const [data, total] = await this.businessRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      meta: { total, page, limit },
      message: await this.i18n.translate('common.success', { lang }),
    };
  }

  async findBySlug(slug: string, lang: string) {
    const business = await this.businessRepository.findOne({ where: { slug } });

    if (!business) {
      throw new NotFoundException(
        await this.i18n.translate('common.not_found', { lang }),
      );
    }

    return { data: business };
  }

  async findOne(id: string, lang: string) {
    const business = await this.businessRepository.findOne({ where: { id } });

    if (!business) {
      throw new NotFoundException(
        await this.i18n.translate('common.not_found', { lang }),
      );
    }

    return { data: business };
  }

  async update(id: string, dto: UpdateBusinessDto, lang: string) {
    const business = await this.businessRepository.findOne({ where: { id } });

    if (!business) {
      throw new NotFoundException(
        await this.i18n.translate('common.not_found', { lang }),
      );
    }

    if (dto.slug && dto.slug !== business.slug) {
      const existing = await this.businessRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException(
          await this.i18n.translate('common.conflict', { lang }),
        );
      }
    }

    Object.assign(business, dto);
    const saved = await this.businessRepository.save(business);

    return {
      data: saved,
      message: await this.i18n.translate('common.updated', { lang }),
    };
  }

  async uploadLogo(
    id: string,
    file: Express.Multer.File,
    lang: string,
  ) {
    const business = await this.businessRepository.findOne({ where: { id } });

    if (!business) {
      throw new NotFoundException(
        await this.i18n.translate('common.not_found', { lang }),
      );
    }

    const result = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: 'businesses/logos', resource_type: 'image' },
            (error, result) => {
              if (error || !result) return reject(error);
              resolve(result as { secure_url: string });
            },
          )
          .end(file.buffer);
      },
    );

    business.logoUrl = result.secure_url;
    const saved = await this.businessRepository.save(business);

    return {
      data: saved,
      message: await this.i18n.translate('common.updated', { lang }),
    };
  }
}
