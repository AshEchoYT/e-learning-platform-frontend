import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses, categories, user } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single course by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const course = await db.select({
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
        updatedAt: courses.updatedAt,
        instructorName: user.name,
        categoryName: categories.name
      })
      .from(courses)
      .leftJoin(user, eq(courses.instructorId, user.id))
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .where(eq(courses.id, parseInt(id)))
      .limit(1);

      if (course.length === 0) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      return NextResponse.json(course[0]);
    }

    // List courses with filters
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const published = searchParams.get('published');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    let query = db.select({
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
      updatedAt: courses.updatedAt,
      instructorName: user.name,
      categoryName: categories.name
    })
    .from(courses)
    .leftJoin(user, eq(courses.instructorId, user.id))
    .leftJoin(categories, eq(courses.categoryId, categories.id));

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(courses.title, `%${search}%`),
          like(courses.description, `%${search}%`)
        )
      );
    }

    if (category) {
      conditions.push(eq(courses.categoryId, parseInt(category)));
    }

    if (published !== null) {
      conditions.push(eq(courses.published, published === 'true'));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const orderDirection = order === 'asc' ? asc : desc;
    if (sort === 'title') {
      query = query.orderBy(orderDirection(courses.title));
    } else if (sort === 'price') {
      query = query.orderBy(orderDirection(courses.price));
    } else if (sort === 'rating') {
      query = query.orderBy(orderDirection(courses.rating));
    } else if (sort === 'studentsCount') {
      query = query.orderBy(orderDirection(courses.studentsCount));
    } else {
      query = query.orderBy(orderDirection(courses.createdAt));
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
    const { title, description, categoryId, price, duration, image } = requestBody;

    // Security check: reject if instructorId provided in body
    if ('instructorId' in requestBody || 'instructor_id' in requestBody) {
      return NextResponse.json({ 
        error: "Instructor ID cannot be provided in request body",
        code: "INSTRUCTOR_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!title || !description || !price) {
      return NextResponse.json({ 
        error: "Title, description, and price are required",
        code: "MISSING_REQUIRED_FIELDS" 
      }, { status: 400 });
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json({ 
        error: "Price must be a non-negative number",
        code: "INVALID_PRICE" 
      }, { status: 400 });
    }

    // Validate categoryId if provided
    if (categoryId && (isNaN(parseInt(categoryId)))) {
      return NextResponse.json({ 
        error: "Category ID must be a valid integer",
        code: "INVALID_CATEGORY_ID" 
      }, { status: 400 });
    }

    const newCourse = await db.insert(courses).values({
      title: title.trim(),
      description: description.trim(),
      instructorId: user.id,
      categoryId: categoryId ? parseInt(categoryId) : null,
      price: price,
      duration: duration?.trim() || null,
      image: image?.trim() || null,
      studentsCount: 0,
      rating: 0,
      totalRatings: 0,
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    return NextResponse.json(newCourse[0], { status: 201 });
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
    const { title, description, categoryId, price, duration, image, published } = requestBody;

    // Security check: reject if instructorId provided in body
    if ('instructorId' in requestBody || 'instructor_id' in requestBody) {
      return NextResponse.json({ 
        error: "Instructor ID cannot be provided in request body",
        code: "INSTRUCTOR_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Check if course exists and belongs to user
    const existingCourse = await db.select()
      .from(courses)
      .where(and(eq(courses.id, parseInt(id)), eq(courses.instructorId, user.id)))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 });
    }

    // Validate price if provided
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return NextResponse.json({ 
        error: "Price must be a non-negative number",
        code: "INVALID_PRICE" 
      }, { status: 400 });
    }

    // Validate categoryId if provided
    if (categoryId !== undefined && categoryId !== null && isNaN(parseInt(categoryId))) {
      return NextResponse.json({ 
        error: "Category ID must be a valid integer",
        code: "INVALID_CATEGORY_ID" 
      }, { status: 400 });
    }

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (categoryId !== undefined) updates.categoryId = categoryId ? parseInt(categoryId) : null;
    if (price !== undefined) updates.price = price;
    if (duration !== undefined) updates.duration = duration?.trim() || null;
    if (image !== undefined) updates.image = image?.trim() || null;
    if (published !== undefined) updates.published = Boolean(published);

    const updatedCourse = await db.update(courses)
      .set(updates)
      .where(and(eq(courses.id, parseInt(id)), eq(courses.instructorId, user.id)))
      .returning();

    if (updatedCourse.length === 0) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(updatedCourse[0]);
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

    // Check if course exists and belongs to user
    const existingCourse = await db.select()
      .from(courses)
      .where(and(eq(courses.id, parseInt(id)), eq(courses.instructorId, user.id)))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 });
    }

    const deletedCourse = await db.delete(courses)
      .where(and(eq(courses.id, parseInt(id)), eq(courses.instructorId, user.id)))
      .returning();

    if (deletedCourse.length === 0) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Course deleted successfully',
      course: deletedCourse[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}