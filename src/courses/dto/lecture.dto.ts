import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LectureTypeEnum = z.enum(['VIDEO', 'ARTICLE', 'QUIZ', 'RESOURCE']);

export const createLectureSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be at most 100 characters'),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional(),
  type: LectureTypeEnum.default('VIDEO'),
  duration: z.number().int().min(0).default(0),
  order: z.number().int().positive().optional(), // Will be auto-assigned if not provided
  isFree: z.boolean().default(false),
  videoUrl: z.string().url().optional(),
  hlsUrl: z.string().url().optional(),
  thumbnail: z.string().url().optional(),
  articleContent: z.string().optional(),
  resourceUrl: z.string().url().optional(),
});

export const updateLectureSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be at most 100 characters')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional(),
  type: LectureTypeEnum.optional(),
  duration: z.number().int().min(0).optional(),
  order: z.number().int().positive().optional(),
  isFree: z.boolean().optional(),
  videoUrl: z.string().url().optional(),
  hlsUrl: z.string().url().optional(),
  thumbnail: z.string().url().optional(),
  articleContent: z.string().optional(),
  resourceUrl: z.string().url().optional(),
});

export class CreateLectureDto extends createZodDto(createLectureSchema) {}
export class UpdateLectureDto extends createZodDto(updateLectureSchema) {}
