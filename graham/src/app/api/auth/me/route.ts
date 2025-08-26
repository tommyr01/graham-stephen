import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getUserById } from '@/lib/database';
import { APIError } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(request);
    
    // Get user details
    const user = await getUserById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User Not Found', message: 'User not found', statusCode: 404 } as APIError,
        { status: 404 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account Disabled', message: 'Your account has been disabled', statusCode: 403 } as APIError,
        { status: 403 }
      );
    }

    // Return user data (without sensitive information)
    const userData = {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName || ''}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };

    return NextResponse.json({ user: userData }, { status: 200 });

  } catch (error) {
    console.error('Get user error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('token') || error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: error.message, statusCode: 401 } as APIError,
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'An error occurred while retrieving user information', 
        statusCode: 500 
      } as APIError,
      { status: 500 }
    );
  }
}