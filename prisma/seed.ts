import { PrismaClient, Role, CourseLevel, CourseStatus, LectureType, EnrollmentStatus, PaymentStatus, PaymentProvider } from '@prisma/client';
import * as argon from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ==================== USERS ====================
  console.log('👥 Creating users...');

  const hashedPassword = await argon.hash('password123');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@udemy.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      emailVerified: true,
      bio: 'Platform administrator',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
  });

  const instructor1 = await prisma.user.create({
    data: {
      email: 'john.doe@udemy.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: Role.INSTRUCTOR,
      emailVerified: true,
      bio: 'Full-stack developer with 10+ years of experience. Passionate about teaching web development.',
      avatar: 'https://i.pravatar.cc/150?img=12',
    },
  });

  const instructor2 = await prisma.user.create({
    data: {
      email: 'jane.smith@udemy.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: Role.INSTRUCTOR,
      emailVerified: true,
      bio: 'Data Science expert and Machine Learning enthusiast. Teaching data science for 8+ years.',
      avatar: 'https://i.pravatar.cc/150?img=5',
    },
  });

  const instructor3 = await prisma.user.create({
    data: {
      email: 'mike.johnson@udemy.com',
      password: hashedPassword,
      firstName: 'Mike',
      lastName: 'Johnson',
      role: Role.INSTRUCTOR,
      emailVerified: true,
      bio: 'UX/UI Designer with a passion for creating beautiful user experiences.',
      avatar: 'https://i.pravatar.cc/150?img=33',
    },
  });

  const students = await prisma.user.createMany({
    data: [
      {
        email: 'student1@example.com',
        password: hashedPassword,
        firstName: 'Alice',
        lastName: 'Williams',
        role: Role.STUDENT,
        emailVerified: true,
        avatar: 'https://i.pravatar.cc/150?img=10',
      },
      {
        email: 'student2@example.com',
        password: hashedPassword,
        firstName: 'Bob',
        lastName: 'Brown',
        role: Role.STUDENT,
        emailVerified: true,
        avatar: 'https://i.pravatar.cc/150?img=15',
      },
      {
        email: 'student3@example.com',
        password: hashedPassword,
        firstName: 'Charlie',
        lastName: 'Davis',
        role: Role.STUDENT,
        emailVerified: true,
        avatar: 'https://i.pravatar.cc/150?img=20',
      },
      {
        email: 'student4@example.com',
        password: hashedPassword,
        firstName: 'Diana',
        lastName: 'Miller',
        role: Role.STUDENT,
        emailVerified: true,
        avatar: 'https://i.pravatar.cc/150?img=25',
      },
      {
        email: 'student5@example.com',
        password: hashedPassword,
        firstName: 'Eve',
        lastName: 'Wilson',
        role: Role.STUDENT,
        emailVerified: true,
        avatar: 'https://i.pravatar.cc/150?img=30',
      },
    ],
  });

  const allStudents = await prisma.user.findMany({ where: { role: Role.STUDENT } });

  console.log('✅ Users created!');

  // ==================== CATEGORIES ====================
  console.log('📂 Creating categories...');

  const development = await prisma.category.create({
    data: {
      name: 'Development',
      slug: 'development',
      description: 'Learn programming, web development, mobile apps and more',
      icon: '💻',
    },
  });

  const business = await prisma.category.create({
    data: {
      name: 'Business',
      slug: 'business',
      description: 'Business management, entrepreneurship, and leadership',
      icon: '💼',
    },
  });

  const design = await prisma.category.create({
    data: {
      name: 'Design',
      slug: 'design',
      description: 'Graphic design, UX/UI, and creative skills',
      icon: '🎨',
    },
  });

  const marketing = await prisma.category.create({
    data: {
      name: 'Marketing',
      slug: 'marketing',
      description: 'Digital marketing, SEO, and social media',
      icon: '📈',
    },
  });

  const personalDev = await prisma.category.create({
    data: {
      name: 'Personal Development',
      slug: 'personal-development',
      description: 'Self improvement and productivity',
      icon: '🌱',
    },
  });

  // Development Subcategories
  const webDev = await prisma.category.create({
    data: {
      name: 'Web Development',
      slug: 'web-development',
      description: 'HTML, CSS, JavaScript, React, Node.js',
      icon: '🌐',
      parentId: development.id,
    },
  });

  const mobileDev = await prisma.category.create({
    data: {
      name: 'Mobile Development',
      slug: 'mobile-development',
      description: 'iOS, Android, React Native, Flutter',
      icon: '📱',
      parentId: development.id,
    },
  });

  const dataScience = await prisma.category.create({
    data: {
      name: 'Data Science',
      slug: 'data-science',
      description: 'Python, Machine Learning, Data Analysis',
      icon: '📊',
      parentId: development.id,
    },
  });

  await prisma.category.createMany({
    data: [
      {
        name: 'Database Design',
        slug: 'database-design',
        description: 'SQL, MongoDB, PostgreSQL',
        icon: '🗄️',
        parentId: development.id,
      },
      {
        name: 'Programming Languages',
        slug: 'programming-languages',
        description: 'Python, Java, C++, JavaScript',
        icon: '⌨️',
        parentId: development.id,
      },
      {
        name: 'Game Development',
        slug: 'game-development',
        description: 'Unity, Unreal Engine',
        icon: '🎮',
        parentId: development.id,
      },
      {
        name: 'Entrepreneurship',
        slug: 'entrepreneurship',
        description: 'Starting and running a business',
        icon: '🚀',
        parentId: business.id,
      },
      {
        name: 'Finance & Accounting',
        slug: 'finance-accounting',
        description: 'Financial analysis, bookkeeping',
        icon: '💰',
        parentId: business.id,
      },
      {
        name: 'Graphic Design',
        slug: 'graphic-design',
        description: 'Photoshop, Illustrator, InDesign',
        icon: '🖼️',
        parentId: design.id,
      },
      {
        name: 'UX/UI Design',
        slug: 'ux-ui-design',
        description: 'User experience and interface design',
        icon: '📐',
        parentId: design.id,
      },
      {
        name: 'Digital Marketing',
        slug: 'digital-marketing',
        description: 'Online marketing strategies',
        icon: '💻',
        parentId: marketing.id,
      },
      {
        name: 'SEO',
        slug: 'seo',
        description: 'Search Engine Optimization',
        icon: '🔍',
        parentId: marketing.id,
      },
    ],
  });

  console.log('✅ Categories created!');

  // ==================== COURSES ====================
  console.log('📚 Creating courses...');

  // Course 1: Complete Node.js Course
  const nodeCourse = await prisma.course.create({
    data: {
      title: 'Complete Node.js Developer Course',
      slug: 'complete-nodejs-developer-course',
      subtitle: 'Master Node.js by building real-world applications',
      description: 'Learn Node.js from scratch and build professional backend applications. This comprehensive course covers everything from basics to advanced topics including Express.js, MongoDB, RESTful APIs, authentication, and deployment.',
      thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800',
      promoVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      price: 89.99,
      discountedPrice: 49.99,
      level: CourseLevel.BEGINNER,
      language: 'English',
      status: CourseStatus.PUBLISHED,
      instructorId: instructor1.id,
      categoryId: webDev.id,
      prerequisites: ['Basic JavaScript knowledge', 'Understanding of HTML/CSS'],
      learningOutcomes: [
        'Build RESTful APIs with Node.js and Express',
        'Work with MongoDB and Mongoose',
        'Implement authentication and authorization',
        'Deploy Node.js applications to production',
        'Build real-time applications with Socket.io',
      ],
      targetAudience: [
        'Beginner developers wanting to learn backend development',
        'Frontend developers looking to become full-stack',
        'Anyone interested in JavaScript backend development',
      ],
      totalDuration: 36000, // 10 hours
      totalLectures: 120,
      totalStudents: 0,
      publishedAt: new Date(),
    },
  });

  // Course 2: Python Data Science
  const pythonCourse = await prisma.course.create({
    data: {
      title: 'Python for Data Science and Machine Learning',
      slug: 'python-data-science-machine-learning',
      subtitle: 'Complete hands-on course for data science with Python',
      description: 'Learn Python for data science, machine learning, and data visualization. Master NumPy, Pandas, Matplotlib, Seaborn, Scikit-learn, and more.',
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
      promoVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      price: 99.99,
      discountedPrice: 59.99,
      level: CourseLevel.INTERMEDIATE,
      language: 'English',
      status: CourseStatus.PUBLISHED,
      instructorId: instructor2.id,
      categoryId: dataScience.id,
      prerequisites: ['Basic Python programming', 'High school mathematics'],
      learningOutcomes: [
        'Master Python for data analysis',
        'Build machine learning models',
        'Create data visualizations',
        'Work with real-world datasets',
        'Deploy ML models to production',
      ],
      targetAudience: [
        'Aspiring data scientists',
        'Python developers interested in ML',
        'Business analysts wanting to learn data science',
      ],
      totalDuration: 43200, // 12 hours
      totalLectures: 150,
      totalStudents: 0,
      publishedAt: new Date(),
    },
  });

  // Course 3: UX/UI Design
  const uxCourse = await prisma.course.create({
    data: {
      title: 'Complete UX/UI Design Masterclass',
      slug: 'complete-ux-ui-design-masterclass',
      subtitle: 'Learn user experience and interface design from scratch',
      description: 'Master UX/UI design with Figma. Learn user research, wireframing, prototyping, and create beautiful user interfaces.',
      thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
      promoVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      price: 79.99,
      discountedPrice: 39.99,
      level: CourseLevel.BEGINNER,
      language: 'English',
      status: CourseStatus.PUBLISHED,
      instructorId: instructor3.id,
      categoryId: design.id,
      prerequisites: ['Basic computer skills', 'No design experience required'],
      learningOutcomes: [
        'Master Figma for UI design',
        'Conduct user research',
        'Create wireframes and prototypes',
        'Design mobile and web interfaces',
        'Build a professional portfolio',
      ],
      targetAudience: [
        'Aspiring UX/UI designers',
        'Graphic designers transitioning to UX/UI',
        'Developers wanting to learn design',
      ],
      totalDuration: 28800, // 8 hours
      totalLectures: 95,
      totalStudents: 0,
      publishedAt: new Date(),
    },
  });

  // Course 4: React Native (Draft)
  const reactNativeCourse = await prisma.course.create({
    data: {
      title: 'React Native - The Complete Guide',
      slug: 'react-native-complete-guide',
      subtitle: 'Build native iOS and Android apps with React Native',
      description: 'Learn React Native and build cross-platform mobile applications for iOS and Android.',
      thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
      price: 94.99,
      level: CourseLevel.INTERMEDIATE,
      language: 'English',
      status: CourseStatus.DRAFT,
      instructorId: instructor1.id,
      categoryId: mobileDev.id,
      prerequisites: ['React knowledge', 'JavaScript ES6+'],
      learningOutcomes: [
        'Build iOS and Android apps',
        'Master React Native navigation',
        'Implement native features',
        'Publish apps to App Store and Play Store',
      ],
      targetAudience: [
        'React developers',
        'Mobile app developers',
        'Full-stack developers',
      ],
      totalDuration: 0,
      totalLectures: 0,
      totalStudents: 0,
    },
  });

  console.log('✅ Courses created!');

  // ==================== SECTIONS & LECTURES ====================
  console.log('📖 Creating sections and lectures...');

  // Node.js Course Sections
  const nodeSection1 = await prisma.section.create({
    data: {
      courseId: nodeCourse.id,
      title: 'Introduction to Node.js',
      description: 'Get started with Node.js basics',
      order: 1,
    },
  });

  await prisma.lecture.createMany({
    data: [
      {
        sectionId: nodeSection1.id,
        title: 'What is Node.js?',
        description: 'Understanding Node.js and its architecture',
        type: LectureType.VIDEO,
        duration: 600,
        order: 1,
        isFree: true,
        videoUrl: 'https://www.youtube.com/watch?v=example1',
        hlsUrl: 'https://cdn.example.com/hls/video1.m3u8',
      },
      {
        sectionId: nodeSection1.id,
        title: 'Setting Up Node.js Development Environment',
        description: 'Install Node.js and set up your development tools',
        type: LectureType.VIDEO,
        duration: 900,
        order: 2,
        isFree: true,
        videoUrl: 'https://www.youtube.com/watch?v=example2',
      },
      {
        sectionId: nodeSection1.id,
        title: 'Your First Node.js Application',
        description: 'Create your first Node.js program',
        type: LectureType.VIDEO,
        duration: 1200,
        order: 3,
        isFree: false,
        videoUrl: 'https://www.youtube.com/watch?v=example3',
      },
    ],
  });

  const nodeSection2 = await prisma.section.create({
    data: {
      courseId: nodeCourse.id,
      title: 'Express.js Fundamentals',
      description: 'Learn Express.js framework',
      order: 2,
    },
  });

  await prisma.lecture.createMany({
    data: [
      {
        sectionId: nodeSection2.id,
        title: 'Introduction to Express.js',
        description: 'What is Express and why use it?',
        type: LectureType.VIDEO,
        duration: 800,
        order: 1,
        videoUrl: 'https://www.youtube.com/watch?v=example4',
      },
      {
        sectionId: nodeSection2.id,
        title: 'Creating Your First Express Server',
        description: 'Build a basic Express server',
        type: LectureType.VIDEO,
        duration: 1500,
        order: 2,
        videoUrl: 'https://www.youtube.com/watch?v=example5',
      },
      {
        sectionId: nodeSection2.id,
        title: 'Routing in Express',
        description: 'Understanding Express routing',
        type: LectureType.VIDEO,
        duration: 1800,
        order: 3,
        videoUrl: 'https://www.youtube.com/watch?v=example6',
      },
      {
        sectionId: nodeSection2.id,
        title: 'Express Middleware',
        description: 'Working with middleware functions',
        type: LectureType.ARTICLE,
        duration: 0,
        order: 4,
        articleContent: '# Understanding Express Middleware\n\nMiddleware functions are functions that have access to the request object (req), the response object (res), and the next middleware function in the application\'s request- response cycle...',
      },
    ],
  });

  const nodeSection3 = await prisma.section.create({
    data: {
      courseId: nodeCourse.id,
      title: 'Working with MongoDB',
      description: 'Database integration with MongoDB',
      order: 3,
    },
  });

  await prisma.lecture.createMany({
    data: [
      {
        sectionId: nodeSection3.id,
        title: 'Introduction to MongoDB',
        description: 'NoSQL database basics',
        type: LectureType.VIDEO,
        duration: 900,
        order: 1,
        videoUrl: 'https://www.youtube.com/watch?v=example7',
      },
      {
        sectionId: nodeSection3.id,
        title: 'Connecting Node.js with MongoDB',
        description: 'Set up MongoDB connection',
        type: LectureType.VIDEO,
        duration: 1200,
        order: 2,
        videoUrl: 'https://www.youtube.com/watch?v=example8',
      },
      {
        sectionId: nodeSection3.id,
        title: 'Mongoose ODM',
        description: 'Using Mongoose for MongoDB',
        type: LectureType.VIDEO,
        duration: 2100,
        order: 3,
        videoUrl: 'https://www.youtube.com/watch?v=example9',
      },
      {
        sectionId: nodeSection3.id,
        title: 'Course Resources',
        description: 'Download MongoDB cheat sheet and code examples',
        type: LectureType.RESOURCE,
        duration: 0,
        order: 4,
        resourceUrl: 'https://example.com/resources/mongodb-cheatsheet.pdf',
      },
    ],
  });

  // Python Course Sections
  const pythonSection1 = await prisma.section.create({
    data: {
      courseId: pythonCourse.id,
      title: 'Python Basics for Data Science',
      description: 'Essential Python concepts',
      order: 1,
    },
  });

  await prisma.lecture.createMany({
    data: [
      {
        sectionId: pythonSection1.id,
        title: 'Python Data Types',
        description: 'Understanding Python data types',
        type: LectureType.VIDEO,
        duration: 1200,
        order: 1,
        isFree: true,
        videoUrl: 'https://www.youtube.com/watch?v=python1',
      },
      {
        sectionId: pythonSection1.id,
        title: 'NumPy Arrays',
        description: 'Working with NumPy arrays',
        type: LectureType.VIDEO,
        duration: 1800,
        order: 2,
        videoUrl: 'https://www.youtube.com/watch?v=python2',
      },
      {
        sectionId: pythonSection1.id,
        title: 'Pandas DataFrames',
        description: 'Introduction to Pandas',
        type: LectureType.VIDEO,
        duration: 2400,
        order: 3,
        videoUrl: 'https://www.youtube.com/watch?v=python3',
      },
    ],
  });

  const pythonSection2 = await prisma.section.create({
    data: {
      courseId: pythonCourse.id,
      title: 'Machine Learning with Scikit-learn',
      description: 'Build your first ML models',
      order: 2,
    },
  });

  await prisma.lecture.createMany({
    data: [
      {
        sectionId: pythonSection2.id,
        title: 'Introduction to Machine Learning',
        description: 'ML concepts and types',
        type: LectureType.VIDEO,
        duration: 1500,
        order: 1,
        videoUrl: 'https://www.youtube.com/watch?v=ml1',
      },
      {
        sectionId: pythonSection2.id,
        title: 'Linear Regression',
        description: 'Build a linear regression model',
        type: LectureType.VIDEO,
        duration: 2700,
        order: 2,
        videoUrl: 'https://www.youtube.com/watch?v=ml2',
      },
      {
        sectionId: pythonSection2.id,
        title: 'Classification Algorithms',
        description: 'Logistic regression and decision trees',
        type: LectureType.VIDEO,
        duration: 3000,
        order: 3,
        videoUrl: 'https://www.youtube.com/watch?v=ml3',
      },
    ],
  });

  // UX/UI Course Sections
  const uxSection1 = await prisma.section.create({
    data: {
      courseId: uxCourse.id,
      title: 'UX Design Fundamentals',
      description: 'Learn the basics of UX design',
      order: 1,
    },
  });

  await prisma.lecture.createMany({
    data: [
      {
        sectionId: uxSection1.id,
        title: 'What is UX Design?',
        description: 'Introduction to user experience',
        type: LectureType.VIDEO,
        duration: 900,
        order: 1,
        isFree: true,
        videoUrl: 'https://www.youtube.com/watch?v=ux1',
      },
      {
        sectionId: uxSection1.id,
        title: 'User Research Methods',
        description: 'Conducting effective user research',
        type: LectureType.VIDEO,
        duration: 1800,
        order: 2,
        videoUrl: 'https://www.youtube.com/watch?v=ux2',
      },
      {
        sectionId: uxSection1.id,
        title: 'Creating User Personas',
        description: 'Build accurate user personas',
        type: LectureType.VIDEO,
        duration: 1500,
        order: 3,
        videoUrl: 'https://www.youtube.com/watch?v=ux3',
      },
    ],
  });

  const uxSection2 = await prisma.section.create({
    data: {
      courseId: uxCourse.id,
      title: 'UI Design with Figma',
      description: 'Master Figma for interface design',
      order: 2,
    },
  });

  await prisma.lecture.createMany({
    data: [
      {
        sectionId: uxSection2.id,
        title: 'Figma Basics',
        description: 'Getting started with Figma',
        type: LectureType.VIDEO,
        duration: 1200,
        order: 1,
        isFree: true,
        videoUrl: 'https://www.youtube.com/watch?v=figma1',
      },
      {
        sectionId: uxSection2.id,
        title: 'Designing Components',
        description: 'Create reusable components',
        type: LectureType.VIDEO,
        duration: 2100,
        order: 2,
        videoUrl: 'https://www.youtube.com/watch?v=figma2',
      },
      {
        sectionId: uxSection2.id,
        title: 'Prototyping in Figma',
        description: 'Build interactive prototypes',
        type: LectureType.VIDEO,
        duration: 2400,
        order: 3,
        videoUrl: 'https://www.youtube.com/watch?v=figma3',
      },
    ],
  });

  console.log('✅ Sections and lectures created!');

  // ==================== ENROLLMENTS ====================
  console.log('🎓 Creating enrollments...');

  // Enroll students in courses
  const enrollments = [
    // Student 1 enrolls in Node.js
    {
      userId: allStudents[0].id,
      courseId: nodeCourse.id,
      status: EnrollmentStatus.ACTIVE,
      progress: 35.5,
      enrolledAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    // Student 1 completes Python course
    {
      userId: allStudents[0].id,
      courseId: pythonCourse.id,
      status: EnrollmentStatus.COMPLETED,
      progress: 100,
      enrolledAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      lastAccessedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    // Student 2 enrolls in all courses
    {
      userId: allStudents[1].id,
      courseId: nodeCourse.id,
      status: EnrollmentStatus.ACTIVE,
      progress: 60.0,
      enrolledAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      lastAccessedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId: allStudents[1].id,
      courseId: pythonCourse.id,
      status: EnrollmentStatus.ACTIVE,
      progress: 25.0,
      enrolledAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      lastAccessedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      userId: allStudents[1].id,
      courseId: uxCourse.id,
      status: EnrollmentStatus.ACTIVE,
      progress: 80.5,
      enrolledAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      lastAccessedAt: new Date(),
    },
    // Student 3 enrolls in UX course
    {
      userId: allStudents[2].id,
      courseId: uxCourse.id,
      status: EnrollmentStatus.ACTIVE,
      progress: 15.0,
      enrolledAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      lastAccessedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    // Student 4 enrolls in Python
    {
      userId: allStudents[3].id,
      courseId: pythonCourse.id,
      status: EnrollmentStatus.ACTIVE,
      progress: 50.0,
      enrolledAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      lastAccessedAt: new Date(),
    },
    // Student 5 enrolls in Node.js
    {
      userId: allStudents[4].id,
      courseId: nodeCourse.id,
      status: EnrollmentStatus.ACTIVE,
      progress: 10.0,
      enrolledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      lastAccessedAt: new Date(),
    },
  ];

  await prisma.enrollment.createMany({ data: enrollments });

  console.log('✅ Enrollments created!');

  // ==================== REVIEWS ====================
  console.log('⭐ Creating reviews...');

  const reviews = [
    {
      userId: allStudents[0].id,
      courseId: pythonCourse.id,
      rating: 5,
      title: 'Excellent course for beginners!',
      comment: 'This course is absolutely fantastic! The instructor explains everything clearly and the projects are very practical. I went from knowing nothing about data science to building my own ML models.',
      helpful: 12,
    },
    {
      userId: allStudents[0].id,
      courseId: nodeCourse.id,
      rating: 4,
      title: 'Great content, a bit fast-paced',
      comment: 'Really good course overall. The projects are excellent and very relevant. Sometimes the pace is a bit fast but rewatching helps.',
      helpful: 8,
    },
    {
      userId: allStudents[1].id,
      courseId: nodeCourse.id,
      rating: 5,
      title: 'Best Node.js course on the platform',
      comment: 'I have taken several Node.js courses and this is by far the best one. John explains everything so well and the real-world projects are amazing.',
      helpful: 25,
    },
    {
      userId: allStudents[1].id,
      courseId: uxCourse.id,
      rating: 5,
      title: 'Perfect for career transition',
      comment: 'I am a developer trying to learn design and this course was perfect. Mike makes everything easy to understand and the Figma projects are great.',
      helpful: 15,
    },
    {
      userId: allStudents[2].id,
      courseId: uxCourse.id,
      rating: 4,
      title: 'Very comprehensive',
      comment: 'Covers everything you need to know about UX/UI design. Would love to see more advanced topics though.',
      helpful: 6,
    },
    {
      userId: allStudents[3].id,
      courseId: pythonCourse.id,
      rating: 5,
      title: 'Amazing instructor!',
      comment: 'Jane is an incredible teacher. Her explanations are crystal clear and the course structure is perfect. Highly recommended!',
      helpful: 18,
    },
  ];

  await prisma.review.createMany({ data: reviews });

  console.log('✅ Reviews created!');

  // ==================== PAYMENTS ====================
  console.log('💳 Creating payments...');

  const payments = [
    {
      userId: allStudents[0].id,
      courseId: nodeCourse.id,
      amount: 49.99,
      currency: 'USD',
      status: PaymentStatus.COMPLETED,
      provider: PaymentProvider.STRIPE,
      transactionId: 'txn_1234567890abcdef',
      paymentIntentId: 'pi_1234567890abcdef',
      paymentMethodId: 'card_1234567890',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      userId: allStudents[0].id,
      courseId: pythonCourse.id,
      amount: 59.99,
      currency: 'USD',
      status: PaymentStatus.COMPLETED,
      provider: PaymentProvider.STRIPE,
      transactionId: 'txn_0987654321fedcba',
      paymentIntentId: 'pi_0987654321fedcba',
      paymentMethodId: 'card_1234567890',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
    {
      userId: allStudents[1].id,
      courseId: nodeCourse.id,
      amount: 49.99,
      currency: 'USD',
      status: PaymentStatus.COMPLETED,
      provider: PaymentProvider.PAYPAL,
      transactionId: 'PAY-12345ABCDE',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    },
    {
      userId: allStudents[1].id,
      courseId: pythonCourse.id,
      amount: 59.99,
      currency: 'USD',
      status: PaymentStatus.COMPLETED,
      provider: PaymentProvider.STRIPE,
      transactionId: 'txn_abcdef1234567890',
      paymentIntentId: 'pi_abcdef1234567890',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
    {
      userId: allStudents[1].id,
      courseId: uxCourse.id,
      amount: 39.99,
      currency: 'USD',
      status: PaymentStatus.COMPLETED,
      provider: PaymentProvider.STRIPE,
      transactionId: 'txn_xyz789456123',
      paymentIntentId: 'pi_xyz789456123',
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    },
    {
      userId: allStudents[2].id,
      courseId: uxCourse.id,
      amount: 39.99,
      currency: 'USD',
      status: PaymentStatus.COMPLETED,
      provider: PaymentProvider.STRIPE,
      transactionId: 'txn_design123456',
      paymentIntentId: 'pi_design123456',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      userId: allStudents[3].id,
      courseId: pythonCourse.id,
      amount: 59.99,
      currency: 'USD',
      status: PaymentStatus.COMPLETED,
      provider: PaymentProvider.PAYPAL,
      transactionId: 'PAY-PYTHON67890',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    },
    {
      userId: allStudents[4].id,
      courseId: nodeCourse.id,
      amount: 49.99,
      currency: 'USD',
      status: PaymentStatus.COMPLETED,
      provider: PaymentProvider.STRIPE,
      transactionId: 'txn_node987654',
      paymentIntentId: 'pi_node987654',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ];

  await prisma.payment.createMany({ data: payments });

  console.log('✅ Payments created!');

  // ==================== CERTIFICATES ====================
  console.log('🎓 Creating certificates...');

  const certificates = [
    {
      userId: allStudents[0].id,
      courseId: pythonCourse.id,
      certificateUrl: 'https://certificates.udemy.com/UC-PYTHON-001.pdf',
      verificationCode: 'UC-PYTHON-001-2024',
      issuedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
  ];

  await prisma.certificate.createMany({ data: certificates });

  console.log('✅ Certificates created!');

  // ==================== UPDATE COURSE STATISTICS ====================
  console.log('📊 Updating course statistics...');

  // Update Node.js course stats
  const nodeEnrollmentCount = enrollments.filter(e => e.courseId === nodeCourse.id).length;
  const nodeReviews = reviews.filter(r => r.courseId === nodeCourse.id);
  const nodeAvgRating = nodeReviews.reduce((sum, r) => sum + r.rating, 0) / nodeReviews.length;

  await prisma.course.update({
    where: { id: nodeCourse.id },
    data: {
      totalStudents: nodeEnrollmentCount,
      totalReviews: nodeReviews.length,
      averageRating: nodeAvgRating,
    },
  });

  // Update Python course stats
  const pythonEnrollmentCount = enrollments.filter(e => e.courseId === pythonCourse.id).length;
  const pythonReviews = reviews.filter(r => r.courseId === pythonCourse.id);
  const pythonAvgRating = pythonReviews.reduce((sum, r) => sum + r.rating, 0) / pythonReviews.length;

  await prisma.course.update({
    where: { id: pythonCourse.id },
    data: {
      totalStudents: pythonEnrollmentCount,
      totalReviews: pythonReviews.length,
      averageRating: pythonAvgRating,
    },
  });

  // Update UX course stats
  const uxEnrollmentCount = enrollments.filter(e => e.courseId === uxCourse.id).length;
  const uxReviews = reviews.filter(r => r.courseId === uxCourse.id);
  const uxAvgRating = uxReviews.reduce((sum, r) => sum + r.rating, 0) / uxReviews.length;

  await prisma.course.update({
    where: { id: uxCourse.id },
    data: {
      totalStudents: uxEnrollmentCount,
      totalReviews: uxReviews.length,
      averageRating: uxAvgRating,
    },
  });

  console.log('✅ Course statistics updated!');

  // ==================== SUMMARY ====================
  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`👥 Users created: ${1 + 3 + 5} (1 admin, 3 instructors, 5 students)`);
  console.log(`📂 Categories created: ${5} main + ${12} subcategories`);
  console.log(`📚 Courses created: ${4} (3 published, 1 draft)`);
  console.log(`📖 Sections created: ${8}`);
  console.log(`🎬 Lectures created: ${23}`);
  console.log(`🎓 Enrollments created: ${enrollments.length}`);
  console.log(`⭐ Reviews created: ${reviews.length}`);
  console.log(`💳 Payments created: ${payments.length}`);
  console.log(`🏆 Certificates created: ${certificates.length}`);
  console.log('\n📝 Test Credentials:');
  console.log('Admin: admin@udemy.com / password123');
  console.log('Instructor 1: john.doe@udemy.com / password123');
  console.log('Instructor 2: jane.smith@udemy.com / password123');
  console.log('Instructor 3: mike.johnson@udemy.com / password123');
  console.log('Student 1: student1@example.com / password123');
  console.log('Student 2: student2@example.com / password123');
  console.log('\n🚀 You can now start the application!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
