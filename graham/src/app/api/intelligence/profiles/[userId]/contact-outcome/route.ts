/**
 * API endpoint for recording contact outcomes
 * POST /api/intelligence/profiles/[userId]/contact-outcome
 */

import { NextRequest, NextResponse } from 'next/server';
import UserIntelligenceProfileService from '@/lib/services/user-intelligence-profile-service';
import { supabase } from '@/lib/supabase';
import type { APIResponse } from '@/lib/types/intelligence';

interface ContactOutcomeRequest {
  sessionId: string;
  contactDetails: {
    method: string;
    outcome: string;
    responseReceived: boolean;
    responseType?: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body: ContactOutcomeRequest = await request.json();
    const { sessionId, contactDetails } = body;

    if (!sessionId || !contactDetails) {
      return NextResponse.json({
        success: false,
        error: 'Session ID and contact details are required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const profileService = new UserIntelligenceProfileService();
    
    // Record the successful contact
    await profileService.recordSuccessfulContact(userId, sessionId, contactDetails);

    const response: APIResponse<null> = {
      success: true,
      message: 'Contact outcome recorded successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error recording contact outcome:', error);
    
    const errorResponse: APIResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}