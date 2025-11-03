import type {
  Course as CourseModel,
  Enrollment as EnrollmentModel,
  Section as SectionModel,
} from '@prisma/client';
import {
  CourseLevel,
  CourseStatus,
  EnrollmentStatus,
  LectureType,
  PaymentProvider,
  PaymentStatus,
  PrismaClient,
  ProcessingStatus,
  ResourceType,
  Role,
  UploadStatus,
  UserStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// simple slug generator
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const sample = <T>(arr: T[]) => arr[rand(0, arr.length - 1)];
const unique = <T>(arr: T[], n: number) => {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    const i = rand(0, copy.length - 1);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
};

async function reset() {
  // Order: children -> parents
  await prisma.resource.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.lecture.deleteMany();
  await prisma.section.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.uploadSession.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

async function seed() {
  await reset();

  // Users
  const passwordAdmin = await argon2.hash('password123');
  const passwordInstructor = await argon2.hash('password123');
  const passwordStudent = await argon2.hash('password123');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: passwordAdmin,
      firstName: 'Site',
      lastName: 'Admin',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      bio: 'Administrator account',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
  });

  const instructors = await Promise.all(
    Array.from({ length: 3 }).map((_, i) =>
      prisma.user.create({
        data: {
          email: `instructor${i + 1}@example.com`,
          password: passwordInstructor,
          firstName: `Instructor${i + 1}`,
          lastName: 'Smith',
          role: Role.INSTRUCTOR,
          status: UserStatus.ACTIVE,
          emailVerified: true,
          bio: 'Seasoned instructor in software engineering.',
          avatar: `https://i.pravatar.cc/150?img=${i + 11}`,
        },
      }),
    ),
  );

  const students = await Promise.all(
    Array.from({ length: 12 }).map((_, i) =>
      prisma.user.create({
        data: {
          email: `student${i + 1}@example.com`,
          password: passwordStudent,
          firstName: `Student${i + 1}`,
          lastName: 'Lee',
          role: Role.STUDENT,
          status: UserStatus.ACTIVE,
          emailVerified: true,
          avatar: `https://i.pravatar.cc/150?img=${i + 31}`,
        },
      }),
    ),
  );

  // Refresh tokens (one per user)
  const allUsers = [admin, ...instructors, ...students];
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  await Promise.all(
    allUsers.map((u, i) =>
      prisma.refreshToken.create({
        data: {
          token: `seed-refresh-${u.id}-${i}-${Date.now()}`,
          userId: u.id,
          expiresAt: new Date(Date.now() + thirtyDays),
        },
      }),
    ),
  );

  // Categories (with hierarchy)
  const topCategories = await prisma.$transaction([
    prisma.category.create({
      data: {
        name: 'Development',
        slug: 'development',
        description: 'Programming languages and frameworks',
        icon: '💻',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Design',
        slug: 'design',
        description: 'UI/UX and graphic design',
        icon: '🎨',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Business',
        slug: 'business',
        description: 'Entrepreneurship, management, and marketing',
        icon: '📈',
      },
    }),
  ]);

  const subCategories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Web Development',
        slug: 'web-development',
        description: 'Frontend & backend web development',
        parentId: topCategories[0].id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Mobile Development',
        slug: 'mobile-development',
        description: 'Android and iOS development',
        parentId: topCategories[0].id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'UX Design',
        slug: 'ux-design',
        description: 'User experience design',
        parentId: topCategories[1].id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Digital Marketing',
        slug: 'digital-marketing',
        description: 'SEO, social media, ads',
        parentId: topCategories[2].id,
      },
    }),
  ]);

  // Course templates
  const courseTitlePool = [
    'Complete JavaScript Bootcamp',
    'Mastering React with Hooks',
    'Node.js, NestJS and Prisma',
    'Design Systems for Scale',
    'Mobile Apps with Flutter',
    'Advanced TypeScript Patterns',
    'Modern UX from Zero to Hero',
    'SEO and Content Strategy',
  ];

  const makeCourseTitle = (i: number) =>
    courseTitlePool[i % courseTitlePool.length];

  // Create courses for each instructor (2-3 each)
  // Add a concrete type for courses we store
  type SeedCourse = CourseModel & {
    sections: SectionModel[];
    totalDuration: number;
    totalLectures: number;
  };
  const courses: SeedCourse[] = [];

  for (const instr of instructors) {
    const courseCount = rand(2, 3);
    for (let i = 0; i < courseCount; i++) {
      const title = `${makeCourseTitle(rand(0, 100))} by ${instr.firstName}`;
      let baseSlug = slugify(title);
      // ensure unique slug
      let slug = baseSlug;
      let suffix = 1;
      while (await prisma.course.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${suffix++}`;
      }

      const cat = sample([...topCategories, ...subCategories]);
      const price = rand(10, 120);
      const discountedPrice =
        Math.random() > 0.5 ? Number((price * 0.7).toFixed(2)) : null;
      const published = Math.random() > 0.4;

      const c = await prisma.course.create({
        data: {
          title,
          slug,
          subtitle: 'Build real projects step-by-step',
          description:
            'Comprehensive course with projects, quizzes, and resources to take you from fundamentals to advanced topics.',
          thumbnail: `https://picsum.photos/seed/${slug}/800/450`,
          promoVideo: 'https://example.com/videos/promo.mp4',
          price,
          discountedPrice: discountedPrice ?? undefined,
          level: sample([
            CourseLevel.BEGINNER,
            CourseLevel.INTERMEDIATE,
            CourseLevel.ADVANCED,
            CourseLevel.ALL_LEVELS,
          ]),
          language: 'en',
          status: published
            ? CourseStatus.PUBLISHED
            : sample([CourseStatus.DRAFT, CourseStatus.UNDER_REVIEW]),
          instructorId: instr.id,
          categoryId: cat.id,
          prerequisites: ['Basic computer skills', 'Motivation to learn'],
          learningOutcomes: [
            'Understand core concepts',
            'Build real-world applications',
            'Best practices and patterns',
          ],
          targetAudience: [
            'Beginners',
            'Intermediate learners',
            'Professionals upskilling',
          ],
          publishedAt: published
            ? new Date(Date.now() - rand(2, 60) * 24 * 3600 * 1000)
            : null,
        },
      });

      // Sections
      let totalDuration = 0;
      let totalLectures = 0;
      const sections: SectionModel[] = []; // was: const sections = [];
      const sectionCount = rand(3, 5);
      for (let s = 1; s <= sectionCount; s++) {
        const section = await prisma.section.create({
          data: {
            courseId: c.id,
            title: `Section ${s}: ${['Introduction', 'Core Concepts', 'Project', 'Advanced', 'Wrap-up'][s % 5]}`,
            description: 'Detailed lessons and hands-on exercises.',
            order: s,
          },
        });
        sections.push(section);

        // Lectures per section
        const lectureCount = rand(3, 5);
        for (let l = 1; l <= lectureCount; l++) {
          const type = sample([
            LectureType.VIDEO,
            LectureType.ARTICLE,
            LectureType.RESOURCE,
            LectureType.QUIZ,
          ]);
          const isVideo = type === LectureType.VIDEO;
          const isArticle = type === LectureType.ARTICLE;
          const isResource = type === LectureType.RESOURCE;

          const duration = isVideo ? rand(180, 900) : rand(60, 240);
          const lecture = await prisma.lecture.create({
            data: {
              sectionId: section.id,
              title: `${isVideo ? 'Video' : isArticle ? 'Article' : isResource ? 'Resource' : 'Quiz'} ${s}.${l}`,
              description: isArticle
                ? 'In-depth explanation with examples.'
                : null,
              type,
              duration,
              order: l,
              isFree: s === 1 && l === 1, // first lecture free
              videoUrl: isVideo
                ? 'https://example.com/videos/lesson.mp4'
                : null,
              hlsUrl: isVideo ? 'https://cdn.example.com/lesson.m3u8' : null,
              thumbnail: isVideo
                ? `https://picsum.photos/seed/${slug}-${s}-${l}/320/180`
                : null,
              articleContent: isArticle
                ? '## Lesson Content\n\nDetailed article content with markdown.'
                : null,
              resourceUrl: isResource
                ? 'https://example.com/resources/cheatsheet.pdf'
                : null,
              processingStatus: isVideo
                ? ProcessingStatus.COMPLETED
                : ProcessingStatus.COMPLETED,
            },
          });

          totalDuration += duration;
          totalLectures += 1;

          // Resources (file list) for resource lectures or sometimes for video
          if (isResource || Math.random() > 0.7) {
            await prisma.resource.create({
              data: {
                name: isResource ? 'Cheat Sheet.pdf' : 'Slides.pdf',
                url: isResource
                  ? 'https://example.com/resources/cheatsheet.pdf'
                  : 'https://example.com/resources/slides.pdf',
                type: ResourceType.PDF,
                size: rand(100_000, 2_000_000),
                lectureId: lecture.id,
              },
            });
          }
        }
      }

      // Update course aggregates
      await prisma.course.update({
        where: { id: c.id },
        data: { totalDuration, totalLectures },
      });

      courses.push({ ...c, sections, totalDuration, totalLectures });
    }
  }

  // Enroll students in random courses
  const enrollments: EnrollmentModel[] = []; // was: const enrollments = [];
  for (const course of courses) {
    const selectedStudents = unique(students, rand(5, 9));
    for (const stu of selectedStudents) {
      const progressPct = Math.random() > 0.6 ? rand(60, 100) : rand(0, 59);
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: stu.id,
          courseId: course.id,
          status:
            progressPct >= 100
              ? EnrollmentStatus.COMPLETED
              : EnrollmentStatus.ACTIVE,
          progress: progressPct,
          enrolledAt: new Date(Date.now() - rand(1, 30) * 24 * 3600 * 1000),
          completedAt: progressPct >= 100 ? new Date() : null,
          lastAccessedAt: new Date(),
        },
      });
      enrollments.push(enrollment);

      // Payments (completed)
      await prisma.payment.create({
        data: {
          userId: stu.id,
          courseId: course.id,
          amount: course.discountedPrice ?? course.price,
          currency: 'USD',
          status: PaymentStatus.COMPLETED,
          provider: sample([PaymentProvider.STRIPE, PaymentProvider.PAYPAL]),
          transactionId: `txn_${enrollment.id.slice(0, 8)}_${Date.now()}`,
          paymentIntentId: `pi_${enrollment.id.slice(0, 8)}_${Date.now()}`,
          paymentMethodId: 'pm_card_visa',
          metadata: { coupon: Math.random() > 0.7 ? 'WELCOME30' : null },
        },
      });

      // Progress for first few lectures
      const firstSection = await prisma.section.findFirst({
        where: { courseId: course.id },
        orderBy: { order: 'asc' },
      });
      if (firstSection) {
        const lectures = await prisma.lecture.findMany({
          where: { sectionId: firstSection.id },
          orderBy: { order: 'asc' },
          take: rand(1, 3),
        });

        for (const lec of lectures) {
          await prisma.progress.create({
            data: {
              userId: stu.id,
              lectureId: lec.id,
              completed: Math.random() > 0.5,
              watchedTime: Math.min(lec.duration, rand(30, lec.duration)),
              lastPosition: Math.min(lec.duration, rand(30, lec.duration)),
              completedAt: Math.random() > 0.5 ? new Date() : null,
            },
          });
        }
      }

      // Certificates for some who completed
      if (progressPct >= 100 && Math.random() > 0.3) {
        await prisma.certificate.create({
          data: {
            userId: stu.id,
            courseId: course.id,
            certificateUrl: `https://example.com/certificates/${stu.id}-${course.id}.pdf`,
            verificationCode: `VER-${stu.id.slice(0, 6)}-${course.id.slice(0, 6)}`,
          },
        });
      }
    }

    // Reviews from a few students
    const reviewers = unique(students, rand(2, 6));
    for (const r of reviewers) {
      const rating = rand(3, 5);
      await prisma.review.create({
        data: {
          userId: r.id,
          courseId: course.id,
          rating,
          title: rating >= 4 ? 'Great course!' : 'Good content',
          comment:
            rating >= 4
              ? 'Well structured, clear explanations and helpful resources.'
              : 'Decent coverage but could use more examples.',
          helpful: rand(0, 10),
        },
      });
    }

    // Recompute course aggregates: totalStudents, averageRating, totalReviews
    const agg = await prisma.course.findUnique({
      where: { id: course.id },
      include: {
        enrollments: true,
        reviews: true,
      },
    });
    if (agg) {
      const totalStudents = agg.enrollments.length;
      const totalReviews = agg.reviews.length;
      const averageRating =
        totalReviews > 0
          ? Number(
              (
                agg.reviews.reduce((a, b) => a + b.rating, 0) / totalReviews
              ).toFixed(2),
            )
          : 0;

      await prisma.course.update({
        where: { id: course.id },
        data: { totalStudents, totalReviews, averageRating },
      });
    }
  }

  // Upload sessions (misc)
  await Promise.all(
    Array.from({ length: 4 }).map((_, i) =>
      prisma.uploadSession.create({
        data: {
          userId: sample(allUsers).id,
          fileName: `upload_${i + 1}.mp4`,
          fileSize: rand(10_000_000, 300_000_000),
          mimeType: 'video/mp4',
          totalChunks: rand(5, 15),
          uploadedChunks: rand(0, 15),
          status: sample([
            UploadStatus.PENDING,
            UploadStatus.UPLOADING,
            UploadStatus.COMPLETED,
          ]),
          chunkHashes: ['abc123', 'def456', 'ghi789'],
          metadata: { courseHint: 'promo' },
          expiresAt: new Date(Date.now() + rand(1, 7) * 24 * 3600 * 1000),
        },
      }),
    ),
  );

  // Promote one course to UNDER_REVIEW and one to ARCHIVED to cover statuses
  const anyCourse = await prisma.course.findFirst();
  const anotherCourse = await prisma.course.findFirst({ skip: 1 });
  if (anyCourse) {
    await prisma.course.update({
      where: { id: anyCourse.id },
      data: { status: CourseStatus.UNDER_REVIEW },
    });
  }
  if (anotherCourse) {
    await prisma.course.update({
      where: { id: anotherCourse.id },
      data: { status: CourseStatus.ARCHIVED },
    });
  }

  console.log('✅ Seed complete');
}

async function main() {
  try {
    await seed();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
