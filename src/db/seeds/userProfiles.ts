import { db } from '@/db';
import { userProfiles } from '@/db/schema';

async function main() {
    const sampleProfiles = [
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            role: 'instructor',
            bio: 'Passionate web developer with over 8 years of experience in full-stack development. I specialize in React, Node.js, and modern JavaScript frameworks. I believe in teaching through practical, real-world projects that prepare students for their careers. My courses focus on building production-ready applications while following industry best practices.',
            website: 'https://sarahjohnsondev.com',
            totalStudents: 157,
            totalCourses: 3,
            createdAt: new Date('2024-01-15').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r5',
            role: 'instructor',
            bio: 'Data Science expert with a PhD in Statistics and 6 years of industry experience at leading tech companies. I help students master Python, machine learning, and data visualization through hands-on projects. My teaching philosophy emphasizes understanding the theory behind algorithms while building practical skills for real data science roles.',
            website: 'https://linkedin.com/in/davidchen-datascience',
            totalStudents: 203,
            totalCourses: 2,
            createdAt: new Date('2024-01-18').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r6',
            role: 'student',
            bio: 'Marketing professional transitioning into digital marketing. Currently learning about SEO, social media marketing, and content strategy. Passionate about creating engaging campaigns that connect brands with their audiences. Looking to combine traditional marketing knowledge with modern digital techniques.',
            website: null,
            totalStudents: 0,
            totalCourses: 0,
            createdAt: new Date('2024-01-22').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r7',
            role: 'student',
            bio: 'Design enthusiast with a background in graphic design, now diving deep into UI/UX design. Fascinated by user-centered design principles and creating intuitive digital experiences. Currently learning Figma, user research methodologies, and prototyping techniques to become a well-rounded product designer.',
            website: null,
            totalStudents: 0,
            totalCourses: 0,
            createdAt: new Date('2024-01-25').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r8',
            role: 'student',
            bio: 'Business administration student with dreams of starting my own company. Exploring various aspects of entrepreneurship including business planning, market analysis, and startup funding. Particularly interested in tech startups and sustainable business models. Always eager to learn from successful entrepreneurs and apply new concepts.',
            website: null,
            totalStudents: 0,
            totalCourses: 0,
            createdAt: new Date('2024-01-28').toISOString(),
        }
    ];

    await db.insert(userProfiles).values(sampleProfiles);
    
    console.log('✅ User profiles seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});