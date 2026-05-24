import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('database', (): TypeOrmModuleOptions => {
  const host = process.env.DB_HOST!;
  const port = process.env.DB_PORT ?? '5432';
  const user = encodeURIComponent(process.env.DB_USER!);
  const password = encodeURIComponent(process.env.DB_PASSWORD!);
  const name = process.env.DB_NAME!;
  const ssl = process.env.DB_SSL === 'true';

  const url = `postgresql://${user}:${password}@${host}:${port}/${name}`;

  return {
    type: 'postgres',
    url,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize:
      process.env.DB_SYNC === 'true' ||
      process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    ...(ssl && { ssl: { rejectUnauthorized: false } }),
  };
});
