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

export const GetCurrentUserId = createParamDecorator(
  (data: undefined, context: ExecutionContext): string => {
    const request: RequestWithUser = context
      .switchToHttp()
      .getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('User not authenticated');
    }

    return user.sub;
  },
);
