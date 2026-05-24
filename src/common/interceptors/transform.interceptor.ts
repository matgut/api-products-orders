import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((value) => {
        // Si el servicio ya devuelve { data, message, meta }, lo pasamos tal cual
        if (value && typeof value === 'object' && 'data' in value) {
          return value as ApiResponse<T>;
        }
        return { data: value } as ApiResponse<T>;
      }),
    );
  }
}
