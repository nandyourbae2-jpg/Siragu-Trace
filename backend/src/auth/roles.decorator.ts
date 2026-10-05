import { SetMetadata } from '@nestjs/common';
import type { Role } from './auth.types.js';

export const ROLES_KEY = 'siragu:roles';

/**
 * Decorator to restrict a route to specific roles.
 *
 * @example
 *   @Roles(Role.OWNER, Role.OPERATOR)
 *   @Post('lots')
 *   create() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
