import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CourseLevelEnum = z.enum([
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'ALL_LEVELS',
]);

export const CourseStatusEnum = z.enum([
  'DRAFT',
  'UNDER_REVIEW',
  'PUBLISHED',
  'ARCHIVED',
]);

export const createCourseSchema = z
  .object({
    title: z
      .string()
      .min(10, 'Title must be at least 10 characters')
      .max(100, 'Title must be at most 100 characters'),
    subtitle: z
      .string()
      .max(200, 'Subtitle must be at most 200 characters')
      .optional(),
    description: z
      .string()
      .min(200, 'Description must be at least 200 characters'),
    thumbnail: z.string().url('Invalid thumbnail URL').optional(),
    promoVideo: z.string().url('Invalid promo video URL').optional(),
    price: z
      .number()
      .min(0, 'Price must be non-negative')
      .max(199.99, 'Price must be at most $199.99'),
    discountedPrice: z
      .number()
      .min(0, 'Discounted price must be non-negative')
      .max(199.99, 'Discounted price must be at most $199.99')
      .optional(),
    level: CourseLevelEnum,
    language: z
      .string()
      .min(2, 'Language must be at least 2 characters')
      .max(10, 'Language must be at most 10 characters'),
    categoryId: z.string().uuid('Invalid category ID'),
    prerequisites: z.array(z.string()).optional(),
    learningOutcomes: z
      .array(z.string())
      .min(4, 'At least 4 learning outcomes are required')
      .max(10, 'At most 10 learning outcomes allowed'),
    targetAudience: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // If discounted price is provided, it must be less than regular price
      if (data.discountedPrice && data.discountedPrice >= data.price) {
        return false;
      }
      return true;
    },
    {
      message: 'Discounted price must be less than regular price',
      path: ['discountedPrice'],
    },
  );

export const updateCourseSchema = z
  .object({
    title: z
      .string()
      .min(10, 'Title must be at least 10 characters')
      .max(100, 'Title must be at most 100 characters')
      .optional(),
    subtitle: z
      .string()
      .max(200, 'Subtitle must be at most 200 characters')
      .optional(),
    description: z
      .string()
      .min(200, 'Description must be at least 200 characters')
      .optional(),
    thumbnail: z.string().url('Invalid thumbnail URL').optional(),
    promoVideo: z.string().url('Invalid promo video URL').optional(),
    price: z
      .number()
      .min(0, 'Price must be non-negative')
      .max(199.99, 'Price must be at most $199.99')
      .optional(),
    discountedPrice: z
      .number()
      .min(0, 'Discounted price must be non-negative')
      .max(199.99, 'Discounted price must be at most $199.99')
      .optional(),
    level: CourseLevelEnum.optional(),
    language: z
      .string()
      .min(2, 'Language must be at least 2 characters')
      .max(10, 'Language must be at most 10 characters')
      .optional(),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    prerequisites: z.array(z.string()).optional(),
    learningOutcomes: z
      .array(z.string())
      .min(4, 'At least 4 learning outcomes are required')
      .max(10, 'At most 10 learning outcomes allowed')
      .optional(),
    targetAudience: z.array(z.string()).optional(),
    status: CourseStatusEnum.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

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

export const reorderSectionsSchema = z.object({
  sectionIds: z
    .array(z.string().uuid())
    .min(1, 'At least one section ID is required'),
});

export const reorderLecturesSchema = z.object({
  lectureIds: z
    .array(z.string().uuid())
    .min(1, 'At least one lecture ID is required'),
});

export class CreateCourseDto extends createZodDto(createCourseSchema) {}
export class UpdateCourseDto extends createZodDto(updateCourseSchema) {}
export class PublishCourseDto extends createZodDto(publishCourseSchema) {}
export class GetCourseQueryDto extends createZodDto(getCourseQuerySchema) {}
export class ReorderSectionsDto extends createZodDto(reorderSectionsSchema) {}
export class ReorderLecturesDto extends createZodDto(reorderLecturesSchema) {}
