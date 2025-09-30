import { db } from '@/db';
import { enrollments } from '@/db/schema';

async function main() {
    const sampleEnrollments = [
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r6',
            courseId: 3,
            progress: 60,
            lastAccessed: new Date('2024-02-20').toISOString(),
            completedAt: null,
            enrolledAt: new Date('2024-01-15').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r7',
            courseId: 2,
            progress: 35,
            lastAccessed: new Date('2024-02-18').toISOString(),
            completedAt: null,
            enrolledAt: new Date('2024-01-20').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r7',
            courseId: 5,
            progress: 80,
            lastAccessed: new Date('2024-02-15').toISOString(),
            completedAt: null,
            enrolledAt: new Date('2023-12-10').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r8',
            courseId: 4,
            progress: 100,
            lastAccessed: new Date('2024-01-25').toISOString(),
            completedAt: new Date('2024-01-25').toISOString(),
            enrolledAt: new Date('2023-11-30').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r8',
            courseId: 6,
            progress: 25,
            lastAccessed: new Date('2024-02-10').toISOString(),
            completedAt: null,
            enrolledAt: new Date('2024-02-05').toISOString(),
        }
    ];

    await db.insert(enrollments).values(sampleEnrollments);
    
    console.log('✅ Enrollments seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});