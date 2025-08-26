import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { commenterId } = await request.json()
    
    if (!commenterId) {
      return NextResponse.json(
        { error: 'Commenter ID is required' },
        { status: 400 }
      )
    }

    // Mock commenter details response
    const mockCommenterDetails = {
      commenter: {
        id: commenterId,
        name: getNameFromId(commenterId),
        headline: getHeadlineFromId(commenterId),
        profileUrl: `https://linkedin.com/in/${commenterId}`,
        profilePicture: null,
        location: 'San Francisco, CA',
        connectionDegree: 2,
        company: {
          name: getCompanyFromId(commenterId),
          industry: 'Software',
          size: '100-500 employees'
        },
        recentPosts: generateMockPosts(commenterId),
        lastUpdated: new Date().toISOString()
      }
    }

    // Mock relevance score response
    const score = Math.floor(Math.random() * 10) + 1
    const mockScoreResponse = {
      score,
      explanation: {
        matchedBoostTerms: [
          { term: 'B2B', weight: 2 },
          { term: 'sales', weight: 1.5 },
          { term: 'SaaS', weight: 2.5 }
        ],
        matchedDownTerms: [],
        contentAnalysis: {
          businessRelevant: 3.2,
          promotional: 0.5,
          personal: 0.3
        }
      },
      recommendations: [
        'High engagement with B2B content',
        'Shows interest in sales automation',
        'Active in professional discussions'
      ],
      confidence: 0.85
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 3000))

    return NextResponse.json({
      commenterDetails: mockCommenterDetails,
      relevanceScore: mockScoreResponse
    })
  } catch (error) {
    console.error('Error in test analysis:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getNameFromId(id: string): string {
  const names = [
    'Sarah Johnson',
    'Michael Chen', 
    'Jennifer Martinez',
    'David Wilson',
    'Lisa Thompson'
  ]
  return names[Math.abs(hashCode(id)) % names.length]
}

function getHeadlineFromId(id: string): string {
  const headlines = [
    'VP of Sales at TechCorp | B2B SaaS Expert',
    'Founder & CEO at StartupCo | Growing Revenue Teams',
    'Sales Operations Manager | Process Optimization Expert',
    'Director of Business Development | SaaS Growth Specialist',
    'Head of Revenue at GrowthCorp | Building High-Performance Teams'
  ]
  return headlines[Math.abs(hashCode(id)) % headlines.length]
}

function getCompanyFromId(id: string): string {
  const companies = [
    'TechCorp',
    'StartupCo',
    'SalesForce Inc',
    'GrowthCorp',
    'BusinessDev Solutions'
  ]
  return companies[Math.abs(hashCode(id)) % companies.length]
}

function generateMockPosts(commenterId: string) {
  const posts = [
    {
      id: `post-1-${commenterId}`,
      content: 'Just closed a major deal with our new B2B SaaS client! The key was understanding their specific lead generation challenges and showing how our automation tools could streamline their process. Sometimes the best sales strategy is simply listening to what your prospects really need.',
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      engagement: { likes: 45, comments: 12, reposts: 8 },
      hashtags: ['#B2BSales', '#SaaS', '#LeadGeneration'],
      mentions: []
    },
    {
      id: `post-2-${commenterId}`,
      content: 'Attending the SaaS Growth Summit next week! Looking forward to connecting with other sales leaders and learning about the latest trends in customer acquisition. Who else will be there?',
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      engagement: { likes: 28, comments: 6, reposts: 3 },
      hashtags: ['#SaaSGrowth', '#Networking', '#SalesLeadership'],
      mentions: []
    },
    {
      id: `post-3-${commenterId}`,
      content: 'The importance of personalization in B2B outreach cannot be overstated. Generic messages get deleted, but personalized ones that show you understand the prospect\'s business challenges get responses. What\'s your take on balancing automation with personalization?',
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      engagement: { likes: 67, comments: 23, reposts: 15 },
      hashtags: ['#B2BMarketing', '#Personalization', '#SalesOutreach'],
      mentions: []
    }
  ]
  return posts
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}