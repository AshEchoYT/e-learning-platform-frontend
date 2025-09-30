import { db } from '@/db';
import { categories } from '@/db/schema';

async function main() {
    const sampleCategories = [
        {
            name: 'Web Development',
            description: 'Master the fundamentals of web development including HTML, CSS, JavaScript, and popular frameworks like React, Vue, and Angular. Build responsive websites and dynamic web applications.',
            createdAt: new Date('2024-01-10').toISOString(),
        },
        {
            name: 'Data Science',
            description: 'Dive into the world of data science with Python programming, machine learning algorithms, statistical analysis, and data visualization techniques to extract insights from complex datasets.',
            createdAt: new Date('2024-01-12').toISOString(),
        },
        {
            name: 'Design',
            description: 'Learn UI/UX design principles, graphic design fundamentals, color theory, typography, and design tools like Figma and Adobe Creative Suite to create stunning visual experiences.',
            createdAt: new Date('2024-01-15').toISOString(),
        },
        {
            name: 'Marketing',
            description: 'Explore digital marketing strategies including social media marketing, search engine optimization (SEO), content marketing, email campaigns, and analytics to grow your business online.',
            createdAt: new Date('2024-01-18').toISOString(),
        },
        {
            name: 'Mobile Development',
            description: 'Build mobile applications for iOS and Android platforms using native development tools, React Native, Flutter, and modern mobile app development best practices.',
            createdAt: new Date('2024-01-20').toISOString(),
        },
        {
            name: 'Cloud Computing',
            description: 'Master cloud platforms like AWS and Azure, learn DevOps practices, containerization with Docker, infrastructure as code, and scalable cloud architecture design.',
            createdAt: new Date('2024-01-22').toISOString(),
        },
        {
            name: 'Business',
            description: 'Develop essential business skills including entrepreneurship, project management, financial planning, leadership strategies, and business development to succeed in the corporate world.',
            createdAt: new Date('2024-01-25').toISOString(),
        },
        {
            name: 'Photography',
            description: 'Learn professional photography techniques, camera settings, composition rules, lighting principles, and photo editing with Adobe Lightroom and Photoshop to capture stunning images.',
            createdAt: new Date('2024-01-28').toISOString(),
        },
        {
            name: 'Python',
            description: 'Comprehensive Python programming courses covering fundamentals, advanced concepts, web development with Django and Flask, automation, and data manipulation with popular libraries.',
            createdAt: new Date('2024-02-01').toISOString(),
        }
    ];

    await db.insert(categories).values(sampleCategories);
    
    console.log('✅ Categories seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});