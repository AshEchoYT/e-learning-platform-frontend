import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessons, courses } from '@/db/schema';
import { eq, and, desc, count, max } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { courseId } = params;
    
    if (!courseId || isNaN(parseInt(courseId))) {
      return NextResponse.json({ 
        error: "Valid course ID is required",
        code: "INVALID_COURSE_ID" 
      }, { status: 400 });
    }

    // Get all lessons for the course ordered by orderIndex
    const courseLessons = await db.select()
      .from(lessons)
      .where(eq(lessons.courseId, parseInt(courseId)))
      .orderBy(lessons.orderIndex);

    // Group lessons by sectionTitle
    const groupedLessons = courseLessons.reduce((acc, lesson) => {
      const section = lesson.sectionTitle;
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(lesson);
      return acc;
    }, {} as Record<string, typeof courseLessons>);

    return NextResponse.json(groupedLessons);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { courseId } = params;
    
    if (!courseId || isNaN(parseInt(courseId))) {
      return NextResponse.json({ 
        error: "Valid course ID is required",
        code: "INVALID_COURSE_ID" 
      }, { status: 400 });
    }

    const requestBody = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody || 'instructorId' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { sectionTitle, title, duration, videoUrl, transcript, locked } = requestBody;

    // Validate required fields
    if (!sectionTitle) {
      return NextResponse.json({ 
        error: "Section title is required",
        code: "MISSING_SECTION_TITLE" 
      }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ 
        error: "Lesson title is required",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    // Verify course exists and user is the instructor
    const course = await db.select()
      .from(courses)
      .where(and(eq(courses.id, parseInt(courseId)), eq(courses.instructorId, user.id)))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json({ 
        error: "Course not found or you don't have permission to add lessons",
        code: "COURSE_NOT_FOUND_OR_UNAUTHORIZED" 
      }, { status: 404 });
    }

    // Get the next order index (existing lessons count + 1)
    const lessonCountResult = await db.select({ 
      count: count() 
    })
    .from(lessons)
    .where(eq(lessons.courseId, parseInt(courseId)));

    const nextOrderIndex = (lessonCountResult[0]?.count || 0) + 1;

    // Create new lesson
    const newLesson = await db.insert(lessons)
      .values({
        courseId: parseInt(courseId),
        sectionTitle: sectionTitle.trim(),
        title: title.trim(),
        duration: duration || null,
        videoUrl: videoUrl || null,
        transcript: transcript || null,
        orderIndex: nextOrderIndex,
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