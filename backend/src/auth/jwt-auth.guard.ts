import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard — apply to any controller or route that requires authentication.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('lots')
 *   findAll() { ... }
 *
 * Or register globally in app.module.ts as APP_GUARD.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
