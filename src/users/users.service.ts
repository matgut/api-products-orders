import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly i18n: I18nService,
  ) {}

  async create(dto: CreateUserDto, lang: string) {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(
        await this.i18n.translate('common.conflict', { lang }),
      );
    }

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = this.usersRepository.create({ ...dto, password: hashed });
    const saved = await this.usersRepository.save(user);

    return {
      data: saved,
      message: await this.i18n.translate('common.created', { lang }),
    };
  }

  async findAll(page = 1, limit = 10, lang: string) {
    const [data, total] = await this.usersRepository.findAndCount({
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

  async findOne(id: string, lang: string) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(
        await this.i18n.translate('common.not_found', { lang }),
      );
    }

    return { data: user };
  }

  async update(id: string, dto: UpdateUserDto, lang: string, currentUser: User) {
    this.assertNotSelf(id, currentUser);

    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(
        await this.i18n.translate('common.not_found', { lang }),
      );
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.usersRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException(
          await this.i18n.translate('common.conflict', { lang }),
        );
      }
    }

    // Nunca actualizar password desde aquí
    const { password: _p, ...safeDto } = dto as UpdateUserDto & {
      password?: string;
    };
    Object.assign(user, safeDto);
    const saved = await this.usersRepository.save(user);

    return {
      data: saved,
      message: await this.i18n.translate('common.updated', { lang }),
    };
  }

  async changePassword(id: string, dto: ChangePasswordDto, lang: string) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(
        await this.i18n.translate('common.not_found', { lang }),
      );
    }

    user.password = await bcrypt.hash(dto.newPassword, 12);
    await this.usersRepository.save(user);

    return {
      data: null,
      message: await this.i18n.translate('common.updated', { lang }),
    };
  }

  async toggleActive(id: string, lang: string, currentUser: User) {
    this.assertNotSelf(id, currentUser);

    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(
        await this.i18n.translate('common.not_found', { lang }),
      );
    }

    user.isActive = !user.isActive;
    const saved = await this.usersRepository.save(user);

    return {
      data: saved,
      message: await this.i18n.translate('common.updated', { lang }),
    };
  }

  async remove(id: string, lang: string) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(
        await this.i18n.translate('common.not_found', { lang }),
      );
    }

    await this.usersRepository.remove(user);

    return {
      data: null,
      message: await this.i18n.translate('common.deleted', { lang }),
    };
  }

  private assertNotSelf(targetId: string, currentUser: User): void {
    if (targetId === currentUser.id) {
      throw new ForbiddenException('No puedes modificar tu propia cuenta');
    }
  }
}
