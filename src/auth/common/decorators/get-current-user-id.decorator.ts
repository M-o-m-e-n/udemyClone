import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetCurrentUserId = createParamDecorator(
  (data: undefined, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest();

    console.log('=== GET CURRENT USER ID ===');
    console.log('Request user:', request.user);
    console.log('User ID:', request.user?.userId);
    console.log('===========================');

    return request.user?.userId;
  },
);
