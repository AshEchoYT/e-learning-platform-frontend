import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses, enrollments, reviews, user, userProfiles, categories } from '@/db/schema';
import { eq, and, desc, count, sum, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is an instructor
    const userProfile = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, currentUser.id))
      .limit(1);

    if (userProfile.length === 0 || userProfile[0].role !== 'instructor') {
      return NextResponse.json({ 
        error: 'Access denied. Instructor role required.',
        code: 'INSTRUCTOR_REQUIRED' 
      }, { status: 403 });
    }

    // Get instructor's courses with enrollment counts and revenue
    const instructorCourses = await db.select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      price: courses.price,
      studentsCount: courses.studentsCount,
      rating: courses.rating,
      totalRatings: courses.totalRatings,
      published: courses.published,
      createdAt: courses.createdAt,
      categoryName: categories.name,
      enrollmentCount: count(enrollments.id),
      revenue: sql<number>`COALESCE(COUNT(${enrollments.id}) * ${courses.price}, 0)`
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .leftJoin(enrollments, eq(courses.id, enrollments.courseId))
    .where(eq(courses.instructorId, currentUser.id))
    .groupBy(courses.id, categories.name);

    // Calculate total students (unique across all courses)
    const totalStudentsResult = await db.select({
      uniqueStudents: count(sql`DISTINCT ${enrollments.userId}`)
    })
    .from(enrollments)
    .leftJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(courses.instructorId, currentUser.id));

    const totalStudents = totalStudentsResult[0]?.uniqueStudents || 0;

    // Calculate total revenue
    const totalRevenue = instructorCourses.reduce((sum, course) => sum + (course.revenue || 0), 0);

    // Get recent enrollments (last 10)
    const recentEnrollments = await db.select({
      id: enrollments.id,
      enrolledAt: enrollments.enrolledAt,
      progress: enrollments.progress,
      courseTitle: courses.title,
      courseId: courses.id,
      studentName: user.name,
      studentEmail: user.email,
      studentImage: user.image
    })
    .from(enrollments)
    .leftJoin(courses, eq(enrollments.courseId, courses.id))
    .leftJoin(user, eq(enrollments.userId, user.id))
    .where(eq(courses.instructorId, currentUser.id))
    .orderBy(desc(enrollments.enrolledAt))
    .limit(10);

    // Get top courses by enrollment and rating
    const topCourses = instructorCourses
      .filter(course => course.published)
      .sort((a, b) => {
        // Sort by enrollment count first, then by rating
        if (a.enrollmentCount !== b.enrollmentCount) {
          return (b.enrollmentCount || 0) - (a.enrollmentCount || 0);
        }
        return (b.rating || 0) - (a.rating || 0);
      })
      .slice(0, 5);

    // Get monthly stats for the last 12 months
    const monthlyStatsRaw = await db.select({
      month: sql<string>`strftime('%Y-%m', ${enrollments.enrolledAt})`,
      enrollmentCount: count(enrollments.id),
      revenue: sql<number>`COUNT(${enrollments.id}) * AVG(${courses.price})`
    })
    .from(enrollments)
    .leftJoin(courses, eq(enrollments.courseId, courses.id))
    .where(
      and(
        eq(courses.instructorId, currentUser.id),
        sql`${enrollments.enrolledAt} >= date('now', '-12 months')`
      )
    )
    .groupBy(sql`strftime('%Y-%m', ${enrollments.enrolledAt})`)
    .orderBy(sql`strftime('%Y-%m', ${enrollments.enrolledAt})`);

    // Format monthly stats and fill missing months
    const monthlyStats = [];
    const currentDate = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toISOString().substring(0, 7);
      const existingData = monthlyStatsRaw.find(stat => stat.month === monthKey);
      
      monthlyStats.push({
        month: monthKey,
        enrollmentCount: existingData?.enrollmentCount || 0,
        revenue: existingData?.revenue || 0
      });
    }

    // Get recent reviews on instructor's courses
    const recentReviews = await db.select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      courseTitle: courses.title,
      courseId: courses.id,
      studentName: user.name,
      studentImage: user.image
    })
    .from(reviews)
    .leftJoin(courses, eq(reviews.courseId, courses.id))
    .leftJoin(user, eq(reviews.userId, user.id))
    .where(eq(courses.instructorId, currentUser.id))
    .orderBy(desc(reviews.createdAt))
    .limit(10);

    const dashboardData = {
      courses: instructorCourses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        price: course.price,
        studentsCount: course.studentsCount,
        rating: course.rating,
        totalRatings: course.totalRatings,
        published: course.published,
        createdAt: course.createdAt,
        categoryName: course.categoryName,
        enrollmentCount: course.enrollmentCount || 0,
        revenue: course.revenue || 0
      })),
      totalStudents,
      totalRevenue,
      recentEnrollments: recentEnrollments.map(enrollment => ({
        id: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress,
        course: {
          id: enrollment.courseId,
          title: enrollment.courseTitle
        },
        student: {
          name: enrollment.studentName,
          email: enrollment.studentEmail,
          image: enrollment.studentImage
        }
      })),
      topCourses: topCourses.map(course => ({
        id: course.id,
        title: course.title,
        enrollmentCount: course.enrollmentCount || 0,
        rating: course.rating || 0,
        totalRatings: course.totalRatings || 0,
        revenue: course.revenue || 0
      })),
      monthlyStats,
      reviews: recentReviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        course: {
          id: review.courseId,
          title: review.courseTitle
        },
        student: {
          name: review.studentName,
          image: review.studentImage
        }
      }))
    };

    return NextResponse.json(dashboardData, { status: 200 });

  } catch (error) {
    console.error('GET instructor dashboard error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}