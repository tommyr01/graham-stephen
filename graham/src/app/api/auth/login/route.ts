import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserByEmail, getUserPasswordHash } from '@/lib/database';
import { verifyPassword, generateToken, generateRefreshToken } from '@/lib/auth';
import { LoginRequest, LoginResponse, APIError } from '@/lib/types';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    
    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json(
        { error: 'Validation Error', message: errors.join(', '), statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Get user
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid Credentials', message: 'Invalid email or password', statusCode: 401 } as APIError,
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account Disabled', message: 'Your account has been disabled', statusCode: 403 } as APIError,
        { status: 403 }
      );
    }

    // Get password hash
    const passwordHash = await getUserPasswordHash(email);
    if (!passwordHash) {
      return NextResponse.json(
        { error: 'Invalid Credentials', message: 'Invalid email or password', statusCode: 401 } as APIError,
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid Credentials', message: 'Invalid email or password', statusCode: 401 } as APIError,
        { status: 401 }
      );
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    const response: LoginResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        lastLoginAt: new Date().toISOString(),
      },
      token,
      refreshToken,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'An error occurred during login', 
        statusCode: 500 
      } as APIError,
      { status: 500 }
    );
  }
}