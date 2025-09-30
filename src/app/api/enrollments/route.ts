import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { enrollments, courses, user } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const results = await db.select({
      id: enrollments.id,
      userId: enrollments.userId,
      courseId: enrollments.courseId,
      progress: enrollments.progress,
      lastAccessed: enrollments.lastAccessed,
      completedAt: enrollments.completedAt,
      enrolledAt: enrollments.enrolledAt,
      course: {
        id: courses.id,
        title: courses.title,
        description: courses.description,
        instructorId: courses.instructorId,
        categoryId: courses.categoryId,
        price: courses.price,
        duration: courses.duration,
        image: courses.image,
        studentsCount: courses.studentsCount,
        rating: courses.rating,
        totalRatings: courses.totalRatings,
        published: courses.published,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt
      }
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.userId, user.id))
    .orderBy(desc(enrollments.enrolledAt))
    .limit(limit)
    .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const requestBody = await request.json();
    const { courseId } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!courseId) {
      return NextResponse.json({ 
        error: "Course ID is required",
        code: "MISSING_COURSE_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(courseId))) {
      return NextResponse.json({ 
        error: "Valid course ID is required",
        code: "INVALID_COURSE_ID" 
      }, { status: 400 });
    }

    // Check if course exists
    const course = await db.select()
      .from(courses)
      .where(eq(courses.id, parseInt(courseId)))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json({ 
        error: "Course not found",
        code: "COURSE_NOT_FOUND" 
      }, { status: 404 });
    }

    // Check if already enrolled
    const existingEnrollment = await db.select()
      .from(enrollments)
      .where(and(
        eq(enrollments.userId, user.id),
        eq(enrollments.courseId, parseInt(courseId))
      ))
      .limit(1);

    if (existingEnrollment.length > 0) {
      return NextResponse.json({ 
        error: "Already enrolled in this course",
        code: "ALREADY_ENROLLED" 
      }, { status: 400 });
    }

    // Create enrollment
    const newEnrollment = await db.insert(enrollments)
      .values({
        userId: user.id,
        courseId: parseInt(courseId),
        progress: 0,
        enrolledAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newEnrollment[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const requestBody = await request.json();
    const { progress, lastAccessed } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate progress if provided
    if (progress !== undefined) {
      if (isNaN(parseInt(progress)) || parseInt(progress) < 0 || parseInt(progress) > 100) {
        return NextResponse.json({ 
          error: "Progress must be between 0 and 100",
          code: "INVALID_PROGRESS" 
        }, { status: 400 });
      }
    }

    // Check if enrollment exists and belongs to user
    const existingEnrollment = await db.select()
      .from(enrollments)
      .where(and(
        eq(enrollments.id, parseInt(id)),
        eq(enrollments.userId, user.id)
      ))
      .limit(1);

    if (existingEnrollment.length === 0) {
      return NextResponse.json({ 
        error: 'Enrollment not found' 
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      lastAccessed: lastAccessed || new Date().toISOString()
    };

    if (progress !== undefined) {
      updateData.progress = parseInt(progress);
      
      // Set completedAt if progress reaches 100
      if (parseInt(progress) === 100) {
        updateData.completedAt = new Date().toISOString();
      } else if (parseInt(progress) < 100) {
        // Clear completedAt if progress goes below 100
        updateData.completedAt = null;
      }
    }

    const updated = await db.update(enrollments)
      .set(updateData)
      .where(and(
        eq(enrollments.id, parseInt(id)),
        eq(enrollments.userId, user.id)
      ))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Enrollment not found' 
      }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if enrollment exists and belongs to user
    const existingEnrollment = await db.select()
      .from(enrollments)
      .where(and(
        eq(enrollments.id, parseInt(id)),
        eq(enrollments.userId, user.id)
      ))
      .limit(1);

    if (existingEnrollment.length === 0) {
      return NextResponse.json({ 
        error: 'Enrollment not found' 
      }, { status: 404 });
    }

    const deleted = await db.delete(enrollments)
      .where(and(
        eq(enrollments.id, parseInt(id)),
        eq(enrollments.userId, user.id)
      ))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Enrollment not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Successfully unenrolled from course',
      enrollment: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}