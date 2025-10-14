import { ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/course.dto';
import { CourseStatus, Role } from '@prisma/client';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}
  async createCourse(instructorId: string, dto: CreateCourseDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: instructorId },
    });

    if (!user || user.role !== Role.INSTRUCTOR) {
      throw new ForbiddenException('Only instructors can create courses');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const slug = this.generateSlug(dto.title);

    const course = await this.prisma.course.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        description: dto.description,
        thumbnail: dto.thumbnail,
        promoVideo: dto.promoVideo,
        price: dto.price,
        discountedPrice: dto.discountedPrice,
        level: dto.level,
        language: dto.language,
        categoryId: dto.categoryId,
        prerequisites: dto.prerequisites,
        learningOutcomes: dto.learningOutcomes,
        targetAudience: dto.targetAudience,
        slug,
        instructorId,
        status: CourseStatus.DRAFT,
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        category: true,
      },
    });

    return course;
  }

  //   /**
  //    * Get all courses with filters and pagination
  //    */
  //   async getAllCourses(query: GetCourseQueryDto) {
  //     const {
  //       page,
  //       limit,
  //       search,
  //       categoryId,
  //       level,
  //       minPrice,
  //       maxPrice,
  //       status,
  //       instructorId,
  //       sortBy,
  //       sortOrder,
  //     } = query;
  //
  //     const skip = (page - 1) * limit;
  //
  //     // Build where clause
  //     const where: any = {};
  //
  //     if (search) {
  //       where.OR = [
  //         { title: { contains: search, mode: 'insensitive' } },
  //         { description: { contains: search, mode: 'insensitive' } },
  //       ];
  //     }
  //
  //     if (categoryId) where.categoryId = categoryId;
  //     if (level) where.level = level;
  //     if (instructorId) where.instructorId = instructorId;
  //     if (status) where.status = status;
  //
  //     if (minPrice !== undefined || maxPrice !== undefined) {
  //       where.price = {};
  //       if (minPrice !== undefined) where.price.gte = minPrice;
  //       if (maxPrice !== undefined) where.price.lte = maxPrice;
  //     }
  //
  //     // Execute query
  //     const [courses, total] = await Promise.all([
  //       this.prisma.course.findMany({
  //         where,
  //         skip,
  //         take: limit,
  //         orderBy: { [sortBy]: sortOrder },
  //         include: {
  //           instructor: {
  //             select: {
  //               id: true,
  //               firstName: true,
  //               lastName: true,
  //               avatar: true,
  //             },
  //           },
  //           category: true,
  //           _count: {
  //             select: {
  //               sections: true,
  //               enrollments: true,
  //               reviews: true,
  //             },
  //           },
  //         },
  //       }),
  //       this.prisma.course.count({ where }),
  //     ]);
  //
  //     return {
  //       data: courses,
  //       meta: {
  //         total,
  //         page,
  //         limit,
  //         totalPages: Math.ceil(total / limit),
  //       },
  //     };
  //   }
  //
  //   /**
  //    * Get course by ID or slug
  //    */
  //   async getCourseById(identifier: string, userId?: string) {
  //     const course = await this.prisma.course.findFirst({
  //       where: {
  //         OR: [{ id: identifier }, { slug: identifier }],
  //       },
  //       include: {
  //         instructor: {
  //           select: {
  //             id: true,
  //             firstName: true,
  //             lastName: true,
  //             avatar: true,
  //             bio: true,
  //           },
  //         },
  //         category: true,
  //         sections: {
  //           orderBy: { order: 'asc' },
  //           include: {
  //             lectures: {
  //               orderBy: { order: 'asc' },
  //               select: {
  //                 id: true,
  //                 title: true,
  //                 type: true,
  //                 duration: true,
  //                 order: true,
  //                 isFree: true,
  //               },
  //             },
  //           },
  //         },
  //         reviews: {
  //           take: 10,
  //           orderBy: { createdAt: 'desc' },
  //           include: {
  //             user: {
  //               select: {
  //                 firstName: true,
  //                 lastName: true,
  //                 avatar: true,
  //               },
  //             },
  //           },
  //         },
  //       },
  //     });
  //
  //     if (!course) {
  //       throw new NotFoundException('Course not found');
  //     }
  //
  //     // Check if user is enrolled (if userId provided)
  //     let isEnrolled = false;
  //     if (userId) {
  //       const enrollment = await this.prisma.enrollment.findUnique({
  //         where: {
  //           userId_courseId: {
  //             userId,
  //             courseId: course.id,
  //           },
  //         },
  //       });
  //       isEnrolled = !!enrollment;
  //     }
  //
  //     return { ...course, isEnrolled };
  //   }
  //
  //   /**
  //    * Update course (Instructor/Admin only)
  //    */
  //   async updateCourse(
  //     courseId: string,
  //     userId: string,
  //     userRole: Role,
  //     dto: UpdateCourseDto,
  //   ) {
  //     const course = await this.prisma.course.findUnique({
  //       where: { id: courseId },
  //     });
  //
  //     if (!course) {
  //       throw new NotFoundException('Course not found');
  //     }
  //
  //     // Check permissions
  //     if (userRole !== Role.ADMIN && course.instructorId !== userId) {
  //       throw new ForbiddenException(
  //         'You do not have permission to update this course',
  //       );
  //     }
  //
  //     // Update slug if title changed
  //     const updateData: any = { ...dto };
  //     if (dto.title) {
  //       updateData.slug = this.generateSlug(dto.title);
  //     }
  //
  //     const updatedCourse = await this.prisma.course.update({
  //       where: { id: courseId },
  //       data: updateData,
  //       include: {
  //         instructor: {
  //           select: {
  //             id: true,
  //             firstName: true,
  //             lastName: true,
  //             avatar: true,
  //           },
  //         },
  //         category: true,
  //       },
  //     });
  //
  //     return updatedCourse;
  //   }
  //
  //   /**
  //    * Delete course (Instructor/Admin only)
  //    */
  //   async deleteCourse(courseId: string, userId: string, userRole: Role) {
  //     const course = await this.prisma.course.findUnique({
  //       where: { id: courseId },
  //     });
  //
  //     if (!course) {
  //       throw new NotFoundException('Course not found');
  //     }
  //
  //     if (userRole !== Role.ADMIN && course.instructorId !== userId) {
  //       throw new ForbiddenException(
  //         'You do not have permission to delete this course',
  //       );
  //     }
  //
  //     await this.prisma.course.delete({
  //       where: { id: courseId },
  //     });
  //
  //     return { message: 'Course deleted successfully' };
  //   }
  //
  //   /**
  //    * Publish/Unpublish course
  //    */
  //   async publishCourse(
  //     courseId: string,
  //     userId: string,
  //     userRole: Role,
  //     dto: PublishCourseDto,
  //   ) {
  //     const course = await this.prisma.course.findUnique({
  //       where: { id: courseId },
  //       include: {
  //         sections: {
  //           include: {
  //             lectures: true,
  //           },
  //         },
  //       },
  //     });
  //
  //     if (!course) {
  //       throw new NotFoundException('Course not found');
  //     }
  //
  //     if (userRole !== Role.ADMIN && course.instructorId !== userId) {
  //       throw new ForbiddenException(
  //         'You do not have permission to publish this course',
  //       );
  //     }
  //
  //     // Validate course is ready for publishing
  //     if (dto.status === CourseStatus.PUBLISHED) {
  //       if (!course.sections || course.sections.length === 0) {
  //         throw new BadRequestException('Course must have at least one section');
  //       }
  //
  //       const hasLectures = course.sections.some((s) => s.lectures.length > 0);
  //       if (!hasLectures) {
  //         throw new BadRequestException('Course must have at least one lecture');
  //       }
  //     }
  //
  //     const updatedCourse = await this.prisma.course.update({
  //       where: { id: courseId },
  //       data: {
  //         status: dto.status,
  //         publishedAt: dto.status === CourseStatus.PUBLISHED ? new Date() : null,
  //       },
  //     });
  //
  //     return updatedCourse;
  //   }
  //
  //   // ==================== SECTION CRUD ====================
  //
  //   async createSection(courseId: string, userId: string, dto: CreateSectionDto) {
  //     await this.verifyInstructorAccess(courseId, userId);
  //
  //     const section = await this.prisma.section.create({
  //       data: {
  //         ...dto,
  //         courseId,
  //       },
  //     });
  //
  //     return section;
  //   }
  //
  //   async updateSection(
  //     sectionId: string,
  //     userId: string,
  //     dto: UpdateSectionDto,
  //   ) {
  //     const section = await this.prisma.section.findUnique({
  //       where: { id: sectionId },
  //       include: { course: true },
  //     });
  //
  //     if (!section) {
  //       throw new NotFoundException('Section not found');
  //     }
  //
  //     await this.verifyInstructorAccess(section.courseId, userId);
  //
  //     const updatedSection = await this.prisma.section.update({
  //       where: { id: sectionId },
  //       data: dto,
  //     });
  //
  //     return updatedSection;
  //   }
  //
  //   async deleteSection(sectionId: string, userId: string) {
  //     const section = await this.prisma.section.findUnique({
  //       where: { id: sectionId },
  //       include: { course: true },
  //     });
  //
  //     if (!section) {
  //       throw new NotFoundException('Section not found');
  //     }
  //
  //     await this.verifyInstructorAccess(section.courseId, userId);
  //
  //     await this.prisma.section.delete({
  //       where: { id: sectionId },
  //     });
  //
  //     return { message: 'Section deleted successfully' };
  //   }
  //
  //   // ==================== LECTURE CRUD ====================
  //
  //   async createLecture(
  //     sectionId: string,
  //     userId: string,
  //     dto: CreateLectureDto,
  //   ) {
  //     const section = await this.prisma.section.findUnique({
  //       where: { id: sectionId },
  //     });
  //
  //     if (!section) {
  //       throw new NotFoundException('Section not found');
  //     }
  //
  //     await this.verifyInstructorAccess(section.courseId, userId);
  //
  //     const lecture = await this.prisma.lecture.create({
  //       data: {
  //         ...dto,
  //         sectionId,
  //       },
  //     });
  //
  //     // Update course total duration and lectures count
  //     await this.updateCourseTotals(section.courseId);
  //
  //     return lecture;
  //   }
  //
  //   async updateLecture(
  //     lectureId: string,
  //     userId: string,
  //     dto: UpdateLectureDto,
  //   ) {
  //     const lecture = await this.prisma.lecture.findUnique({
  //       where: { id: lectureId },
  //       include: {
  //         section: true,
  //       },
  //     });
  //
  //     if (!lecture) {
  //       throw new NotFoundException('Lecture not found');
  //     }
  //
  //     await this.verifyInstructorAccess(lecture.section.courseId, userId);
  //
  //     const updatedLecture = await this.prisma.lecture.update({
  //       where: { id: lectureId },
  //       data: dto,
  //     });
  //
  //     // Update course totals if duration changed
  //     if (dto.duration !== undefined) {
  //       await this.updateCourseTotals(lecture.section.courseId);
  //     }
  //
  //     return updatedLecture;
  //   }
  //
  //   async deleteLecture(lectureId: string, userId: string) {
  //     const lecture = await this.prisma.lecture.findUnique({
  //       where: { id: lectureId },
  //       include: {
  //         section: true,
  //       },
  //     });
  //
  //     if (!lecture) {
  //       throw new NotFoundException('Lecture not found');
  //     }
  //
  //     await this.verifyInstructorAccess(lecture.section.courseId, userId);
  //
  //     await this.prisma.lecture.delete({
  //       where: { id: lectureId },
  //     });
  //
  //     // Update course totals
  //     await this.updateCourseTotals(lecture.section.courseId);
  //
  //     return { message: 'Lecture deleted successfully' };
  //   }
  //
  //   /**
  //    * Get lecture playback URL (for enrolled students or free lectures)
  //    */
  //   async getLecturePlayback(lectureId: string, userId: string) {
  //     const lecture = await this.prisma.lecture.findUnique({
  //       where: { id: lectureId },
  //       include: {
  //         section: {
  //           include: {
  //             course: true,
  //           },
  //         },
  //       },
  //     });
  //
  //     if (!lecture) {
  //       throw new NotFoundException('Lecture not found');
  //     }
  //
  //     // Check if lecture is free or user is enrolled
  //     if (!lecture.isFree) {
  //       const enrollment = await this.prisma.enrollment.findUnique({
  //         where: {
  //           userId_courseId: {
  //             userId,
  //             courseId: lecture.section.courseId,
  //           },
  //         },
  //       });
  //
  //       if (!enrollment) {
  //         throw new ForbiddenException(
  //           'You must enroll in this course to access this lecture',
  //         );
  //       }
  //     }
  //
  //     // Return playback information
  //     return {
  //       lectureId: lecture.id,
  //       title: lecture.title,
  //       type: lecture.type,
  //       duration: lecture.duration,
  //       videoUrl: lecture.videoUrl,
  //       hlsUrl: lecture.hlsUrl,
  //       articleContent: lecture.articleContent,
  //       resourceUrl: lecture.resourceUrl,
  //     };
  //   }

  // ==================== HELPER METHODS ====================

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') +
      '-' +
      Date.now()
    );
  }
  //
  //   private async verifyInstructorAccess(courseId: string, userId: string) {
  //     const course = await this.prisma.course.findUnique({
  //       where: { id: courseId },
  //     });
  //
  //     if (!course) {
  //       throw new NotFoundException('Course not found');
  //     }
  //
  //     if (course.instructorId !== userId) {
  //       throw new ForbiddenException('You do not have access to this course');
  //     }
  //   }
  //
  //   private async updateCourseTotals(courseId: string) {
  //     const sections = await this.prisma.section.findMany({
  //       where: { courseId },
  //       include: {
  //         lectures: true,
  //       },
  //     });
  //
  //     const totalLectures = sections.reduce(
  //       (sum, section) => sum + section.lectures.length,
  //       0,
  //     );
  //
  //     const totalDuration = sections.reduce(
  //       (sum, section) =>
  //         sum +
  //         section.lectures.reduce(
  //           (lectureSum, lecture) => lectureSum + lecture.duration,
  //           0,
  //         ),
  //       0,
  //     );
  //
  //     await this.prisma.course.update({
  //       where: { id: courseId },
  //       data: {
  //         totalLectures,
  //         totalDuration,
  //       },
  //     });
  //   }
}
