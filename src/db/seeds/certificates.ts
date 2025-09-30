import { db } from '@/db';
import { certificates } from '@/db/schema';

async function main() {
    const sampleCertificates = [
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r8',
            courseId: 4,
            issuedDate: new Date('2024-02-15').toISOString(),
            certificateUrl: 'https://certificates.learningplatform.com/cert_business_strategy_lisa_thompson_2024.pdf',
            createdAt: new Date('2024-02-15').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r7',
            courseId: 5,
            issuedDate: new Date('2024-02-20').toISOString(),
            certificateUrl: 'https://certificates.learningplatform.com/cert_react_mastery_james_wilson_2024.pdf',
            createdAt: new Date('2024-02-20').toISOString(),
        },
    ];

    await db.insert(certificates).values(sampleCertificates);
    
    console.log('✅ Certificates seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});