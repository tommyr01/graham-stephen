import { supabase, TABLES } from './supabase';
import { 
  User, 
  ResearchSession, 
  Commenter, 
  UserFeedback, 
  APIRateLimit, 
  LinkedInCache 
} from './types';

// User operations
export async function createUser(userData: {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
}): Promise<User> {
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .insert({
      email: userData.email,
      password_hash: userData.passwordHash,
      first_name: userData.firstName,
      last_name: userData.lastName,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    isActive: data.is_active,
    emailVerified: data.email_verified,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    throw new Error(`Failed to get user: ${error.message}`);
  }

  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    isActive: data.is_active,
    emailVerified: data.email_verified,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    throw new Error(`Failed to get user: ${error.message}`);
  }

  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    isActive: data.is_active,
    emailVerified: data.email_verified,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getUserPasswordHash(email: string): Promise<string | null> {
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .select('password_hash')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    throw new Error(`Failed to get user password: ${error.message}`);
  }

  return data.password_hash;
}

// Research Session operations
export async function createResearchSession(sessionData: {
  userId: string;
  postUrl: string;
  sessionName?: string;
  boostTerms?: string[];
}): Promise<ResearchSession> {
  const { data, error } = await supabase
    .from(TABLES.RESEARCH_SESSIONS)
    .insert({
      user_id: sessionData.userId,
      post_url: sessionData.postUrl,
      session_name: sessionData.sessionName,
      boost_terms: sessionData.boostTerms || [],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create research session: ${error.message}`);
  }

  return {
    id: data.id,
    userId: data.user_id,
    postUrl: data.post_url,
    sessionName: data.session_name,
    status: data.status,
    totalComments: data.total_comments,
    analyzedCommenters: data.analyzed_commenters,
    boostTerms: data.boost_terms,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getResearchSession(sessionId: string): Promise<ResearchSession | null> {
  const { data, error } = await supabase
    .from(TABLES.RESEARCH_SESSIONS)
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    throw new Error(`Failed to get research session: ${error.message}`);
  }

  return {
    id: data.id,
    userId: data.user_id,
    postUrl: data.post_url,
    sessionName: data.session_name,
    status: data.status,
    totalComments: data.total_comments,
    analyzedCommenters: data.analyzed_commenters,
    boostTerms: data.boost_terms,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateResearchSession(
  sessionId: string, 
  updates: Partial<{
    status: string;
    totalComments: number;
    analyzedCommenters: number;
    boostTerms: string[];
  }>
): Promise<ResearchSession> {
  const updateData: any = {};
  
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.totalComments !== undefined) updateData.total_comments = updates.totalComments;
  if (updates.analyzedCommenters !== undefined) updateData.analyzed_commenters = updates.analyzedCommenters;
  if (updates.boostTerms !== undefined) updateData.boost_terms = updates.boostTerms;

  const { data, error } = await supabase
    .from(TABLES.RESEARCH_SESSIONS)
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update research session: ${error.message}`);
  }

  return {
    id: data.id,
    userId: data.user_id,
    postUrl: data.post_url,
    sessionName: data.session_name,
    status: data.status,
    totalComments: data.total_comments,
    analyzedCommenters: data.analyzed_commenters,
    boostTerms: data.boost_terms,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// Commenter operations
export async function createCommenter(commenterData: {
  sessionId: string;
  linkedinId: string;
  commentId: string;
  name?: string;
  headline?: string;
  profileUrl?: string;
  profilePicture?: string;
  company?: string;
  location?: string;
  followersCount?: number;
  connectionsCount?: number;
  commentText?: string;
  commentDate?: string;
  commentTimestamp?: number;
  isEdited?: boolean;
  isPinned?: boolean;
  commentUrl?: string;
  relevanceScore?: number;
  profileData?: any;
  statsData?: any;
}): Promise<Commenter> {
  const { data, error } = await supabase
    .from(TABLES.COMMENTERS)
    .insert({
      session_id: commenterData.sessionId,
      linkedin_id: commenterData.linkedinId,
      comment_id: commenterData.commentId,
      name: commenterData.name,
      headline: commenterData.headline,
      profile_url: commenterData.profileUrl,
      profile_picture: commenterData.profilePicture,
      company: commenterData.company,
      location: commenterData.location,
      followers_count: commenterData.followersCount,
      connections_count: commenterData.connectionsCount,
      comment_text: commenterData.commentText,
      comment_date: commenterData.commentDate,
      comment_timestamp: commenterData.commentTimestamp,
      is_edited: commenterData.isEdited || false,
      is_pinned: commenterData.isPinned || false,
      comment_url: commenterData.commentUrl,
      relevance_score: commenterData.relevanceScore || 0,
      profile_data: commenterData.profileData,
      stats_data: commenterData.statsData,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create commenter: ${error.message}`);
  }

  return {
    id: data.id,
    sessionId: data.session_id,
    linkedinId: data.linkedin_id,
    name: data.name,
    headline: data.headline,
    profileUrl: data.profile_url,
    company: data.company,
    location: data.location,
    followersCount: data.followers_count,
    connectionsCount: data.connections_count,
    commentText: data.comment_text,
    commentDate: data.comment_date,
    relevanceScore: data.relevance_score,
    profileData: data.profile_data,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getCommentersBySession(sessionId: string): Promise<Commenter[]> {
  const { data, error } = await supabase
    .from(TABLES.COMMENTERS)
    .select('*')
    .eq('session_id', sessionId)
    .order('relevance_score', { ascending: false });

  if (error) {
    throw new Error(`Failed to get commenters: ${error.message}`);
  }

  return data.map((item: any) => ({
    id: item.id,
    sessionId: item.session_id,
    linkedinId: item.linkedin_id,
    name: item.name,
    headline: item.headline,
    profileUrl: item.profile_url,
    company: item.company,
    location: item.location,
    followersCount: item.followers_count,
    connectionsCount: item.connections_count,
    commentText: item.comment_text,
    commentDate: item.comment_date,
    relevanceScore: item.relevance_score,
    profileData: item.profile_data,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

export async function updateCommenterRelevanceScore(
  commenterId: string, 
  score: number
): Promise<Commenter> {
  const { data, error } = await supabase
    .from(TABLES.COMMENTERS)
    .update({ relevance_score: score })
    .eq('id', commenterId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update commenter relevance score: ${error.message}`);
  }

  return {
    id: data.id,
    sessionId: data.session_id,
    linkedinId: data.linkedin_id,
    name: data.name,
    headline: data.headline,
    profileUrl: data.profile_url,
    company: data.company,
    location: data.location,
    followersCount: data.followers_count,
    connectionsCount: data.connections_count,
    commentText: data.comment_text,
    commentDate: data.comment_date,
    relevanceScore: data.relevance_score,
    profileData: data.profile_data,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// Cache operations
export async function getCachedData(cacheKey: string): Promise<any | null> {
  const { data, error } = await supabase
    .from(TABLES.LINKEDIN_CACHE)
    .select('data, expires_at')
    .eq('cache_key', cacheKey)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    throw new Error(`Failed to get cached data: ${error.message}`);
  }

  // Check if cache has expired
  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    // Cache has expired, delete it
    await supabase
      .from(TABLES.LINKEDIN_CACHE)
      .delete()
      .eq('cache_key', cacheKey);
    return null;
  }

  return data.data;
}

export async function setCachedData(
  cacheKey: string, 
  data: any, 
  expirationMinutes: number = 60
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

  const { error } = await supabase
    .from(TABLES.LINKEDIN_CACHE)
    .upsert({
      cache_key: cacheKey,
      data: data,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    throw new Error(`Failed to set cached data: ${error.message}`);
  }
}

// Rate limiting
export async function checkRateLimit(
  identifier: string, // userId or IP address
  endpoint: string,
  maxRequests: number = 100,
  windowMinutes: number = 60
): Promise<{ allowed: boolean; remainingRequests: number; resetTime: Date }> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

  // Get current request count for this window
  const { data, error } = await supabase
    .from(TABLES.API_RATE_LIMITS)
    .select('request_count, window_start')
    .eq('user_id', identifier)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .single();

  let currentCount = 0;
  let resetTime = new Date();
  resetTime.setMinutes(resetTime.getMinutes() + windowMinutes);

  if (!error && data) {
    currentCount = data.request_count;
    resetTime = new Date(data.window_start);
    resetTime.setMinutes(resetTime.getMinutes() + windowMinutes);

    if (currentCount >= maxRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime,
      };
    }

    // Update the request count
    await supabase
      .from(TABLES.API_RATE_LIMITS)
      .update({ request_count: currentCount + 1 })
      .eq('user_id', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString());
  } else {
    // Create new rate limit record
    await supabase
      .from(TABLES.API_RATE_LIMITS)
      .insert({
        user_id: identifier,
        endpoint,
        request_count: 1,
        window_start: new Date().toISOString(),
      });
  }

  return {
    allowed: true,
    remainingRequests: maxRequests - currentCount - 1,
    resetTime,
  };
}