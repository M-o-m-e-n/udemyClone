import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCourseDto,
  GetCourseQueryDto,
  PublishCourseDto,
  UpdateCourseDto,
} from '../dto/course.dto';
import { CreateSectionDto, UpdateSectionDto } from '../dto/section.dto';
import { CreateLectureDto, UpdateLectureDto } from '../dto/lecture.dto';
import { CourseStatus, Role } from '@prisma/client';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  // ==================== COURSE CRUD ====================

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
        prerequisites: dto.prerequisites || [],
        learningOutcomes: dto.learningOutcomes,
        targetAudience: dto.targetAudience || [],
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

  async getAllCourses(query: GetCourseQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      level,
      minPrice,
      maxPrice,
      status = 'PUBLISHED',
      instructorId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (level) where.level = level;
    if (instructorId) where.instructorId = instructorId;

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    const orderBy: any = {};

    if (sortBy === 'enrollmentCount') {
      orderBy.enrollments = {
        _count: sortOrder,
      };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    try {
      const [courses, total] = await Promise.all([
        this.prisma.course.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            _count: {
              select: {
                sections: true,
                enrollments: true,
                reviews: true,
              },
            },
          },
        }),
        this.prisma.course.count({ where }),
      ]);

      const coursesWithRatings = await Promise.all(
        courses.map(async (course) => {
          const ratingData = await this.prisma.review.aggregate({
            where: { courseId: course.id },
            _avg: { rating: true },
            _count: true,
          });

          return {
            ...course,
            averageRating: ratingData._avg.rating || 0,
            totalReviews: ratingData._count,
          };
        }),
      );

      return {
        data: coursesWithRatings,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  async getCourseById(identifier: string, userId?: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
          },
        },
        category: true,
        sections: {
          orderBy: { order: 'asc' },
          include: {
            lectures: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                type: true,
                duration: true,
                order: true,
                isFree: true,
              },
            },
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if user is enrolled
    let isEnrolled = false;
    if (userId) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: course.id,
          },
        },
      });
      isEnrolled = !!enrollment;
    }

    // Calculate average rating
    const ratingData = await this.prisma.review.aggregate({
      where: { courseId: course.id },
      _avg: { rating: true },
    });

    return {
      ...course,
      isEnrolled,
      averageRating: ratingData._avg.rating || 0,
    };
  }

  async updateCourse(
    courseId: string,
    userId: string,
    userRole: Role,
    dto: UpdateCourseDto,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this course',
      );
    }

    const updateData: any = { ...dto };
    if (dto.title) {
      updateData.slug = this.generateSlug(dto.title);
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id: courseId },
      data: updateData,
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

    return updatedCourse;
  }

  async deleteCourse(courseId: string, userId: string, userRole: Role) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this course',
      );
    }

    await this.prisma.course.delete({
      where: { id: courseId },
    });

    return { message: 'Course deleted successfully' };
  }

  async publishCourse(
    courseId: string,
    userId: string,
    userRole: Role,
    dto: PublishCourseDto,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          include: {
            lectures: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (userRole !== Role.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to publish this course',
      );
    }

    // Validate course is ready for publishing
    if (dto.status === CourseStatus.PUBLISHED) {
      const validationErrors = await this.validateCourseForPublishing(course);
      if (validationErrors.length > 0) {
        throw new BadRequestException({
          message: 'Course is not ready for publishing',
          errors: validationErrors,
        });
      }
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id: courseId },
      data: {
        status: dto.status,
        publishedAt: dto.status === CourseStatus.PUBLISHED ? new Date() : null,
      },
    });

    return updatedCourse;
  }

  // ==================== SECTION CRUD ====================

  async createSection(courseId: string, userId: string, dto: CreateSectionDto) {
    await this.verifyInstructorAccess(courseId, userId);

    const lastSection = await this.prisma.section.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    });

    const section = await this.prisma.section.create({
      data: {
        title: dto.title,
        description: dto.description,
        order: dto.order ?? (lastSection ? lastSection.order + 1 : 1),
        courseId,
      },
    });

    return section;
  }

  async updateSection(
    sectionId: string,
    userId: string,
    dto: UpdateSectionDto,
  ) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { course: true },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.verifyInstructorAccess(section.courseId, userId);

    const updatedSection = await this.prisma.section.update({
      where: { id: sectionId },
      data: dto,
    });

    return updatedSection;
  }

  async deleteSection(sectionId: string, userId: string) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { course: true },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.verifyInstructorAccess(section.courseId, userId);

    await this.prisma.section.delete({
      where: { id: sectionId },
    });

    return { message: 'Section deleted successfully' };
  }

  // ==================== LECTURE CRUD ====================

  async createLecture(
    sectionId: string,
    userId: string,
    dto: CreateLectureDto,
  ) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.verifyInstructorAccess(section.courseId, userId);

    const lastLecture = await this.prisma.lecture.findFirst({
      where: { sectionId },
      orderBy: { order: 'desc' },
    });

    const lecture = await this.prisma.lecture.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        duration: dto.duration ?? 0,
        order: dto.order ?? (lastLecture ? lastLecture.order + 1 : 1),
        isFree: dto.isFree ?? false,
        videoUrl: dto.videoUrl,
        hlsUrl: dto.hlsUrl,
        articleContent: dto.articleContent,
        resourceUrl: dto.resourceUrl,
        sectionId,
      },
    });

    await this.updateCourseTotals(section.courseId);

    return lecture;
  }

  async updateLecture(
    lectureId: string,
    userId: string,
    dto: UpdateLectureDto,
  ) {
    const lecture = await this.prisma.lecture.findUnique({
      where: { id: lectureId },
      include: {
        section: true,
      },
    });

    if (!lecture) {
      throw new NotFoundException('Lecture not found');
    }

    await this.verifyInstructorAccess(lecture.section.courseId, userId);

    const updatedLecture = await this.prisma.lecture.update({
      where: { id: lectureId },
      data: dto,
    });

    if (dto.duration !== undefined) {
      await this.updateCourseTotals(lecture.section.courseId);
    }

    return updatedLecture;
  }

  async deleteLecture(lectureId: string, userId: string) {
    const lecture = await this.prisma.lecture.findUnique({
      where: { id: lectureId },
      include: {
        section: true,
      },
    });

    if (!lecture) {
      throw new NotFoundException('Lecture not found');
    }

    await this.verifyInstructorAccess(lecture.section.courseId, userId);

    await this.prisma.lecture.delete({
      where: { id: lectureId },
    });

    await this.updateCourseTotals(lecture.section.courseId);

    return { message: 'Lecture deleted successfully' };
  }

  async getLecturePlayback(lectureId: string, userId: string) {
    const lecture = await this.prisma.lecture.findUnique({
      where: { id: lectureId },
      include: {
        section: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lecture) {
      throw new NotFoundException('Lecture not found');
    }

    // Check if lecture is free or user is enrolled
    if (!lecture.isFree) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: lecture.section.courseId,
          },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException(
          'You must enroll in this course to access this lecture',
        );
      }
    }

    return {
      lectureId: lecture.id,
      title: lecture.title,
      type: lecture.type,
      duration: lecture.duration,
      videoUrl: lecture.videoUrl,
      hlsUrl: lecture.hlsUrl,
      articleContent: lecture.articleContent,
      resourceUrl: lecture.resourceUrl,
    };
  }

  // ==================== REORDERING METHODS ====================

  async reorderSections(
    courseId: string,
    userId: string,
    sectionIds: string[],
  ) {
    await this.verifyInstructorAccess(courseId, userId);

    // Validate that all sections belong to the course
    const sections = await this.prisma.section.findMany({
      where: {
        id: { in: sectionIds },
        courseId,
      },
    });

    if (sections.length !== sectionIds.length) {
      throw new BadRequestException(
        'Some sections do not belong to this course',
      );
    }

    // Update section orders in a transaction
    await this.prisma.$transaction(
      sectionIds.map((sectionId, index) =>
        this.prisma.section.update({
          where: { id: sectionId },
          data: { order: index + 1 },
        }),
      ),
    );

    return { message: 'Sections reordered successfully' };
  }

  async reorderLectures(
    sectionId: string,
    userId: string,
    lectureIds: string[],
  ) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { course: true },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.verifyInstructorAccess(section.courseId, userId);

    // Validate that all lectures belong to the section
    const lectures = await this.prisma.lecture.findMany({
      where: {
        id: { in: lectureIds },
        sectionId,
      },
    });

    if (lectures.length !== lectureIds.length) {
      throw new BadRequestException(
        'Some lectures do not belong to this section',
      );
    }

    // Update lecture orders in a transaction
    await this.prisma.$transaction(
      lectureIds.map((lectureId, index) =>
        this.prisma.lecture.update({
          where: { id: lectureId },
          data: { order: index + 1 },
        }),
      ),
    );

    return { message: 'Lectures reordered successfully' };
  }

  private async validateCourseForPublishing(course: any): Promise<string[]> {
    const errors: string[] = [];

    // Basic course information validation
    if (!course.title || course.title.length < 10) {
      errors.push('Course title must be at least 10 characters');
    }

    if (!course.description || course.description.length < 200) {
      errors.push('Course description must be at least 200 characters');
    }

    if (!course.thumbnail) {
      errors.push('Course must have a thumbnail image');
    }

    if (!course.learningOutcomes || course.learningOutcomes.length < 4) {
      errors.push('Course must have at least 4 learning outcomes');
    }

    // Section and lecture validation
    if (!course.sections || course.sections.length === 0) {
      errors.push('Course must have at least one section');
    } else {
      const totalLectures = course.sections.reduce(
        (sum: number, section: any) => sum + section.lectures.length,
        0,
      );

      if (totalLectures < 5) {
        errors.push('Course must have at least 5 lectures');
      }

      // Check if total duration is at least 30 minutes
      const totalDuration = course.sections.reduce(
        (sum: number, section: any) =>
          sum +
          section.lectures.reduce(
            (lectureSum: number, lecture: any) => lectureSum + lecture.duration,
            0,
          ),
        0,
      );

      if (totalDuration < 1800) {
        // 30 minutes in seconds
        errors.push('Course must have at least 30 minutes of content');
      }

      // Check if any lectures are still processing
      const processingLectures = course.sections.some((section: any) =>
        section.lectures.some(
          (lecture: any) =>
            lecture.processingStatus === 'PROCESSING' ||
            lecture.processingStatus === 'PENDING',
        ),
      );

      if (processingLectures) {
        errors.push(
          'All video lectures must be fully processed before publishing',
        );
      }
    }

    return errors;
  }

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

  private async verifyInstructorAccess(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== userId) {
      throw new ForbiddenException('You do not have access to this course');
    }
  }

  private async updateCourseTotals(courseId: string) {
    const sections = await this.prisma.section.findMany({
      where: { courseId },
      include: {
        lectures: true,
      },
    });

    const totalLectures = sections.reduce(
      (sum, section) => sum + section.lectures.length,
      0,
    );

    const totalDuration = sections.reduce(
      (sum, section) =>
        sum +
        section.lectures.reduce(
          (lectureSum, lecture) => lectureSum + lecture.duration,
          0,
        ),
      0,
    );

    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        totalLectures,
        totalDuration,
      },
    });
  }
}
