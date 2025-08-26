import axios from 'axios';
import { LinkedInAPIResponse, LinkedInComment, CommentData } from './types';
import { getCachedData, setCachedData } from './database';

// Function to get RapidAPI credentials at runtime
const getRapidAPIConfig = () => {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY environment variable is required');
  }
  return {
    key: RAPIDAPI_KEY,
    host: process.env.RAPIDAPI_HOST || 'linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com'
  };
};

// Check if we're in build time - during build, Next.js may not have all env vars
const isBuildTime = !process.env.RAPIDAPI_KEY || process.env.NODE_ENV === undefined;

// LinkedIn Post URL validation
export function validateLinkedInPostUrl(url: string): { isValid: boolean; postId?: string } {
  // More flexible regex patterns to handle various LinkedIn post URL formats
  const patterns = [
    // Standard posts format: https://linkedin.com/posts/username_post-id
    /https?:\/\/(www\.)?linkedin\.com\/posts\/([^\/\?]+)_([^\/\?]+)/,
    // Alternative format: https://linkedin.com/posts/username/post-id
    /https?:\/\/(www\.)?linkedin\.com\/posts\/([^\/\?]+)\/([^\/\?]+)/,
    // Feed posts: https://linkedin.com/feed/update/urn:li:activity:123456789
    /https?:\/\/(www\.)?linkedin\.com\/feed\/update\/(urn:li:activity:)?([^\/\?]+)/,
    // Company posts: https://linkedin.com/company/companyname/posts/
    /https?:\/\/(www\.)?linkedin\.com\/(company|school)\/([^\/]+)\/posts/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      // Extract post ID from different patterns
      let postId;
      if (pattern.source.includes('_')) {
        // username_post-id format
        postId = match[3];
      } else if (pattern.source.includes('activity')) {
        // urn:li:activity format
        postId = match[3];
      } else {
        // username/post-id format
        postId = match[3] || match[2];
      }
      return { isValid: true, postId };
    }
  }
  
  return { isValid: false };
}

// Extract LinkedIn post ID from URL
export function extractPostIdFromUrl(url: string): string | null {
  const validation = validateLinkedInPostUrl(url);
  return validation.isValid ? validation.postId || null : null;
}

// Transform LinkedIn API response to our format
export function transformLinkedInComment(comment: LinkedInComment): CommentData {
  return {
    id: comment.comment_id,
    text: comment.text,
    postedAt: {
      timestamp: comment.posted_at.timestamp,
      date: comment.posted_at.date,
      relative: comment.posted_at.relative,
    },
    isEdited: comment.is_edited,
    isPinned: comment.is_pinned,
    commentUrl: comment.comment_url,
    author: {
      name: comment.author.name,
      headline: comment.author.headline,
      profileUrl: comment.author.profile_url,
      profilePicture: comment.author.profile_picture,
    },
    stats: {
      totalReactions: comment.stats.total_reactions,
      reactions: {
        like: comment.stats.reactions.like,
        appreciation: comment.stats.reactions.appreciation,
        empathy: comment.stats.reactions.empathy,
        interest: comment.stats.reactions.interest,
        praise: comment.stats.reactions.praise,
      },
      commentsCount: comment.stats.comments,
    },
    replies: comment.replies?.map(transformLinkedInComment),
  };
}

// Fetch comments from LinkedIn post using RapidAPI
export async function fetchLinkedInComments(
  postUrl: string,
  pageNumber: number = 1,
  sortOrder: string = 'Most relevant',
  useCache: boolean = true
): Promise<{ post: { id: string; url: string }; comments: CommentData[]; totalComments: number }> {
  const validation = validateLinkedInPostUrl(postUrl);
  if (!validation.isValid) {
    throw new Error('Invalid LinkedIn post URL format');
  }

  // Create a shorter cache key using a hash of the URL
  const crypto = require('crypto');
  const urlHash = crypto.createHash('md5').update(postUrl).digest('hex').substring(0, 16);
  const cacheKey = `linkedin_comments_${urlHash}_${pageNumber}_${sortOrder.replace(/\s+/g, '_')}`;

  // Check cache first if enabled
  if (useCache) {
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      console.log('Returning cached LinkedIn comments data');
      return cachedData;
    }
  }

  try {
    const config = getRapidAPIConfig();
    const response = await axios.get(
      `https://${config.host}/post/comments`,
      {
        headers: {
          'X-RapidAPI-Key': config.key,
          'X-RapidAPI-Host': config.host,
        },
        params: {
          post_url: postUrl,
          page_number: pageNumber,
          sort_order: sortOrder,
        },
        timeout: 60000, // 60 second timeout
      }
    );

    if (!response.data.success) {
      throw new Error(`LinkedIn API error: ${response.data.message}`);
    }

    // Transform the response data to match our CommentData interface
    const transformedComments = response.data.data.comments.map(transformLinkedInComment);
    
    const result = {
      post: {
        id: response.data.data.post.id,
        url: response.data.data.post.url,
      },
      comments: transformedComments,
      totalComments: transformedComments.length,
    };

    // Cache the result for 6 hours if caching is enabled
    if (useCache) {
      await setCachedData(cacheKey, result, 360); // 6 hours
    }

    return result;

  } catch (error) {
    console.error('LinkedIn API error:', error);
    
    if (axios.isAxiosError(error)) {
      console.error('LinkedIn API response data:', error.response?.data);
      console.error('LinkedIn API response status:', error.response?.status);
      console.error('LinkedIn API response headers:', error.response?.headers);
      
      if (error.response?.status === 429) {
        throw new Error('LinkedIn API rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 403) {
        throw new Error('LinkedIn API access denied. Please check your API credentials.');
      } else if (error.response?.status === 404) {
        throw new Error('LinkedIn post not found or is private.');
      } else if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message || 'Invalid request to LinkedIn API';
        throw new Error(`LinkedIn API error: ${errorMsg}`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('LinkedIn API request timed out. Please try again.');
      }
    }

    throw new Error('Failed to fetch LinkedIn comments. Please try again later.');
  }
}

