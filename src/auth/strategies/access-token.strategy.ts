import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/auth.types';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'access-token',
) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('ACCESS_TOKEN_SECRET');
    if (!secret) {
      throw new Error(
        'ACCESS_TOKEN_SECRET is not defined in environment variables',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return {
      sub: payload.sub,
      email: payload.email,
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}
