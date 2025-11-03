import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createSectionSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(80, 'Title must be at most 80 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  order: z.number().int().positive().optional(), // Will be auto-assigned if not provided
});

export const updateSectionSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(80, 'Title must be at most 80 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  order: z.number().int().positive().optional(),
});

export class CreateSectionDto extends createZodDto(createSectionSchema) {}
export class UpdateSectionDto extends createZodDto(updateSectionSchema) {}
