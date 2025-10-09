import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const authDto = z.object({
  email: z.email(),
  password: z.string().min(1, 'Password must be at least 1 characters long'),
});

export class AuthDto extends createZodDto(authDto) {
  email: string;
  password: string;
}
