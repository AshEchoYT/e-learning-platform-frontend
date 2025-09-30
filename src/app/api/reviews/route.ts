import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reviews, enrollments, user, courses } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const courseId = searchParams.get('courseId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    // Single review by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const review = await db.select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userId: reviews.userId,
        courseId: reviews.courseId,
        userName: user.name,
        userEmail: user.email,
        courseTitle: courses.title,
        courseImage: courses.image
      })
      .from(reviews)
      .leftJoin(user, eq(reviews.userId, user.id))
      .leftJoin(courses, eq(reviews.courseId, courses.id))
      .where(and(eq(reviews.id, parseInt(id)), eq(reviews.userId, user.id)))
      .limit(1);

      if (review.length === 0) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }

      return NextResponse.json(review[0]);
    }

    // List reviews with filtering
    let query = db.select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      userId: reviews.userId,
      courseId: reviews.courseId,
      userName: user.name,
      userEmail: user.email,
      courseTitle: courses.title,
      courseImage: courses.image
    })
    .from(reviews)
    .leftJoin(user, eq(reviews.userId, user.id))
    .leftJoin(courses, eq(reviews.courseId, courses.id));

    let whereConditions = [eq(reviews.userId, user.id)];

    // Filter by course ID
    if (courseId) {
      if (!courseId || isNaN(parseInt(courseId))) {
        return NextResponse.json({ 
          error: "Valid course ID is required",
          code: "INVALID_COURSE_ID" 
        }, { status: 400 });
      }
      whereConditions.push(eq(reviews.courseId, parseInt(courseId)));
    }

    // Search functionality
    if (search) {
      const searchCondition = or(
        like(reviews.comment, `%${search}%`),
        like(courses.title, `%${search}%`)
      );
      whereConditions.push(searchCondition);
    }

    query = query.where(and(...whereConditions));

    // Sorting
    const orderDirection = order === 'asc' ? asc : desc;
    switch (sort) {
      case 'rating':
        query = query.orderBy(orderDirection(reviews.rating));
        break;
      case 'createdAt':
      default:
        query = query.orderBy(orderDirection(reviews.createdAt));
        break;
    }

    const results = await query.limit(limit).offset(offset);

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
    const { courseId, rating, comment } = requestBody;

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

    if (!rating) {
      return NextResponse.json({ 
        error: "Rating is required",
        code: "MISSING_RATING" 
      }, { status: 400 });
    }

    // Validate courseId is integer
    if (isNaN(parseInt(courseId))) {
      return NextResponse.json({ 
        error: "Valid course ID is required",
        code: "INVALID_COURSE_ID" 
      }, { status: 400 });
    }

    // Validate rating is between 1-5
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: "Rating must be an integer between 1 and 5",
        code: "INVALID_RATING" 
      }, { status: 400 });
    }

    // Check if user is enrolled in the course
    const enrollment = await db.select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, user.id), eq(enrollments.courseId, parseInt(courseId))))
      .limit(1);

    if (enrollment.length === 0) {
      return NextResponse.json({ 
        error: "You must be enrolled in the course to leave a review",
        code: "NOT_ENROLLED" 
      }, { status: 400 });
    }

    // Check if review already exists (prevent duplicates)
    const existingReview = await db.select()
      .from(reviews)
      .where(and(eq(reviews.userId, user.id), eq(reviews.courseId, parseInt(courseId))))
      .limit(1);

    if (existingReview.length > 0) {
      return NextResponse.json({ 
        error: "You have already reviewed this course",
        code: "DUPLICATE_REVIEW" 
      }, { status: 400 });
    }

    // Create the review
    const newReview = await db.insert(reviews)
      .values({
        userId: user.id,
        courseId: parseInt(courseId),
        rating,
        comment: comment?.trim() || null,
        createdAt: new Date().toISOString()
      })
      .returning();

    // Get the created review with joined data
    const createdReview = await db.select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      userId: reviews.userId,
      courseId: reviews.courseId,
      userName: user.name,
      userEmail: user.email,
      courseTitle: courses.title,
      courseImage: courses.image
    })
    .from(reviews)
    .leftJoin(user, eq(reviews.userId, user.id))
    .leftJoin(courses, eq(reviews.courseId, courses.id))
    .where(eq(reviews.id, newReview[0].id))
    .limit(1);

    return NextResponse.json(createdReview[0], { status: 201 });
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
    const { rating, comment } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate rating if provided
    if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return NextResponse.json({ 
        error: "Rating must be an integer between 1 and 5",
        code: "INVALID_RATING" 
      }, { status: 400 });
    }

    // Check if review exists and belongs to user
    const existingReview = await db.select()
      .from(reviews)
      .where(and(eq(reviews.id, parseInt(id)), eq(reviews.userId, user.id)))
      .limit(1);

    if (existingReview.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment?.trim() || null;

    // Update the review
    const updated = await db.update(reviews)
      .set(updateData)
      .where(and(eq(reviews.id, parseInt(id)), eq(reviews.userId, user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Get the updated review with joined data
    const updatedReview = await db.select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      userId: reviews.userId,
      courseId: reviews.courseId,
      userName: user.name,
      userEmail: user.email,
      courseTitle: courses.title,
      courseImage: courses.image
    })
    .from(reviews)
    .leftJoin(user, eq(reviews.userId, user.id))
    .leftJoin(courses, eq(reviews.courseId, courses.id))
    .where(eq(reviews.id, parseInt(id)))
    .limit(1);

    return NextResponse.json(updatedReview[0]);
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

    // Check if review exists and belongs to user before deleting
    const existingReview = await db.select()
      .from(reviews)
      .where(and(eq(reviews.id, parseInt(id)), eq(reviews.userId, user.id)))
      .limit(1);

    if (existingReview.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Delete the review
    const deleted = await db.delete(reviews)
      .where(and(eq(reviews.id, parseInt(id)), eq(reviews.userId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Review deleted successfully',
      review: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}