import { db } from '@/db';
import { lessonProgress } from '@/db/schema';

async function main() {
    const sampleLessonProgress = [
        // James Wilson (user_01h4kxt2e8z9y3b1n7m6q5w8r7) - Web Development Bootcamp (courseId: 1)
        // Completed first 5 lessons
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r7',
            lessonId: 1,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-10T14:30:00Z').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r7',
            lessonId: 2,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-11T09:15:00Z').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r7',
            lessonId: 3,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-12T16:45:00Z').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r7',
            lessonId: 4,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-13T11:20:00Z').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r7',
            lessonId: 5,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-14T15:30:00Z').toISOString(),
        },
        // Working on lesson 6
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r7',
            lessonId: 6,
            completed: false,
            lastPosition: 420,
            completedAt: null,
        },

        // Emily Rodriguez (user_01h4kxt2e8z9y3b1n7m6q5w8r6) - Python Data Science (courseId: 3)
        // Completed first 6 lessons
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r6',
            lessonId: 10,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-08T10:00:00Z').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r6',
            lessonId: 11,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-09T14:15:00Z').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r6',
            lessonId: 12,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-10T11:30:00Z').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r6',
            lessonId: 13,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-11T16:45:00Z').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r6',
            lessonId: 14,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-12T13:20:00Z').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r6',
            lessonId: 15,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-13T09:10:00Z').toISOString(),
        },
        // Currently on lesson 7
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r6',
            lessonId: 16,
            completed: false,
            lastPosition: 680,
            completedAt: null,
        },

        // Lisa Thompson (user_01h4kxt2e8z9y3b1n7m6q5w8r8) - Business Strategy (courseId: 4)
        // All lessons completed
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r8',
            lessonId: 20,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-05T10:30:00Z').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r8',
            lessonId: 21,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-06T14:15:00Z').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r8',
            lessonId: 22,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-07T11:45:00Z').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r8',
            lessonId: 23,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-08T15:20:00Z').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r8',
            lessonId: 24,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-09T12:00:00Z').toISOString(),
        },

        // Lisa Thompson (user_01h4kxt2e8z9y3b1n7m6q5w8r8) - Python Data Science (courseId: 6)
        // First 3 lessons completed
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r8',
            lessonId: 30,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-15T09:30:00Z').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r8',
            lessonId: 31,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-16T13:45:00Z').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r8',
            lessonId: 32,
            completed: true,
            lastPosition: 0,
            completedAt: new Date('2024-01-17T16:20:00Z').toISOString(),
        }
    ];

    await db.insert(lessonProgress).values(sampleLessonProgress);
    
    console.log('✅ Lesson progress seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});