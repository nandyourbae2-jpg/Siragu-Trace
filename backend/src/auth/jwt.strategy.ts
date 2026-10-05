import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload, AuthenticatedUser } from './auth.types.js';
import { Role } from './auth.types.js';

/**
 * JWT Strategy — validates the Bearer token on every protected request.
 * The validated payload is attached to `request.user` as AuthenticatedUser.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      email: payload.email,
      name: '', // Fetched separately when needed
      role: payload.role as Role,
      organizationId: payload.organizationId,
      // organizationName is not in the JWT payload (keep tokens small)
      // Callers who need it can load from DB via PrismaService.
      organizationName: null,
    };
  }
}
