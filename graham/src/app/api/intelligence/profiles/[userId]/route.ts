/**
 * API endpoint for user intelligence profiles
 * GET, PUT, DELETE /api/intelligence/profiles/[userId]
 */

import { NextRequest, NextResponse } from 'next/server';
import UserIntelligenceProfileService from '@/lib/services/user-intelligence-profile-service';
import { supabase } from '@/lib/supabase';
import type { 
  APIResponse, 
  UserIntelligenceProfile, 
  PreferenceUpdate, 
  LearningInsight,
  UserBehaviorAnalysis 
} from '@/lib/types/intelligence';

interface UpdateProfileRequest {
  preferences?: PreferenceUpdate;
  refresh?: boolean;
}

interface ContactOutcomeRequest {
  sessionId: string;
  contactDetails: {
    method: string;
    outcome: string;
    responseReceived: boolean;
    responseType?: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';
    const include = searchParams.get('include')?.split(',') || [];

    const profileService = new UserIntelligenceProfileService();
    
    // Get user profile
    const profile = await profileService.getProfile(userId, refresh);
    
    const responseData: any = { profile };

    // Include additional data based on query parameters
    if (include.includes('insights')) {
      responseData.insights = await profileService.getLearningInsights(userId);
    }

    if (include.includes('behavior')) {
      const days = parseInt(searchParams.get('days') || '30');
      responseData.behavior_summary = await profileService.getBehaviorSummary(userId, days);
    }

    const response: APIResponse<typeof responseData> = {
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user intelligence profile:', error);
    
    const errorResponse: APIResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body: UpdateProfileRequest = await request.json();
    const { preferences, refresh } = body;

    const profileService = new UserIntelligenceProfileService();
    
    let updatedProfile: UserIntelligenceProfile;

    if (refresh) {
      // Refresh profile from recent behavior
      updatedProfile = await profileService.refreshProfileFromBehavior(userId);
    } else if (preferences) {
      // Update specific preferences
      await profileService.updatePreferences(userId, preferences);
      updatedProfile = await profileService.getProfile(userId);
    } else {
      // Just return current profile
      updatedProfile = await profileService.getProfile(userId);
    }

    const response: APIResponse<UserIntelligenceProfile> = {
      success: true,
      data: updatedProfile,
      message: refresh ? 'Profile refreshed from behavior' : preferences ? 'Preferences updated' : 'Profile retrieved',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating user intelligence profile:', error);
    
    const errorResponse: APIResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Note: In production, you might want to archive instead of delete
    // to preserve learning data while respecting user privacy requests
    
    const { error } = await supabase
      .from('user_intelligence_profiles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error deleting profile: ${error.message}`);
    }

    const response: APIResponse<null> = {
      success: true,
      message: 'User intelligence profile deleted',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting user intelligence profile:', error);
    
    const errorResponse: APIResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}