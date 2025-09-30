import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  enrollments, 
  courses, 
  lessonProgress, 
  certificates, 
  categories,
  userProfiles,
  lessons,
  user
} from '@/db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user has student role
    const userProfile = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, currentUser.id))
      .limit(1);

    if (userProfile.length === 0 || userProfile[0].role !== 'student') {
      return NextResponse.json({ 
        error: 'Student access required',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    // Get enrollments with course and category details
    const enrollmentsData = await db.select({
      id: enrollments.id,
      progress: enrollments.progress,
      lastAccessed: enrollments.lastAccessed,
      completedAt: enrollments.completedAt,
      enrolledAt: enrollments.enrolledAt,
      courseId: courses.id,
      courseTitle: courses.title,
      courseDescription: courses.description,
      courseImage: courses.image,
      courseDuration: courses.duration,
      courseRating: courses.rating,
      categoryName: categories.name,
      instructorName: user.name
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .leftJoin(user, eq(courses.instructorId, user.id))
    .where(eq(enrollments.userId, currentUser.id))
    .orderBy(desc(enrollments.lastAccessed));

    // Get recent activity (lesson progress updates)
    const recentActivity = await db.select({
      id: lessonProgress.id,
      lessonTitle: lessons.title,
      sectionTitle: lessons.sectionTitle,
      courseTitle: courses.title,
      courseId: courses.id,
      completed: lessonProgress.completed,
      completedAt: lessonProgress.completedAt,
      lastPosition: lessonProgress.lastPosition
    })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .innerJoin(enrollments, and(
      eq(enrollments.courseId, courses.id),
      eq(enrollments.userId, currentUser.id)
    ))
    .where(eq(lessonProgress.userId, currentUser.id))
    .orderBy(desc(lessonProgress.completedAt))
    .limit(10);

    // Get certificates
    const certificatesData = await db.select({
      id: certificates.id,
      courseTitle: courses.title,
      courseId: courses.id,
      issuedDate: certificates.issuedDate,
      certificateUrl: certificates.certificateUrl,
      createdAt: certificates.createdAt
    })
    .from(certificates)
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .where(eq(certificates.userId, currentUser.id))
    .orderBy(desc(certificates.issuedDate));

    // Calculate statistics
    const totalEnrollments = enrollmentsData.length;
    const completedCourses = enrollmentsData.filter(e => e.completedAt).length;
    const averageProgress = totalEnrollments > 0 
      ? Math.round(enrollmentsData.reduce((sum, e) => sum + (e.progress || 0), 0) / totalEnrollments)
      : 0;

    const stats = {
      totalEnrollments,
      completedCourses,
      averageProgress,
      totalCertificates: certificatesData.length
    };

    // Get enrolled categories for recommendations
    const enrolledCategories = enrollmentsData
      .map(e => e.categoryName)
      .filter(Boolean)
      .filter((category, index, self) => self.indexOf(category) === index);

    // Get course recommendations based on enrolled categories
    const recommendations = await db.select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      price: courses.price,
      image: courses.image,
      rating: courses.rating,
      studentsCount: courses.studentsCount,
      categoryName: categories.name,
      instructorName: user.name
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .leftJoin(user, eq(courses.instructorId, user.id))
    .where(and(
      eq(courses.published, true),
      sql`${categories.name} IN (${
        enrolledCategories.length > 0 
          ? enrolledCategories.map(() => '?').join(',') 
          : 'NULL'
      })`,
      sql`${courses.id} NOT IN (${
        enrollmentsData.length > 0 
          ? enrollmentsData.map(() => '?').join(',')
          : 'NULL'
      })`
    ))
    .orderBy(desc(courses.rating), desc(courses.studentsCount))
    .limit(6);

    const dashboardData = {
      enrollments: enrollmentsData,
      recentActivity,
      certificates: certificatesData,
      stats,
      recommendations: enrolledCategories.length > 0 ? recommendations : []
    };

    return NextResponse.json(dashboardData, { status: 200 });

  } catch (error) {
    console.error('GET dashboard error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}