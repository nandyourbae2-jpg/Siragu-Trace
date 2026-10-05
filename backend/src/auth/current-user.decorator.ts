import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from './auth.types.js';

/**
 * Parameter decorator that extracts the authenticated user from the request.
 *
 * @example
 *   @Get('me')
 *   getProfile(@CurrentUser() user: AuthenticatedUser) {
 *     return user;
 *   }
 *
 *   // Extract a specific field:
 *   @Get('lots')
 *   findAll(@CurrentUser('organizationId') orgId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);
