import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload, JwtPayloadWithRefreshToken } from '../types/auth.types';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh-token',
) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('REFRESH_TOKEN_SECRET');
    if (!secret) {
      throw new Error(
        'REFRESH_TOKEN_SECRET is not defined in environment variables',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): JwtPayloadWithRefreshToken {
    const refreshToken = req.get('authorization')?.replace('Bearer', '').trim();

    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }

    return {
      ...payload,
      refreshToken,
    };
  }
}
