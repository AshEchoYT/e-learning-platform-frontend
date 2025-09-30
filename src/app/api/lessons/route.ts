import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessons, courses } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: "Lesson ID is required",
        code: "MISSING_LESSON_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid lesson ID is required",
        code: "INVALID_LESSON_ID" 
      }, { status: 400 });
    }

    // Get lesson with course information
    const lessonWithCourse = await db
      .select({
        lesson: lessons,
        course: courses
      })
      .from(lessons)
      .innerJoin(courses, eq(lessons.courseId, courses.id))
      .where(eq(lessons.id, parseInt(id)))
      .limit(1);

    if (lessonWithCourse.length === 0) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const { lesson, course } = lessonWithCourse[0];

    // Validate user has access (instructor owns course or user is enrolled)
    if (course.instructorId !== user.id) {
      // Check if user is enrolled in the course
      const { enrollments } = await import('@/db/schema');
      const enrollment = await db
        .select()
        .from(enrollments)
        .where(and(
          eq(enrollments.userId, user.id),
          eq(enrollments.courseId, course.id)
        ))
        .limit(1);

      if (enrollment.length === 0) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    return NextResponse.json(lesson);

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
    const { courseId, sectionTitle, title, duration, videoUrl, transcript, orderIndex, locked } = requestBody;

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

    if (!sectionTitle) {
      return NextResponse.json({ 
        error: "Section title is required",
        code: "MISSING_SECTION_TITLE" 
      }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ 
        error: "Title is required",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (orderIndex === undefined || orderIndex === null) {
      return NextResponse.json({ 
        error: "Order index is required",
        code: "MISSING_ORDER_INDEX" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(courseId))) {
      return NextResponse.json({ 
        error: "Valid course ID is required",
        code: "INVALID_COURSE_ID" 
      }, { status: 400 });
    }

    // Validate course exists and user is the instructor
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, parseInt(courseId)))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json({ 
        error: "Course not found",
        code: "COURSE_NOT_FOUND" 
      }, { status: 404 });
    }

    if (course[0].instructorId !== user.id) {
      return NextResponse.json({ 
        error: "Only course instructors can create lessons",
        code: "INSTRUCTOR_ONLY" 
      }, { status: 403 });
    }

    // Create lesson
    const newLesson = await db.insert(lessons)
      .values({
        courseId: parseInt(courseId),
        sectionTitle: sectionTitle.trim(),
        title: title.trim(),
        duration: duration ? duration.trim() : null,
        videoUrl: videoUrl ? videoUrl.trim() : null,
        transcript: transcript ? transcript.trim() : null,
        orderIndex: parseInt(orderIndex),
        locked: locked || false,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newLesson[0], { status: 201 });

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
        error: "Valid lesson ID is required",
        code: "INVALID_LESSON_ID" 
      }, { status: 400 });
    }

    const requestBody = await request.json();
    const { sectionTitle, title, duration, videoUrl, transcript, orderIndex, locked } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Get lesson with course information to validate ownership
    const lessonWithCourse = await db
      .select({
        lesson: lessons,
        course: courses
      })
      .from(lessons)
      .innerJoin(courses, eq(lessons.courseId, courses.id))
      .where(eq(lessons.id, parseInt(id)))
      .limit(1);

    if (lessonWithCourse.length === 0) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const { course } = lessonWithCourse[0];

    // Validate instructor ownership
    if (course.instructorId !== user.id) {
      return NextResponse.json({ 
        error: "Only course instructors can update lessons",
        code: "INSTRUCTOR_ONLY" 
      }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (sectionTitle !== undefined) updateData.sectionTitle = sectionTitle.trim();
    if (title !== undefined) updateData.title = title.trim();
    if (duration !== undefined) updateData.duration = duration ? duration.trim() : null;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl ? videoUrl.trim() : null;
    if (transcript !== undefined) updateData.transcript = transcript ? transcript.trim() : null;
    if (orderIndex !== undefined) updateData.orderIndex = parseInt(orderIndex);
    if (locked !== undefined) updateData.locked = locked;

    // Update lesson
    const updatedLesson = await db.update(lessons)
      .set(updateData)
      .where(eq(lessons.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedLesson[0]);

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
        error: "Valid lesson ID is required",
        code: "INVALID_LESSON_ID" 
      }, { status: 400 });
    }

    // Get lesson with course information to validate ownership
    const lessonWithCourse = await db
      .select({
        lesson: lessons,
        course: courses
      })
      .from(lessons)
      .innerJoin(courses, eq(lessons.courseId, courses.id))
      .where(eq(lessons.id, parseInt(id)))
      .limit(1);

    if (lessonWithCourse.length === 0) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const { course } = lessonWithCourse[0];

    // Validate instructor ownership
    if (course.instructorId !== user.id) {
      return NextResponse.json({ 
        error: "Only course instructors can delete lessons",
        code: "INSTRUCTOR_ONLY" 
      }, { status: 403 });
    }

    // Delete lesson
    const deletedLesson = await db.delete(lessons)
      .where(eq(lessons.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: "Lesson deleted successfully",
      lesson: deletedLesson[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}