import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Main Categories
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
  await prisma.category.createMany({
    data: [
      {
        name: 'Web Development',
        slug: 'web-development',
        description: 'HTML, CSS, JavaScript, React, Node.js',
        icon: '🌐',
        parentId: development.id,
      },
      {
        name: 'Mobile Development',
        slug: 'mobile-development',
        description: 'iOS, Android, React Native, Flutter',
        icon: '📱',
        parentId: development.id,
      },
      {
        name: 'Data Science',
        slug: 'data-science',
        description: 'Python, Machine Learning, Data Analysis',
        icon: '📊',
        parentId: development.id,
      },
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
    ],
  });

  // Business Subcategories
  await prisma.category.createMany({
    data: [
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
        name: 'Project Management',
        slug: 'project-management',
        description: 'Agile, Scrum, PMP',
        icon: '📋',
        parentId: business.id,
      },
      {
        name: 'Sales',
        slug: 'sales',
        description: 'Sales techniques and strategies',
        icon: '🤝',
        parentId: business.id,
      },
    ],
  });

  // Design Subcategories
  await prisma.category.createMany({
    data: [
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
        name: '3D Design',
        slug: '3d-design',
        description: 'Blender, Maya, 3D modeling',
        icon: '🎭',
        parentId: design.id,
      },
    ],
  });

  // Marketing Subcategories
  await prisma.category.createMany({
    data: [
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
      {
        name: 'Social Media Marketing',
        slug: 'social-media-marketing',
        description: 'Instagram, Facebook, TikTok',
        icon: '📱',
        parentId: marketing.id,
      },
      {
        name: 'Content Marketing',
        slug: 'content-marketing',
        description: 'Content strategy and creation',
        icon: '✍️',
        parentId: marketing.id,
      },
    ],
  });

  console.log('✅ Categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
