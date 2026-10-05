import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { AuthenticatedUser } from './auth.types.js';

/**
 * TenantScopeInterceptor — enforces tenant isolation on every request.
 *
 * Attaches `request.organizationId` from the authenticated user so
 * service-layer code can always reference it without reading `request.user`.
 *
 * Also validates that any `organizationId` present in the route params or
 * request body matches the user's own org (prevents cross-tenant writes).
 *
 * Apply globally in AppModule:
 *   { provide: APP_INTERCEPTOR, useClass: TenantScopeInterceptor }
 *
 * Or per-controller:
 *   @UseInterceptors(TenantScopeInterceptor)
 */
@Injectable()
export class TenantScopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      organizationId?: string;
      params?: { organizationId?: string };
      body?: { organizationId?: string };
    }>();

    const user = request.user;

    // Only run on authenticated routes (user is set by JwtAuthGuard).
    if (!user || !user.organizationId) {
      return next.handle();
    }

    // Stamp the org onto the request for easy access in services.
    request.organizationId = user.organizationId;

    // Prevent cross-tenant parameter injection.
    const paramOrgId = request.params?.organizationId;
    const bodyOrgId = request.body?.organizationId;

    if (paramOrgId && paramOrgId !== user.organizationId) {
      throw new ForbiddenException('Cross-tenant access is not allowed.');
    }

    if (bodyOrgId && bodyOrgId !== user.organizationId) {
      throw new ForbiddenException('Cross-tenant access is not allowed.');
    }

    return next.handle();
  }
}
