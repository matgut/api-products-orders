import { MailerOptions } from '@nestjs-modules/mailer';
import { registerAs } from '@nestjs/config';
import { join } from 'path';

// HandlebarsAdapter se importa en runtime para evitar problemas con la resolución de módulos nodenext
// eslint-disable-next-line @typescript-eslint/no-require-imports
const HandlebarsAdapterPkg = require('@nestjs-modules/mailer/adapters/handlebars.adapter') as {
  HandlebarsAdapter: new () => { compile(mail: Record<string, unknown>, callback: CallableFunction, mailerOptions: Record<string, unknown>): void };
};

export default registerAs(
  'mail',
  (): MailerOptions => ({
    transport: {
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT ?? '465', 10),
      secure: parseInt(process.env.MAIL_PORT ?? '465', 10) === 465,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    },
    defaults: {
      from: process.env.MAIL_FROM,
    },
    template: {
      dir: join(__dirname, '../notifications/templates'),
      adapter: new HandlebarsAdapterPkg.HandlebarsAdapter(),
      options: {
        strict: true,
      },
    },
  }),
);
