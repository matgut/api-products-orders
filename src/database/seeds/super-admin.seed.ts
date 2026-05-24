import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AppModule } from '../../app.module';
import { Language, Role } from '../../common/enums';
import { User } from '../../users/entities/user.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  const usersRepository = app.get<Repository<User>>(getRepositoryToken(User));

  const email = configService.get<string>('SEED_SUPER_ADMIN_EMAIL')!;
  const password = configService.get<string>('SEED_SUPER_ADMIN_PASSWORD')!;
  const name = configService.get<string>('SEED_SUPER_ADMIN_NAME')!;

  const existing = await usersRepository.findOne({ where: { email } });

  if (existing) {
    console.log(`Super admin already exists: ${email}`);
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
  console.log(`✅ Super admin created: ${email}`);

  await app.close();
}

seed().catch((err: unknown) => {
  console.error('Seeder failed:', err);
  process.exit(1);
});
