import { NextRequest, NextResponse } from 'next/server';
import { fetchCommenterProfile, fetchCommenterRecentPosts, extractUsernameFromProfileUrl } from '@/lib/linkedin';
import { SessionLearningManager } from '@/lib/services/session-learning-manager';

// Helper function to extract images from LinkedIn post data
function extractPostImages(post: any): string[] {
  const images: string[] = [];
  
  // LinkedIn API structure: post.media.images[].url
  if (post.media?.images && Array.isArray(post.media.images)) {
    post.media.images.forEach((imageObj: any) => {
      if (imageObj.url) {
        images.push(imageObj.url);
      }
    });
  }
  
  // LinkedIn API structure: post.media.url (single image)
  if (post.media?.url && typeof post.media.url === 'string') {
    images.push(post.media.url);
  }
  
  // Try other possible locations for backwards compatibility
  if (post.images && Array.isArray(post.images)) {
    images.push(...post.images);
  }
  
  if (post.content?.images && Array.isArray(post.content.images)) {
    images.push(...post.content.images);
  }
  
  // Check for single image fields
  if (post.image && typeof post.image === 'string') {
    images.push(post.image);
  }
  
  // Check for media attachments (array format)
  if (post.media && Array.isArray(post.media)) {
    post.media.forEach((mediaItem: any) => {
      if (mediaItem.type === 'image' && mediaItem.url) {
        images.push(mediaItem.url);
      }
      if (mediaItem.image_url) {
        images.push(mediaItem.image_url);
      }
    });
  }
  
  // Check for document/article images
  if (post.document?.image) {
    images.push(post.document.image);
  }
  
  if (post.article?.image) {
    images.push(post.article.image);
  }
  
  // Remove duplicates and invalid URLs
  return [...new Set(images)].filter(img => img && typeof img === 'string' && img.startsWith('http'));
}

// Helper function to extract profile picture
function extractProfilePicture(profile: any): string {
  // Try multiple possible locations for profile pictures (LinkedIn API uses profile_picture_url)
  if (profile.profile_picture_url) return profile.profile_picture_url;
  if (profile.profile_picture) return profile.profile_picture;
  if (profile.image) return profile.image;
  if (profile.photo) return profile.photo;
  if (profile.avatar) return profile.avatar;
  if (profile.picture) return profile.picture;
  if (profile.profilePicture) return profile.profilePicture;
  
  return '';
}

// Use singleton session learning manager to maintain state across requests
const sessionLearningManager = SessionLearningManager.getInstance();

// Development endpoint for direct LinkedIn profile research
export async function POST(request: NextRequest) {
  try {
    const { profileUrl, sessionId, userId } = await request.json();
    
    if (!profileUrl) {
      return NextResponse.json(
        { error: 'Profile URL is required' },
        { status: 400 }
      );
    }

    try {
      // Extract username from profile URL
      const username = extractUsernameFromProfileUrl(profileUrl);
      
      if (!username) {
        throw new Error('Unable to extract username from profile URL');
      }
      
      // Generate unique commenter ID for this profile
      const commenterId = `profile-${username}`;
      
      // Fetch additional profile information and recent posts from LinkedIn
      const [profileData, recentPosts] = await Promise.allSettled([
        fetchCommenterProfile(username, true), // Use cache
        fetchCommenterRecentPosts(username, 1, true), // Use cache
      ]);

      // Prepare basic profile information
      let enhancedProfile: any = {
        id: commenterId,
        name: 'LinkedIn User',
        headline: 'Professional',
        profileUrl: profileUrl,
        profilePicture: '',
        location: '',
        connectionDegree: 3,
        company: {
          name: '',
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
          name: profile?.fullname || enhancedProfile.name,
          headline: profile?.headline || enhancedProfile.headline,
          profilePicture: extractProfilePicture(profile),
          location: profile?.location?.full || enhancedProfile.location,
          company: {
            name: profile?.current_company || enhancedProfile.company.name,
            industry: '',
            size: '',
          },
          experience: profileData.value.experience || [],
          education: profileData.value.education || [],
          connectionsCount: profile?.connection_count || 0,
          followersCount: profile?.follower_count || 0,
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
          images: extractPostImages(post),
        }));
      }

      // Prepare base analysis data structure with realistic mock data for testing
      const baseAnalysis = {
        profile: enhancedProfile,
        confidence_score: 0.5, // Base confidence
        relevance_score: 0.5,   // Base relevance
        industry: enhancedProfile.company?.name || 'Technology', // Use realistic mock data
        current_role: enhancedProfile.headline || 'Software Engineer',
        company_size: 'startup', // Realistic mock company size
        years_experience: 5, // Default estimate
        analysis_timestamp: new Date().toISOString()
      };

      // Generate or use provided session ID
      const currentSessionId = sessionId || `profile-session-${Date.now()}`;
      
      // Apply learned patterns if session context is available (Integration #2)
      let enhancedAnalysis = baseAnalysis;
      let learningImpact: any = null;
      let applicationsApplied: any[] = [];

      if (sessionId && userId) {
        try {
          // Initialize session learning if not already done
          await sessionLearningManager.initializeSession(currentSessionId, userId);

          // Apply patterns to improve analysis
          const patternApplicationResult = await sessionLearningManager.applyPatternsToProfile(
            currentSessionId,
            profileUrl,
            baseAnalysis
          );

          enhancedAnalysis = patternApplicationResult.enhancedAnalysis;
          learningImpact = patternApplicationResult.learningImpact;
          applicationsApplied = patternApplicationResult.applicationsApplied;

          console.log(`Applied ${applicationsApplied.length} patterns to profile analysis with ${Math.round((learningImpact?.confidence_improvement || 0) * 100)}% improvement`);

        } catch (learningError) {
          console.error('Learning application error:', learningError);
          // Continue with base analysis if learning fails
        }
      }

      // Return enhanced profile data with learning impact
      const response = {
        sessionId: currentSessionId,
        commenter: enhancedProfile,
        analysis: enhancedAnalysis,
        learning: {
          patterns_applied: applicationsApplied.length,
          confidence_improvement: learningImpact?.confidence_improvement || 0,
          learning_impact: learningImpact,
          applications_applied: applicationsApplied.map(app => ({
            pattern_type: app.pattern_id.includes('_') ? app.pattern_id.split('_')[2] : 'unknown',
            confidence_delta: app.confidence_delta,
            application_reason: app.application_reason
          })),
          learning_enabled: !!(sessionId && userId)
        },
        message: 'Profile research completed successfully',
      };

      return NextResponse.json(response, { status: 200 });

    } catch (linkedInError) {
      console.error('LinkedIn API error while fetching profile details:', linkedInError);
      
      // Provide detailed error information for debugging
      let errorMessage = 'Failed to fetch LinkedIn profile data';
      let statusCode = 500;
      
      if (linkedInError instanceof Error) {
        errorMessage = linkedInError.message;
        
        // Handle specific LinkedIn API errors
        if (errorMessage.includes('rate limit')) {
          statusCode = 429;
        } else if (errorMessage.includes('not found') || errorMessage.includes('private')) {
          statusCode = 404;
        } else if (errorMessage.includes('access denied')) {
          statusCode = 403;
        }
      }
      
      return NextResponse.json(
        { 
          error: 'LinkedIn API Error',
          message: errorMessage,
          profileUrl: profileUrl
        },
        { status: statusCode }
      );
    }

  } catch (error) {
    console.error('Profile research error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'An error occurred while researching the profile'
      },
      { status: 500 }
    );
  }
}