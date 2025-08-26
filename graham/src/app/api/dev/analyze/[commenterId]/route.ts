import { NextRequest, NextResponse } from 'next/server';
import { fetchCommenterProfile, fetchCommenterRecentPosts, extractUsernameFromProfileUrl } from '@/lib/linkedin';

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

// Development endpoint without authentication for single-user deployment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ commenterId: string }> }
) {
  try {
    const { commenterId } = await params;
    
    // For development, extract profile URL from the commenter ID
    // In production, this would come from the database
    const url = new URL(request.url);
    const profileUrl = url.searchParams.get('profileUrl');
    
    if (!profileUrl) {
      return NextResponse.json(
        { error: 'Profile URL is required for development mode' },
        { status: 400 }
      );
    }

    try {
      // Extract username from profile URL
      const username = extractUsernameFromProfileUrl(profileUrl);
      
      if (!username) {
        throw new Error('Unable to extract username from profile URL');
      }
      
      // Fetch additional profile information and recent posts from LinkedIn
      const [profileData, recentPosts] = await Promise.allSettled([
        fetchCommenterProfile(username),
        fetchCommenterRecentPosts(username, 1),
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

      // Return profile data without scoring
      const response = {
        commenter: enhancedProfile,
        message: 'Profile data retrieved successfully',
      };

      return NextResponse.json(response, { status: 200 });

    } catch (linkedInError) {
      console.error('LinkedIn API error while fetching commenter details:', linkedInError);
      
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
          commenterId: commenterId,
          profileUrl: profileUrl
        },
        { status: statusCode }
      );
    }

  } catch (error) {
    console.error('Get commenter details error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'An error occurred while retrieving commenter details'
      },
      { status: 500 }
    );
  }
}