import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const signupDto = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['STUDENT', 'INSTRUCTOR']).optional().default('STUDENT'),
});

export const signinDto = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export class SignUpDto extends createZodDto(signupDto) {}
export class SignInDto extends createZodDto(signinDto) {}