// Fetch commenter profile details (expanded profile information)
export async function fetchCommenterProfile(
  username: string,
  useCache: boolean = true
): Promise<any> {
  // Create a shorter cache key to prevent database varchar(255) errors
  const cacheKey = `linkedin_profile_${username.substring(0, 50)}`;

  // Check cache first if enabled
  if (useCache) {
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      console.log('Returning cached LinkedIn profile data');
      return cachedData;
    }
  }

  try {
    const config = getRapidAPIConfig();
    const response = await axios.get(
      `https://${config.host}/profile/detail`,
      {
        headers: {
          'X-RapidAPI-Key': config.key,
          'X-RapidAPI-Host': config.host,
        },
        params: {
          username: username,
        },
        timeout: 60000, // 60 second timeout
      }
    );

    if (!response.data.success) {
      throw new Error(`LinkedIn API error: ${response.data.message}`);
    }

    const result = response.data.data;

    // Cache the result for 24 hours if caching is enabled
    if (useCache) {
      await setCachedData(cacheKey, result, 1440); // 24 hours
    }

    return result;

  } catch (error) {
    console.error('LinkedIn profile API error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('LinkedIn API rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 403) {
        throw new Error('LinkedIn API access denied or profile is private.');
      } else if (error.response?.status === 404) {
        throw new Error('LinkedIn profile not found or is private.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('LinkedIn API request timed out. Please try again.');
      }
    }

    throw new Error('Failed to fetch LinkedIn profile. Please try again later.');
  }
}

// Fetch recent posts from a LinkedIn profile
export async function fetchCommenterRecentPosts(
  username: string,
  pageNumber: number = 1,
  useCache: boolean = true
): Promise<any[]> {
  // Create a shorter cache key to prevent database varchar(255) errors
  const cacheKey = `linkedin_posts_${username.substring(0, 50)}_${pageNumber}`;

  // Check cache first if enabled
  if (useCache) {
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      console.log('Returning cached LinkedIn posts data');
      return cachedData;
    }
  }

  try {
    const config = getRapidAPIConfig();
    const response = await axios.get(
      `https://${config.host}/profile/posts`,
      {
        headers: {
          'X-RapidAPI-Key': config.key,
          'X-RapidAPI-Host': config.host,
        },
        params: {
          username: username,
          page_number: pageNumber,
        },
        timeout: 60000, // 60 second timeout
      }
    );

    if (!response.data.success) {
      throw new Error(`LinkedIn API error: ${response.data.message}`);
    }

    const result = response.data.data.posts || [];

    // Cache the result for 6 hours if caching is enabled
    if (useCache) {
      await setCachedData(cacheKey, result, 360); // 6 hours
    }

    return result;

  } catch (error) {
    console.error('LinkedIn posts API error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('LinkedIn API rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 403) {
        throw new Error('LinkedIn API access denied or profile is private.');
      } else if (error.response?.status === 404) {
        throw new Error('LinkedIn profile not found or has no posts.');
      } else if (error.code === 'ECONNABORTED') {
        console.warn(`LinkedIn posts API timeout for user: ${username}. Returning empty posts array.`);
        // Return empty array instead of throwing error to allow profile analysis to continue
        return [];
      }
    }

    console.warn(`LinkedIn posts API failed for user: ${username}. Returning empty posts array.`);
    // Return empty array instead of throwing error to allow profile analysis to continue
    return [];
  }
}

// Extract username from LinkedIn profile URL
export function extractUsernameFromProfileUrl(profileUrl: string): string | null {
  try {
    // Handle various LinkedIn profile URL formats
    const patterns = [
      /linkedin\.com\/in\/([^\/\?]+)/,
      /linkedin\.com\/profile\/view\?id=([^&]+)/,
    ];

    for (const pattern of patterns) {
      const match = profileUrl.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting username from profile URL:', error);
    return null;
  }
}

// Clean up profile URL to standardize format
export function cleanProfileUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Remove query parameters and fragments
    urlObj.search = '';
    urlObj.hash = '';
    
    // Ensure it ends with a slash for consistency
    let cleanUrl = urlObj.toString();
    if (!cleanUrl.endsWith('/')) {
      cleanUrl += '/';
    }
    
    return cleanUrl;
  } catch (error) {
    // If URL parsing fails, return the original URL
    return url;
  }
}