import {
    Injectable,
    NotFoundException,
    OnModuleInit,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { IsNull, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from './entities/refresh-token.entity';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  // Pre-computado al arranque para prevenir timing attacks en login
  private dummyHash!: string;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  async onModuleInit() {
    this.dummyHash = await bcrypt.hash('_dummy_timing_protection_', 12);
  }

  async login(dto: LoginDto, lang: string) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    // Siempre ejecutar bcrypt.compare para prevenir timing-based user enumeration.
    // Si el usuario no existe, comparar contra un hash dummy (igual costo computacional).
    const hashToCheck = user?.password ?? this.dummyHash;
    const isMatch = await bcrypt.compare(dto.password, hashToCheck);

    if (!user || !isMatch) {
      throw new UnauthorizedException(
        await this.i18n.translate('auth.invalid_credentials', { lang }),
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        await this.i18n.translate('auth.account_inactive', { lang }),
      );
    }

    const tokens = await this.generateTokens(user);

    return {
      data: {
        user,
        ...tokens,
      },
      message: await this.i18n.translate('auth.login_success', { lang }),
    };
  }

  async refresh(rawRefreshToken: string, lang: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(rawRefreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        await this.i18n.translate('auth.token_invalid', { lang }),
      );
    }

    const tokenRecord = await this.refreshTokensRepository.findOne({
      where: { userId: payload.sub },
      order: { createdAt: 'DESC' },
    });

    if (!tokenRecord || tokenRecord.revokedAt) {
      throw new UnauthorizedException(
        await this.i18n.translate('auth.token_invalid', { lang }),
      );
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException(
        await this.i18n.translate('auth.token_invalid', { lang }),
      );
    }

    const isMatch = await bcrypt.compare(rawRefreshToken, tokenRecord.token);
    if (!isMatch) {
      throw new UnauthorizedException(
        await this.i18n.translate('auth.token_invalid', { lang }),
      );
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        await this.i18n.translate('auth.token_invalid', { lang }),
      );
    }

    // Revocar token anterior
    tokenRecord.revokedAt = new Date();
    await this.refreshTokensRepository.save(tokenRecord);

    const tokens = await this.generateTokens(user);

    return {
      data: tokens,
      message: await this.i18n.translate('auth.token_refreshed', { lang }),
    };
  }

  async logout(userId: string, lang: string) {
    await this.refreshTokensRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    return {
      data: null,
      message: await this.i18n.translate('auth.logout_success', { lang }),
    };
  }

  async me(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException();
    }

    return { data: user };
  }

  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET') as string,
      expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '8h') as unknown as number,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') as string,
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as unknown as number,
    });

    const expiresInDays = parseInt(
      (
        this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d'
      ).replace('d', ''),
      10,
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const hashedToken = await bcrypt.hash(refreshToken, 10);

    const tokenRecord = this.refreshTokensRepository.create({
      userId: user.id,
      token: hashedToken,
      expiresAt,
    });
    await this.refreshTokensRepository.save(tokenRecord);

    return { accessToken, refreshToken };
  }
}
