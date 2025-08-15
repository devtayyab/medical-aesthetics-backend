import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private eventEmitter: EventEmitter2) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;

    return next.handle().pipe(
      tap((response) => {
        // Skip GET requests for audit logging
        if (method !== 'GET') {
          this.eventEmitter.emit('audit.log', {
            userId: user?.id,
            action: `${method} ${url}`,
            resource: this.extractResourceFromUrl(url),
            data: { body, response },
            timestamp: new Date(),
            ip: request.ip,
            userAgent: request.get('user-agent'),
          });
        }
      }),
    );
  }

  private extractResourceFromUrl(url: string): string {
    const parts = url.split('/');
    return parts[1] || 'unknown';
  }
}