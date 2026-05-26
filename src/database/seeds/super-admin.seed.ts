import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import pino from 'pino';
import { Repository } from 'typeorm';
import { AppModule } from '../../app.module';
import { Language, Role } from '../../common/enums';
import { User } from '../../users/entities/user.entity';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    censor: '[REDACTED]',
    paths: ['password'],
  },
});

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  const usersRepository = app.get<Repository<User>>(getRepositoryToken(User));

  const email = configService.get<string>('SEED_SUPER_ADMIN_EMAIL')!;
  const password = configService.get<string>('SEED_SUPER_ADMIN_PASSWORD')!;
  const name = configService.get<string>('SEED_SUPER_ADMIN_NAME')!;

  const existing = await usersRepository.findOne({ where: { email } });

  if (existing) {
    logger.info({ email }, 'Super admin already exists');
    await app.close();
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = usersRepository.create({
    name,
    email,
    password: hashed,
    role: Role.SUPER_ADMIN,
    isActive: true,
    preferredLanguage: Language.ES,
  });

  await usersRepository.save(user);
  logger.info({ email, role: Role.SUPER_ADMIN }, 'Super admin created');

  await app.close();
}

seed().catch((err: unknown) => {
  logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Seeder failed');
  process.exit(1);
});
