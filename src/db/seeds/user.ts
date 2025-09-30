import { db } from '@/db';
import { user } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            id: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@techacademy.com',
            emailVerified: true,
            image: 'https://images.unsplash.com/photo-1494790108755-2616b45e2d08?w=400&h=400&fit=crop&crop=face',
            createdAt: new Date('2024-08-15'),
            updatedAt: new Date('2024-08-15'),
        },
        {
            id: 'user_01h4kxt2e8z9y3b1n7m6q5w8r5',
            name: 'David Chen',
            email: 'david.chen@datalearn.com',
            emailVerified: true,
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
            createdAt: new Date('2024-07-22'),
            updatedAt: new Date('2024-07-22'),
        },
        {
            id: 'user_01h4kxt2e8z9y3b1n7m6q5w8r6',
            name: 'Emily Rodriguez',
            email: 'emily.rodriguez@university.edu',
            emailVerified: true,
            image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
            createdAt: new Date('2024-10-05'),
            updatedAt: new Date('2024-10-05'),
        },
        {
            id: 'user_01h4kxt2e8z9y3b1n7m6q5w8r7',
            name: 'James Wilson',
            email: 'james.wilson@designstudio.com',
            emailVerified: true,
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
            createdAt: new Date('2024-09-18'),
            updatedAt: new Date('2024-09-18'),
        },
        {
            id: 'user_01h4kxt2e8z9y3b1n7m6q5w8r8',
            name: 'Lisa Thompson',
            email: 'lisa.thompson@businesscollege.edu',
            emailVerified: true,
            image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
            createdAt: new Date('2024-11-12'),
            updatedAt: new Date('2024-11-12'),
        }
    ];

    await db.insert(user).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});