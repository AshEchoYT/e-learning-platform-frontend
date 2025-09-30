import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessonProgress, lessons } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const lessonId = parseInt(params.lessonId);
    if (!lessonId || isNaN(lessonId)) {
      return NextResponse.json({ 
        error: "Valid lesson ID is required",
        code: "INVALID_LESSON_ID" 
      }, { status: 400 });
    }

    // Verify lesson exists
    const lesson = await db.select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (lesson.length === 0) {
      return NextResponse.json({ 
        error: 'Lesson not found',
        code: 'LESSON_NOT_FOUND' 
      }, { status: 404 });
    }

    // Get user's progress for this lesson
    const progress = await db.select()
      .from(lessonProgress)
      .where(and(
        eq(lessonProgress.userId, user.id),
        eq(lessonProgress.lessonId, lessonId)
      ))
      .limit(1);

    if (progress.length === 0) {
      // Return default progress if no record exists
      return NextResponse.json({
        userId: user.id,
        lessonId: lessonId,
        completed: false,
        lastPosition: 0,
        completedAt: null
      });
    }

    return NextResponse.json(progress[0]);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const lessonId = parseInt(params.lessonId);
    if (!lessonId || isNaN(lessonId)) {
      return NextResponse.json({ 
        error: "Valid lesson ID is required",
        code: "INVALID_LESSON_ID" 
      }, { status: 400 });
    }

    const requestBody = await request.json();
    
    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { completed, lastPosition } = requestBody;

    // Verify lesson exists
    const lesson = await db.select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (lesson.length === 0) {
      return NextResponse.json({ 
        error: 'Lesson not found',
        code: 'LESSON_NOT_FOUND' 
      }, { status: 404 });
    }

    // Validate lastPosition if provided
    if (lastPosition !== undefined && (typeof lastPosition !== 'number' || lastPosition < 0)) {
      return NextResponse.json({ 
        error: "Last position must be a non-negative integer",
        code: "INVALID_LAST_POSITION" 
      }, { status: 400 });
    }

    // Check if progress record already exists
    const existingProgress = await db.select()
      .from(lessonProgress)
      .where(and(
        eq(lessonProgress.userId, user.id),
        eq(lessonProgress.lessonId, lessonId)
      ))
      .limit(1);

    const now = new Date().toISOString();
    let result;

    if (existingProgress.length === 0) {
      // Create new progress record
      const insertData: any = {
        userId: user.id,
        lessonId: lessonId,
        completed: completed ?? false,
        lastPosition: lastPosition ?? 0
      };

      // Auto-generate completedAt when completed = true
      if (completed === true) {
        insertData.completedAt = now;
      }

      result = await db.insert(lessonProgress)
        .values(insertData)
        .returning();
    } else {
      // Update existing progress record
      const updateData: any = {};
      
      if (completed !== undefined) {
        updateData.completed = completed;
        // Auto-generate completedAt when completed = true, clear when false
        updateData.completedAt = completed ? now : null;
      }
      
      if (lastPosition !== undefined) {
        updateData.lastPosition = lastPosition;
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ 
          error: "No valid fields provided for update",
          code: "NO_UPDATE_FIELDS" 
        }, { status: 400 });
      }

      result = await db.update(lessonProgress)
        .set(updateData)
        .where(and(
          eq(lessonProgress.userId, user.id),
          eq(lessonProgress.lessonId, lessonId)
        ))
        .returning();
    }

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}