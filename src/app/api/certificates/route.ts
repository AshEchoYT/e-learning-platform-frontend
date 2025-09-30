import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { certificates, courses, enrollments } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const id = searchParams.get('id');

    if (id) {
      // Get single certificate with course details
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const certificate = await db
        .select({
          id: certificates.id,
          userId: certificates.userId,
          courseId: certificates.courseId,
          issuedDate: certificates.issuedDate,
          certificateUrl: certificates.certificateUrl,
          createdAt: certificates.createdAt,
          course: {
            id: courses.id,
            title: courses.title,
            description: courses.description,
            instructorId: courses.instructorId,
            duration: courses.duration,
            image: courses.image
          }
        })
        .from(certificates)
        .innerJoin(courses, eq(certificates.courseId, courses.id))
        .where(and(eq(certificates.id, parseInt(id)), eq(certificates.userId, user.id)))
        .limit(1);

      if (certificate.length === 0) {
        return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
      }

      return NextResponse.json(certificate[0]);
    } else {
      // Get all user's certificates with course details
      const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
      const offset = parseInt(searchParams.get('offset') || '0');

      const userCertificates = await db
        .select({
          id: certificates.id,
          userId: certificates.userId,
          courseId: certificates.courseId,
          issuedDate: certificates.issuedDate,
          certificateUrl: certificates.certificateUrl,
          createdAt: certificates.createdAt,
          course: {
            id: courses.id,
            title: courses.title,
            description: courses.description,
            instructorId: courses.instructorId,
            duration: courses.duration,
            image: courses.image
          }
        })
        .from(certificates)
        .innerJoin(courses, eq(certificates.courseId, courses.id))
        .where(eq(certificates.userId, user.id))
        .orderBy(desc(certificates.createdAt))
        .limit(limit)
        .offset(offset);

      return NextResponse.json(userCertificates);
    }
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
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

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
    if (!courseId || isNaN(parseInt(courseId))) {
      return NextResponse.json({ 
        error: "Valid course ID is required",
        code: "MISSING_COURSE_ID" 
      }, { status: 400 });
    }

    // Check if course exists
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

    // Check if user is enrolled in the course
    const enrollment = await db
      .select()
      .from(enrollments)
      .where(and(
        eq(enrollments.userId, user.id),
        eq(enrollments.courseId, parseInt(courseId))
      ))
      .limit(1);

    if (enrollment.length === 0) {
      return NextResponse.json({ 
        error: "User not enrolled in this course",
        code: "NOT_ENROLLED" 
      }, { status: 400 });
    }

    // Validate 100% progress completion
    if (enrollment[0].progress !== 100) {
      return NextResponse.json({ 
        error: "Course must be 100% complete to issue certificate",
        code: "INCOMPLETE_COURSE" 
      }, { status: 400 });
    }

    // Check if certificate already exists
    const existingCertificate = await db
      .select()
      .from(certificates)
      .where(and(
        eq(certificates.userId, user.id),
        eq(certificates.courseId, parseInt(courseId))
      ))
      .limit(1);

    if (existingCertificate.length > 0) {
      return NextResponse.json({ 
        error: "Certificate already exists for this course",
        code: "CERTIFICATE_EXISTS" 
      }, { status: 400 });
    }

    const currentDate = new Date().toISOString();

    // Create certificate
    const newCertificate = await db.insert(certificates)
      .values({
        userId: user.id,
        courseId: parseInt(courseId),
        issuedDate: currentDate,
        certificateUrl: `https://certificates.example.com/${user.id}/${courseId}/${Date.now()}.pdf`,
        createdAt: currentDate
      })
      .returning();

    return NextResponse.json(newCertificate[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if certificate exists and belongs to user
    const existingCertificate = await db
      .select()
      .from(certificates)
      .where(and(eq(certificates.id, parseInt(id)), eq(certificates.userId, user.id)))
      .limit(1);

    if (existingCertificate.length === 0) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Delete certificate
    const deleted = await db.delete(certificates)
      .where(and(eq(certificates.id, parseInt(id)), eq(certificates.userId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Certificate revoked successfully',
      certificate: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}