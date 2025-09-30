import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userProfiles, user } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Try to get existing profile with user data
    const existingProfile = await db
      .select({
        id: userProfiles.id,
        userId: userProfiles.userId,
        role: userProfiles.role,
        bio: userProfiles.bio,
        website: userProfiles.website,
        totalStudents: userProfiles.totalStudents,
        totalCourses: userProfiles.totalCourses,
        createdAt: userProfiles.createdAt,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
        userCreatedAt: user.createdAt,
        userUpdatedAt: user.updatedAt
      })
      .from(userProfiles)
      .innerJoin(user, eq(userProfiles.userId, user.id))
      .where(eq(userProfiles.userId, currentUser.id))
      .limit(1);

    if (existingProfile.length > 0) {
      return NextResponse.json(existingProfile[0], { status: 200 });
    }

    // Auto-create profile if doesn't exist
    const newProfile = await db.insert(userProfiles)
      .values({
        userId: currentUser.id,
        role: 'student',
        bio: null,
        website: null,
        totalStudents: 0,
        totalCourses: 0,
        createdAt: new Date().toISOString()
      })
      .returning();

    // Get user data and combine with new profile
    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    const combinedData = {
      id: newProfile[0].id,
      userId: newProfile[0].userId,
      role: newProfile[0].role,
      bio: newProfile[0].bio,
      website: newProfile[0].website,
      totalStudents: newProfile[0].totalStudents,
      totalCourses: newProfile[0].totalCourses,
      createdAt: newProfile[0].createdAt,
      userName: userData[0].name,
      userEmail: userData[0].email,
      userImage: userData[0].image,
      userCreatedAt: userData[0].createdAt,
      userUpdatedAt: userData[0].updatedAt
    };

    return NextResponse.json(combinedData, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { role, bio, website } = body;

    // Security check: reject if forbidden fields are provided
    if ('userId' in body || 'user_id' in body || 'totalStudents' in body || 'totalCourses' in body || 'id' in body) {
      return NextResponse.json({ 
        error: "Cannot update protected fields (userId, totalStudents, totalCourses, id)",
        code: "PROTECTED_FIELDS_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate role if provided
    if (role && !['student', 'instructor'].includes(role)) {
      return NextResponse.json({ 
        error: "Role must be either 'student' or 'instructor'",
        code: "INVALID_ROLE" 
      }, { status: 400 });
    }

    // Check if profile exists
    const existingProfile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, currentUser.id))
      .limit(1);

    if (existingProfile.length === 0) {
      return NextResponse.json({ 
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND' 
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (role !== undefined) {
      updateData.role = role;
    }
    if (bio !== undefined) {
      updateData.bio = bio ? bio.trim() : null;
    }
    if (website !== undefined) {
      updateData.website = website ? website.trim() : null;
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update",
        code: "NO_UPDATES" 
      }, { status: 400 });
    }

    const updated = await db.update(userProfiles)
      .set(updateData)
      .where(eq(userProfiles.userId, currentUser.id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update profile',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    // Get combined user + profile data for response
    const combinedData = await db
      .select({
        id: userProfiles.id,
        userId: userProfiles.userId,
        role: userProfiles.role,
        bio: userProfiles.bio,
        website: userProfiles.website,
        totalStudents: userProfiles.totalStudents,
        totalCourses: userProfiles.totalCourses,
        createdAt: userProfiles.createdAt,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
        userCreatedAt: user.createdAt,
        userUpdatedAt: user.updatedAt
      })
      .from(userProfiles)
      .innerJoin(user, eq(userProfiles.userId, user.id))
      .where(eq(userProfiles.userId, currentUser.id))
      .limit(1);

    return NextResponse.json(combinedData[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}