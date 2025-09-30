import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessonNotes } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
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

    const notes = await db.select()
      .from(lessonNotes)
      .where(and(
        eq(lessonNotes.userId, user.id),
        eq(lessonNotes.lessonId, lessonId)
      ))
      .orderBy(desc(lessonNotes.createdAt));

    return NextResponse.json(notes, { status: 200 });

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

    const { content } = requestBody;

    // Validate required fields
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ 
        error: "Content is required and cannot be empty",
        code: "MISSING_CONTENT" 
      }, { status: 400 });
    }

    const insertData = {
      userId: user.id,
      lessonId: lessonId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newNote = await db.insert(lessonNotes)
      .values(insertData)
      .returning();

    return NextResponse.json(newNote[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('id');

    if (!noteId || isNaN(parseInt(noteId))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
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

    const { content } = requestBody;

    // Validate content if provided
    if (content !== undefined && (typeof content !== 'string' || content.trim().length === 0)) {
      return NextResponse.json({ 
        error: "Content cannot be empty",
        code: "INVALID_CONTENT" 
      }, { status: 400 });
    }

    // Check if note exists and belongs to user
    const existingNote = await db.select()
      .from(lessonNotes)
      .where(and(
        eq(lessonNotes.id, parseInt(noteId)),
        eq(lessonNotes.userId, user.id)
      ))
      .limit(1);

    if (existingNote.length === 0) {
      return NextResponse.json({ 
        error: 'Note not found' 
      }, { status: 404 });
    }

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (content !== undefined) {
      updates.content = content.trim();
    }

    const updated = await db.update(lessonNotes)
      .set(updates)
      .where(and(
        eq(lessonNotes.id, parseInt(noteId)),
        eq(lessonNotes.userId, user.id)
      ))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Note not found' 
      }, { status: 404 });
    }

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('id');

    if (!noteId || isNaN(parseInt(noteId))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if note exists and belongs to user
    const existingNote = await db.select()
      .from(lessonNotes)
      .where(and(
        eq(lessonNotes.id, parseInt(noteId)),
        eq(lessonNotes.userId, user.id)
      ))
      .limit(1);

    if (existingNote.length === 0) {
      return NextResponse.json({ 
        error: 'Note not found' 
      }, { status: 404 });
    }

    const deleted = await db.delete(lessonNotes)
      .where(and(
        eq(lessonNotes.id, parseInt(noteId)),
        eq(lessonNotes.userId, user.id)
      ))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Note not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Note deleted successfully',
      deletedNote: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}