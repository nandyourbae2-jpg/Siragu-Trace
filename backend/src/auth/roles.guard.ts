import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser } from './auth.types.js';
import { ROLES_KEY } from './roles.decorator.js';
import { Role } from './auth.types.js';

/**
 * RolesGuard — checks that the authenticated user has at least one of the
 * roles specified via the @Roles() decorator.
 *
 * IMPORTANT: Always apply AFTER JwtAuthGuard so request.user is populated.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles(Role.OWNER, Role.OPERATOR)
 *   @Post('lots')
 *   create() { ... }
 */
/**
 * Role hierarchy:
 *   OWNER   → may do anything staff can do (ADMIN/OPERATOR/QA/MANAGER routes).
 *   MANAGER → inherits OPERATOR and QA permissions (supervises both).
 * BUYER and CONSUMER never inherit staff permissions.
 */
export function effectiveRoles(role: Role): Role[] {
  if (role === Role.OWNER) return [Role.OWNER, Role.MANAGER, Role.OPERATOR, Role.QA, Role.ADMIN];
  if (role === Role.MANAGER) return [Role.MANAGER, Role.OPERATOR, Role.QA];
  return [role];
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no @Roles() decorator is present, allow all authenticated users.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    const { user } = request;

    if (!user) return false;

    const userEffectiveRoles = effectiveRoles(user.role as Role);
    const hasRole = userEffectiveRoles.some((r) => requiredRoles.includes(r));
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${requiredRoles.join(', ')}. Your role: ${user.role}.`,
      );
    }

    return true;
  }
}
