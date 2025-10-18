import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createSectionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  order: z.number().int().positive(),
});

export const updateSectionSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  order: z.number().int().positive().optional(),
});

export class CreateSectionDto extends createZodDto(createSectionSchema) {}
export class UpdateSectionDto extends createZodDto(updateSectionSchema) {}
