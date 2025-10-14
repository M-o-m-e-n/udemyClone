import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CourseLevelEnum = z.enum([
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'ALL_LEVELS',
]);
export const CourseStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  subtitle: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  thumbnail: z.string().url('Invalid thumbnail URL').optional(),
  promoVideo: z.string().url('Invalid promo video URL').optional(),
  price: z.number().min(0).default(0),
  discountedPrice: z.number().min(0).optional(),
  level: CourseLevelEnum.default('ALL_LEVELS'),
  language: z.string().default('en'),
  categoryId: z.string().uuid('Invalid category ID'),
  prerequisites: z.array(z.string()).optional().default([]),
  learningOutcomes: z
    .array(z.string())
    .min(1, 'At least one learning outcome required'),
  targetAudience: z.array(z.string()).optional().default([]),
});

// Update Course DTO
export const updateCourseSchema = z.object({
  title: z.string().min(3).optional(),
  subtitle: z.string().optional(),
  description: z.string().min(10).optional(),
  thumbnail: z.string().url('Invalid thumbnail URL').optional(),
  promoVideo: z.string().url('Invalid promo video URL').optional(),
  price: z.number().min(0).optional(),
  discountedPrice: z.number().min(0).optional(),
  level: CourseLevelEnum.optional(),
  language: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  prerequisites: z.array(z.string()).optional(),
  learningOutcomes: z.array(z.string()).optional(),
  targetAudience: z.array(z.string()).optional(),
});

// Publish Course DTO
export const publishCourseSchema = z.object({
  status: CourseStatusEnum,
});

// Query/Filter DTO
export const getCourseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  level: CourseLevelEnum.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  status: CourseStatusEnum.optional(),
  instructorId: z.string().uuid().optional(),
  sortBy: z
    .enum(['createdAt', 'price', 'averageRating', 'totalStudents'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export class CreateCourseDto extends createZodDto(createCourseSchema) {}
export class UpdateCourseDto extends createZodDto(updateCourseSchema) {}
export class PublishCourseDto extends createZodDto(publishCourseSchema) {}
export class GetCourseQueryDto extends createZodDto(getCourseQuerySchema) {}
