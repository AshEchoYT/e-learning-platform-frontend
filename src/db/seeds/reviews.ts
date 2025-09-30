import { db } from '@/db';
import { reviews } from '@/db/schema';

async function main() {
    const sampleReviews = [
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r6',
            courseId: 3,
            rating: 5,
            comment: 'Excellent comprehensive course that covers everything from basics to advanced data analysis. The instructor does an amazing job explaining complex concepts with real-world examples. I particularly loved the hands-on projects with actual datasets. The pandas and matplotlib sections were incredibly detailed and practical. This course has significantly boosted my confidence in data science and I feel ready to tackle real projects at work. Highly recommended for anyone serious about learning Python for data science!',
            createdAt: new Date('2024-01-20').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r7',
            courseId: 2,
            rating: 4,
            comment: 'Great practical approach to learning web development. The course structure is well-organized and the projects are engaging. I especially appreciated the focus on building actual applications rather than just theoretical concepts. The HTML, CSS, and JavaScript fundamentals were solid, and the deployment section was very helpful. The only minor issue was that some of the more advanced topics could have used more depth. Overall, this gave me the skills I needed to build my first portfolio website.',
            createdAt: new Date('2024-01-25').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r7',
            courseId: 5,
            rating: 5,
            comment: 'Best React course I have taken! The instructor has a deep understanding of React and explains concepts clearly with excellent examples. The progression from basic components to advanced hooks and state management is perfect. I loved the section on Redux Toolkit and the modern React patterns. The final project was challenging but incredibly rewarding. After completing this course, I feel confident building production-ready React applications. The code examples are clean and follow best practices throughout.',
            createdAt: new Date('2024-02-05').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r8',
            courseId: 4,
            rating: 4,
            comment: 'Solid business strategy course with practical insights for real-world application. The case studies were particularly valuable and helped me understand how successful companies implement strategic thinking. The frameworks presented are actionable and I have already started applying some concepts at my current job. The instructor has clear industry experience which shows in the quality of content. Could have benefited from more interactive elements, but the content quality makes up for it. Great foundation for anyone looking to advance their business acumen.',
            createdAt: new Date('2024-02-10').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r8',
            courseId: 6,
            rating: 5,
            comment: 'Amazing introduction to Python for data science! As someone completely new to programming, I was worried this would be too technical, but the instructor makes everything accessible and engaging. The step-by-step approach to learning Python syntax while immediately applying it to data problems is brilliant. The visualization exercises with matplotlib helped me see the power of data storytelling. The final project analyzing real datasets gave me confidence to pursue more advanced data science topics. This course exceeded my expectations in every way!',
            createdAt: new Date('2024-02-15').toISOString(),
        },
    ];

    await db.insert(reviews).values(sampleReviews);
    
    console.log('✅ Reviews seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});