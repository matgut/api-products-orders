import { randomUUID } from 'crypto';

type LoggerEnv = {
  NODE_ENV?: string;
  LOG_LEVEL?: string;
};

export function buildPinoHttpOptions(env: LoggerEnv) {
  const isProduction = env.NODE_ENV === 'production';

  const options: any = {
    level: env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
    transport: isProduction
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
    redact: {
      censor: '[REDACTED]',
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers.set-cookie',
        'req.body',
        'req.body.password',
        'req.body.newPassword',
        'req.body.currentPassword',
        'req.body.oldPassword',
        'req.body.refreshToken',
        'req.body.accessToken',
        'req.body.token',
      ],
    },
    autoLogging: true,
    quietReqLogger: true,
    customAttributeKeys: {
      req: 'request',
      res: 'response',
      err: 'error',
      responseTime: 'durationMs',
    },
    genReqId: (
      req: { headers: Record<string, unknown> },
      res: { setHeader: (name: string, value: string) => void },
    ) => {
      const requestIdHeader = req.headers['x-request-id'];
      const requestId =
        typeof requestIdHeader === 'string' && requestIdHeader.trim().length > 0
          ? requestIdHeader.trim()
          : randomUUID();

      res.setHeader('x-request-id', requestId);
      return requestId;
    },
    customProps: (req: {
      id?: string;
      method?: string;
      url?: string;
      user?: { id?: string; businessId?: string; role?: string };
    }, _res: unknown) => ({
      requestId: req.id,
      userId: req.user?.id,
      businessId: req.user?.businessId,
      role: req.user?.role,
      method: req.method,
      path: req.url,
    }),
    customLogLevel: (_req: unknown, res: { statusCode?: number }, err?: Error) => {
      if (err || (res.statusCode ?? 0) >= 500) return 'error';
      if ((res.statusCode ?? 0) >= 400) return 'warn';
      return 'info';
    },
    serializers: {
      // Solo metadata útil; nunca cuerpos completos.
      req: (req: {
        id?: string;
        method?: string;
        url?: string;
        params?: Record<string, unknown>;
        query?: Record<string, unknown>;
        user?: { id?: string; businessId?: string; role?: string };
      }) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        params: req.params,
        query: req.query,
        userId: req.user?.id,
        businessId: req.user?.businessId,
        role: req.user?.role,
      }),
      // No registramos response.body; solo statusCode para trazabilidad.
      res: (res: { statusCode?: number }) => ({
        statusCode: res.statusCode,
      }),
    },
  };

  return options;
}