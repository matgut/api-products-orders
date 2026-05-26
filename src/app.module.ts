import { MailerModule } from '@nestjs-modules/mailer';
import { Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { LoggerModule } from 'nestjs-pino';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { BusinessModule } from './business/business.module';
import { CategoriesModule } from './categories/categories.module';
import cloudinaryConfig from './config/cloudinary.config';
import databaseConfig from './config/database.config';
import { validationSchema } from './config/env-validation';
import { buildPinoHttpOptions } from './config/logger.config';
import mailConfig from './config/mail.config';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, cloudinaryConfig, mailConfig],
      validationSchema,
      envFilePath: '.env',
    }),

    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        forRoutes: [{ path: '*path', method: RequestMethod.ALL }],
        pinoHttp: buildPinoHttpOptions({
          NODE_ENV: config.get<string>('NODE_ENV'),
          LOG_LEVEL: config.get<string>('LOG_LEVEL'),
        }),
      }),
    }),

    // Rate limiting global — límite permisivo para endpoints normales
    ThrottlerModule.forRoot([{ name: 'global', ttl: 60000, limit: 120 }]),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('database')!,
    }),

    I18nModule.forRootAsync({
      useFactory: () => ({
        fallbackLanguage: 'es',
        disableMiddleware: true,
        loaderOptions: {
          path: join(__dirname, '/i18n/'),
          watch: true,
        },
      }),
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),

    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('mail')!,
    }),

    AuthModule,
    UsersModule,
    BusinessModule,
    CategoriesModule,
    ProductsModule,
    OrdersModule,
    NotificationsModule,
  ],
})
export class AppModule {}

