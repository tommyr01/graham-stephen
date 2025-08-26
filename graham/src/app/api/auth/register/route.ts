import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser, getUserByEmail } from '@/lib/database';
import { hashPassword, generateToken, validateEmail, validatePassword } from '@/lib/auth';
import { RegisterRequest, RegisterResponse, APIError } from '@/lib/types';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
});

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    
    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json(
        { error: 'Validation Error', message: errors.join(', '), statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;

    // Additional email validation
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid Email', message: 'Please provide a valid email address', statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    // Additional password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Password Validation Failed', 
          message: passwordValidation.errors.join(', '), 
          statusCode: 400 
        } as APIError,
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User Exists', message: 'A user with this email already exists', statusCode: 409 } as APIError,
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || undefined;

    // Create user
    const user = await createUser({
      email,
      passwordHash,
      firstName,
      lastName,
    });

    // Generate JWT token
    const token = generateToken(user);

    const response: RegisterResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        createdAt: user.createdAt,
      },
      token,
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'An error occurred during registration', 
        statusCode: 500 
      } as APIError,
      { status: 500 }
    );
  }
}