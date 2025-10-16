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
  price: z.number().positive('Price must be positive'),
  discountedPrice: z.number().positive().optional(),
  level: CourseLevelEnum,
  language: z.string().min(2, 'Language must be at least 2 characters'),
  categoryId: z.string().uuid('Invalid category ID'),
  prerequisites: z.array(z.string()).optional(),
  learningOutcomes: z
    .array(z.string())
    .min(1, 'At least one learning outcome is required'),
  targetAudience: z.array(z.string()).optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

export const publishCourseSchema = z.object({
  status: CourseStatusEnum,
});

export const getCourseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  level: CourseLevelEnum.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  status: CourseStatusEnum.optional().default('PUBLISHED'),
  instructorId: z.string().uuid().optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'title', 'price', 'enrollmentCount'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export class CreateCourseDto extends createZodDto(createCourseSchema) {}
export class UpdateCourseDto extends createZodDto(updateCourseSchema) {}
export class PublishCourseDto extends createZodDto(publishCourseSchema) {}
export class GetCourseQueryDto extends createZodDto(getCourseQuerySchema) {}
