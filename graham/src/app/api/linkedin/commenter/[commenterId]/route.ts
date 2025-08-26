import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { supabase, TABLES } from '@/lib/supabase';
import { fetchCommenterProfile, fetchCommenterRecentPosts, extractUsernameFromProfileUrl } from '@/lib/linkedin';
import { CommenterDetailsResponse, APIError } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ commenterId: string }> }
) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(request);
    const { commenterId } = await params;

    // Get commenter from database
    const { data: commenter, error } = await supabase
      .from(TABLES.COMMENTERS)
      .select('*, research_sessions!inner(user_id)')
      .eq('id', commenterId)
      .single();

    if (error || !commenter) {
      return NextResponse.json(
        { error: 'Commenter Not Found', message: 'Commenter not found', statusCode: 404 } as APIError,
        { status: 404 }
      );
    }

    // Verify that the commenter belongs to a session owned by the authenticated user
    if (commenter.research_sessions.user_id !== payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Access denied', statusCode: 403 } as APIError,
        { status: 403 }
      );
    }

    try {
      // Extract username from profile URL
      const username = extractUsernameFromProfileUrl(commenter.profile_url);
      
      if (!username) {
        throw new Error('Unable to extract username from profile URL');
      }
      
      // Fetch additional profile information and recent posts from LinkedIn
      const [profileData, recentPosts] = await Promise.allSettled([
        fetchCommenterProfile(username),
        fetchCommenterRecentPosts(username, 1),
      ]);

      // Prepare profile information
      let enhancedProfile: any = {
        id: commenter.id,
        name: commenter.name,
        headline: commenter.headline,
        profileUrl: commenter.profile_url,
        profilePicture: commenter.profile_data?.profilePicture || '',
        location: commenter.location || '',
        connectionDegree: 3, // Default value, could be enhanced with actual data
        company: {
          name: commenter.company || '',
          industry: '',
          size: '',
        },
        recentPosts: [],
        lastUpdated: new Date().toISOString(),
      };

      // Enhance with fetched profile data if available
      if (profileData.status === 'fulfilled' && profileData.value) {
        const profile = profileData.value.basic_info;
        enhancedProfile = {
          ...enhancedProfile,
          location: profile?.location?.full || enhancedProfile.location,
          company: {
            name: profile?.current_company || enhancedProfile.company.name,
            industry: '',
            size: '',
          },
          // Add more profile fields as available from the API
          experience: profileData.value.experience || [],
          education: profileData.value.education || [],
          connectionsCount: profile?.connection_count || commenter.connections_count,
          followersCount: profile?.follower_count || commenter.followers_count,
          about: profile?.about || '',
          isCreator: profile?.is_creator || false,
          isInfluencer: profile?.is_influencer || false,
          isPremium: profile?.is_premium || false,
        };
      }

      // Enhance with recent posts if available
      if (recentPosts.status === 'fulfilled' && recentPosts.value) {
        enhancedProfile.recentPosts = recentPosts.value.map((post: any) => ({
          id: post.urn || post.id,
          content: post.text || '',
          publishedAt: post.posted_at?.date || '',
          engagement: {
            likes: post.stats?.like || 0,
            comments: post.stats?.comments || 0,
            reposts: post.stats?.reposts || 0,
          },
          hashtags: [],
          mentions: [],
          postType: post.post_type || 'regular',
          url: post.url || '',
        }));
      }

      // Update commenter record with enhanced data if we got new information
      if (profileData.status === 'fulfilled' || recentPosts.status === 'fulfilled') {
        const updateData: any = {
          profile_data: {
            ...commenter.profile_data,
            enhancedProfile: true,
            lastProfileUpdate: new Date().toISOString(),
          },
        };

        if (profileData.status === 'fulfilled' && profileData.value) {
          updateData.location = profileData.value.location || commenter.location;
          updateData.company = profileData.value.current_company?.name || commenter.company;
          updateData.followers_count = profileData.value.followers_count || commenter.followers_count;
          updateData.connections_count = profileData.value.connections_count || commenter.connections_count;
        }

        await supabase
          .from(TABLES.COMMENTERS)
          .update(updateData)
          .eq('id', commenterId);
      }

      const response: CommenterDetailsResponse = {
        commenter: enhancedProfile,
      };

      return NextResponse.json(response, { status: 200 });

    } catch (linkedInError) {
      console.error('LinkedIn API error while fetching commenter details:', linkedInError);
      
      // Return basic commenter information even if LinkedIn API fails
      const basicProfile = {
        id: commenter.id,
        name: commenter.name,
        headline: commenter.headline,
        profileUrl: commenter.profile_url,
        profilePicture: commenter.profile_data?.profilePicture || '',
        location: commenter.location || '',
        connectionDegree: 3,
        company: {
          name: commenter.company || '',
          industry: '',
          size: '',
        },
        recentPosts: [],
        lastUpdated: commenter.updated_at,
        // Add a flag to indicate limited data
        limitedData: true,
        limitedDataReason: linkedInError instanceof Error ? linkedInError.message : 'LinkedIn API unavailable',
      };

      const response: CommenterDetailsResponse = {
        commenter: basicProfile,
      };

      return NextResponse.json(response, { status: 200 });
    }

  } catch (error) {
    console.error('Get commenter details error:', error);
    
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
        message: 'An error occurred while retrieving commenter details', 
        statusCode: 500 
      } as APIError,
      { status: 500 }
    );
  }
}