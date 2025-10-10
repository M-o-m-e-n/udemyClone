import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const signUpDto = z.object({
  email: z.email(),
  password: z.string().min(1, 'Password must be at least 1 character long'), // Must be changed later
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']),
});

export const signInDto = z.object({
  email: z.email(),
  password: z.string().min(1, 'Password must be at least 1 character long'), // Must be changed later
});

export class SignUpDto extends createZodDto(signUpDto) {
  email: string;
  password: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
}

export class SignInDto extends createZodDto(signInDto) {
  email: string;
  password: string;
}
