import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload, JwtPayloadWithRefreshToken } from '../../types/auth.types';

interface RequestWithUser extends Request {
  user: JwtPayload | JwtPayloadWithRefreshToken;
}

export const GetCurrentUser = createParamDecorator(
  (
    data: keyof (JwtPayload & JwtPayloadWithRefreshToken) | undefined,
    context: ExecutionContext,
  ): JwtPayload | JwtPayloadWithRefreshToken | string | number | undefined => {
    const request: RequestWithUser = context
      .switchToHttp()
      .getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (data === undefined) {
      return user;
    }

    const value = (user as any)[data];

    if (value === undefined) {
      throw new UnauthorizedException(`User property '${data}' not found`);
    }

    return value;
  },
);
