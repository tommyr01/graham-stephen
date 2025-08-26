import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { postUrl } = await request.json()
    
    if (!postUrl) {
      return NextResponse.json(
        { error: 'Post URL is required' },
        { status: 400 }
      )
    }

    // Mock data for testing the frontend
    const mockResponse = {
      sessionId: 'mock-session-123',
      post: {
        id: 'mock-post-123',
        url: postUrl
      },
      comments: [
        {
          id: 'comment-1',
          text: 'Great insights on B2B sales automation! We\'ve seen similar results with our lead generation campaigns.',
          postedAt: {
            timestamp: Date.now() - 3600000,
            date: '2025-01-14',
            relative: '1h ago'
          },
          isEdited: false,
          isPinned: false,
          commentUrl: 'https://linkedin.com/posts/comment-1',
          author: {
            name: 'Sarah Johnson',
            headline: 'VP of Sales at TechCorp | B2B SaaS Expert',
            profileUrl: 'https://linkedin.com/in/sarah-johnson',
            profilePicture: null
          },
          stats: {
            totalReactions: 12,
            reactions: {
              like: 10,
              appreciation: 2,
              empathy: 0,
              interest: 0,
              praise: 0
            },
            commentsCount: 3
          }
        },
        {
          id: 'comment-2',
          text: 'This is exactly what we needed for our startup! Looking forward to implementing these strategies.',
          postedAt: {
            timestamp: Date.now() - 7200000,
            date: '2025-01-14',
            relative: '2h ago'
          },
          isEdited: false,
          isPinned: false,
          commentUrl: 'https://linkedin.com/posts/comment-2',
          author: {
            name: 'Michael Chen',
            headline: 'Founder & CEO at StartupCo | Growing Revenue Teams',
            profileUrl: 'https://linkedin.com/in/michael-chen',
            profilePicture: null
          },
          stats: {
            totalReactions: 8,
            reactions: {
              like: 6,
              appreciation: 1,
              empathy: 0,
              interest: 1,
              praise: 0
            },
            commentsCount: 1
          }
        },
        {
          id: 'comment-3',
          text: 'Thanks for sharing! Bookmarking this for our next team meeting.',
          postedAt: {
            timestamp: Date.now() - 10800000,
            date: '2025-01-14',
            relative: '3h ago'
          },
          isEdited: false,
          isPinned: false,
          commentUrl: 'https://linkedin.com/posts/comment-3',
          author: {
            name: 'Jennifer Martinez',
            headline: 'Sales Operations Manager | Process Optimization Expert',
            profileUrl: 'https://linkedin.com/in/jennifer-martinez',
            profilePicture: null
          },
          stats: {
            totalReactions: 5,
            reactions: {
              like: 5,
              appreciation: 0,
              empathy: 0,
              interest: 0,
              praise: 0
            },
            commentsCount: 0
          }
        },
        {
          id: 'comment-4',
          text: 'Love this approach! We need to rethink our entire prospecting strategy.',
          postedAt: {
            timestamp: Date.now() - 14400000,
            date: '2025-01-14',
            relative: '4h ago'
          },
          isEdited: false,
          isPinned: false,
          commentUrl: 'https://linkedin.com/posts/comment-4',
          author: {
            name: 'David Wilson',
            headline: 'Director of Business Development | SaaS Growth Specialist',
            profileUrl: 'https://linkedin.com/in/david-wilson',
            profilePicture: null
          },
          stats: {
            totalReactions: 15,
            reactions: {
              like: 12,
              appreciation: 2,
              empathy: 0,
              interest: 1,
              praise: 0
            },
            commentsCount: 2
          }
        },
        {
          id: 'comment-5',
          text: 'Amazing post! This reminds me of the challenges we faced when scaling our sales team.',
          postedAt: {
            timestamp: Date.now() - 18000000,
            date: '2025-01-14',
            relative: '5h ago'
          },
          isEdited: false,
          isPinned: false,
          commentUrl: 'https://linkedin.com/posts/comment-5',
          author: {
            name: 'Lisa Thompson',
            headline: 'Head of Revenue at GrowthCorp | Building High-Performance Teams',
            profileUrl: 'https://linkedin.com/in/lisa-thompson',
            profilePicture: null
          },
          stats: {
            totalReactions: 9,
            reactions: {
              like: 7,
              appreciation: 1,
              empathy: 1,
              interest: 0,
              praise: 0
            },
            commentsCount: 0
          }
        }
      ],
      totalComments: 5
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    return NextResponse.json(mockResponse)
  } catch (error) {
    console.error('Error in test extraction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}