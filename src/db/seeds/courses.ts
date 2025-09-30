import { db } from '@/db';
import { courses } from '@/db/schema';

async function main() {
    const sampleCourses = [
        {
            title: 'Complete Web Development Bootcamp',
            description: 'Master web development from scratch with HTML, CSS, JavaScript, React, Node.js, and more. This comprehensive bootcamp covers everything you need to become a full-stack web developer. Build real-world projects, learn industry best practices, and gain the skills to land your first developer job.',
            instructorId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            categoryId: 1,
            price: 99.00,
            duration: '80 hours',
            image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop',
            studentsCount: 150,
            rating: 4.8,
            totalRatings: 45,
            published: true,
            createdAt: new Date('2024-01-10').toISOString(),
            updatedAt: new Date('2024-01-10').toISOString(),
        },
        {
            title: 'React Mastery: Build Modern Web Apps',
            description: 'Deep dive into React and learn to build scalable, modern web applications. Cover hooks, context, state management, testing, and deployment. Build multiple projects including an e-commerce site, social media dashboard, and task management app.',
            instructorId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            categoryId: 1,
            price: 129.00,
            duration: '60 hours',
            image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
            studentsCount: 120,
            rating: 4.7,
            totalRatings: 32,
            published: true,
            createdAt: new Date('2024-01-15').toISOString(),
            updatedAt: new Date('2024-01-15').toISOString(),
        },
        {
            title: 'Python Data Science Complete Course',
            description: 'Comprehensive Python data science course covering NumPy, Pandas, Matplotlib, Seaborn, Scikit-learn, and more. Learn data manipulation, visualization, statistical analysis, and machine learning. Work with real datasets and build end-to-end data science projects.',
            instructorId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r5',
            categoryId: 2,
            price: 149.00,
            duration: '100 hours',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
            studentsCount: 200,
            rating: 4.9,
            totalRatings: 67,
            published: true,
            createdAt: new Date('2024-01-20').toISOString(),
            updatedAt: new Date('2024-01-20').toISOString(),
        },
        {
            title: 'Machine Learning Fundamentals',
            description: 'Learn the foundations of machine learning with Python. Cover supervised and unsupervised learning, neural networks, deep learning basics, and model evaluation. Hands-on projects include image classification, natural language processing, and predictive modeling.',
            instructorId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r5',
            categoryId: 2,
            price: 179.00,
            duration: '75 hours',
            image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop',
            studentsCount: 85,
            rating: 4.6,
            totalRatings: 23,
            published: true,
            createdAt: new Date('2024-01-25').toISOString(),
            updatedAt: new Date('2024-01-25').toISOString(),
        },
        {
            title: 'Advanced Business Strategy',
            description: 'Master strategic thinking and business planning with this comprehensive course. Learn competitive analysis, market positioning, strategic frameworks, and execution strategies. Case studies from Fortune 500 companies and interactive workshops included.',
            instructorId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            categoryId: 3,
            price: 199.00,
            duration: '50 hours',
            image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
            studentsCount: 60,
            rating: 4.5,
            totalRatings: 18,
            published: true,
            createdAt: new Date('2024-02-01').toISOString(),
            updatedAt: new Date('2024-02-01').toISOString(),
        },
        {
            title: 'Digital Marketing Mastery',
            description: 'Complete digital marketing course covering SEO, social media marketing, content marketing, email campaigns, PPC advertising, and analytics. Learn to create comprehensive marketing strategies and measure ROI across multiple channels.',
            instructorId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            categoryId: 4,
            price: 119.00,
            duration: '45 hours',
            image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
            studentsCount: 0,
            rating: 0,
            totalRatings: 0,
            published: false,
            createdAt: new Date('2024-02-05').toISOString(),
            updatedAt: new Date('2024-02-05').toISOString(),
        },
    ];

    await db.insert(courses).values(sampleCourses);
    
    console.log('✅ Courses seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});