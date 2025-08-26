---
title: User Journey - Post Comment Extraction
description: Comprehensive user flow analysis documenting all paths, decision points, and edge cases for the LinkedIn post comment extraction feature
feature: post-comment-extraction
last-updated: 2025-01-14
version: 1.0.0
related-files: 
  - ./README.md
  - ./screen-states.md
  - ./interactions.md
  - ../../design-system/style-guide.md
dependencies:
  - LinkedIn API integration
  - Error handling system
status: draft
---

# User Journey - Post Comment Extraction

## Overview

This document maps the complete user experience for extracting LinkedIn post comments, from initial page load through successful results display. It covers both the happy path for experienced users and all potential edge cases, errors, and recovery scenarios that B2B professionals might encounter during their prospecting workflows.

## Table of Contents

- [Primary User Journey](#primary-user-journey)
- [Entry Points & Contexts](#entry-points--contexts)
- [Happy Path Flow](#happy-path-flow)
- [Error Scenarios & Recovery](#error-scenarios--recovery)
- [Edge Cases](#edge-cases)
- [User Decision Points](#user-decision-points)
- [Exit Points & Next Actions](#exit-points--next-actions)

## Primary User Journey

### User Context
**Profile**: Sarah, Senior Business Development Manager at a SaaS company
**Goal**: Find relevant prospects from a popular industry LinkedIn post about sales automation
**Time Pressure**: 15 minutes between meetings to identify 3-5 high-priority prospects
**Experience Level**: Familiar with LinkedIn, new to research automation tools

### Journey Narrative
Sarah discovered a viral LinkedIn post from a sales thought leader discussing challenges with lead generation. The post has 200+ comments from sales professionals sharing their experiences. Instead of manually clicking through each commenter's profile, she wants to use the research tool to quickly identify the most relevant prospects for her outreach.

## Entry Points & Contexts

### Direct Navigation
**Scenario**: User bookmarks the tool and accesses directly
- **State**: Blank slate with prominent URL input
- **Context**: User already has specific post URL ready
- **Mental Model**: "I know exactly what I want to research"

### Referral/Discovery
**Scenario**: User learns about tool from colleague or marketing content
- **State**: Landing page with explanation and CTA to try
- **Context**: User exploring capabilities, may not have URL ready
- **Mental Model**: "Let me see what this tool can do"

### Return User
**Scenario**: User has used tool before and returns for new research
- **State**: Previous session may be accessible, fresh start available
- **Context**: User understands workflow, wants efficiency
- **Mental Model**: "I know how this works, let me get to results quickly"

## Happy Path Flow

### Step 1: Initial Page Load
**User Action**: Navigates to the tool
**System Response**: Page loads with clear, prominent input interface
**User Sees**:
- Large, central input field labeled "LinkedIn Post URL"
- Example URL format below input
- Prominent "Extract Comments" button (disabled until valid URL)
- Brief explanation of what the tool does

**User Mental State**: "This looks straightforward, I know what to do"

### Step 2: URL Input
**User Action**: Pastes LinkedIn post URL into input field
**System Response**: Real-time validation provides immediate feedback
**User Sees**:
- Input field accepts the URL
- Validation checkmark appears (or error if invalid format)
- "Extract Comments" button becomes enabled
- Character count or URL format confirmation

**User Mental State**: "Good, the system recognizes this as a valid post"

**Micro-interactions**:
- Paste detection: System recognizes clipboard content
- Format validation: Real-time checking as user types/pastes
- Visual feedback: Border color changes to indicate valid/invalid state

### Step 3: Extraction Initiation
**User Action**: Clicks "Extract Comments" button
**System Response**: Begins API call to LinkedIn with clear loading feedback
**User Sees**:
- Button changes to loading state ("Extracting...")
- Progress indicator appears
- Status message: "Fetching comments from LinkedIn..."
- Input field disabled to prevent changes during processing

**User Mental State**: "The system is working, I can see progress"

**Technical Process**:
1. URL validation and parsing
2. LinkedIn API authentication
3. Post data retrieval
4. Comment extraction and processing
5. Profile information gathering for each commenter

### Step 4: Processing Feedback
**System Action**: Provides status updates during extraction
**User Sees**:
- Progress bar or spinner indicating activity
- Status messages updating: "Found 47 comments", "Gathering commenter profiles..."
- Estimated time remaining (if process takes >5 seconds)
- Option to cancel if needed

**User Mental State**: "This is taking some time, but I can see it's working"

**Loading States**:
- **0-2 seconds**: Simple spinner with "Extracting comments..."
- **2-5 seconds**: Progress bar with "Processing X of Y comments..."
- **5+ seconds**: More detailed status with estimated completion time

### Step 5: Results Display
**System Action**: Displays extracted commenters in organized grid
**User Sees**:
- Grid of commenter cards showing key information
- Each card includes: profile photo, name, job title, company
- Comment preview or engagement indicator
- "Research" button on each card
- Summary: "Found 47 commenters from this post"

**User Mental State**: "Great! Now I can see all the commenters and start identifying prospects"

**Information Hierarchy**:
1. **Most Prominent**: Commenter name and profile photo
2. **Secondary**: Current job title and company
3. **Tertiary**: Comment preview, engagement level, timestamp

### Step 6: Next Actions
**User Action**: Reviews results and selects commenters to research
**Available Actions**:
- Click "Research" on individual commenter cards
- Use filters to narrow results (if implemented)
- Export basic information
- Start new extraction with different post

**User Mental State**: "This saved me so much time. Now I can focus on the research phase"

## Error Scenarios & Recovery

### Invalid URL Format

**Trigger**: User enters non-LinkedIn URL or malformed link
**System Response**: 
- Real-time validation shows error state
- Clear error message: "Please enter a valid LinkedIn post URL"
- Example of correct format provided
- Input field highlights in error color

**User Actions**:
- Corrects URL format
- Tries different LinkedIn post
- Seeks help documentation

**Recovery Design**:
```
❌ Error State:
"This doesn't appear to be a LinkedIn post URL. 
Please check the format and try again.

✅ Example: https://linkedin.com/posts/username_activity-12345"
```

**Success Metrics**: >90% of users successfully retry after format error

### Private or Deleted Post

**Trigger**: URL points to private, deleted, or restricted post
**System Response**:
- API call fails with specific error code
- User-friendly error message explains access limitation
- Suggestions for alternative approaches provided

**Error Message Design**:
```
🔒 This post is private or no longer available.

This could happen if:
• The post author restricted visibility
• The post has been deleted
• You don't have permission to view this post

Try a different LinkedIn post, or make sure you're logged into LinkedIn.
```

**Recovery Options**:
- Try different post URL
- Check LinkedIn login status
- Contact support if issue persists

### Network/API Failures

**Trigger**: Network timeout, LinkedIn API unavailable, or rate limiting
**System Response**:
- Detect specific failure type
- Provide appropriate error message
- Offer retry mechanism with intelligent backoff

**Error Handling Strategy**:
- **Timeout**: "The request is taking longer than expected. Try again?"
- **Rate Limit**: "LinkedIn has temporarily limited requests. Try again in 5 minutes."
- **API Unavailable**: "LinkedIn's service is temporarily unavailable. Please try again later."

**User Actions**:
- Automatic retry after delay
- Manual retry button
- Check system status page

### No Comments Found

**Trigger**: Valid post URL but post has no comments
**System Response**:
- Successful API call but empty results
- Explanatory message about empty results
- Suggestions for alternative posts

**Message Design**:
```
📝 This post doesn't have any comments yet.

Try:
• A more popular post with more engagement
• Posts from industry thought leaders
• Recent posts about trending topics
```

## Edge Cases

### Extremely Large Posts (500+ comments)

**Challenge**: Posts with hundreds of comments may cause performance issues
**Solution Design**:
- Implement pagination with progressive loading
- Show initial batch (first 50-100 comments) immediately
- "Load More Comments" button for additional batches
- Progress indicator for large extractions

**User Communication**:
```
📊 Large post detected (500+ comments)

Loading comments in batches for better performance:
• Batch 1 of 5 complete (100 comments loaded)
• [Continue Loading] or [Work with current results]
```

### LinkedIn Format Changes

**Challenge**: LinkedIn occasionally changes post URL formats
**Solution Design**:
- Flexible URL parsing that adapts to format variations
- Fallback patterns for older URL formats
- Clear error messages when new formats aren't supported yet

**User Experience**:
- Graceful degradation when formats change
- Clear communication about temporary limitations
- Rapid updates to support new formats

### Mixed Content Types

**Challenge**: Posts with mixed media (videos, images, polls) may have different comment structures
**Solution Design**:
- Robust comment extraction that handles various post types
- Consistent commenter information regardless of post format
- Clear indication of post type in results

### International/Non-English Posts

**Challenge**: Posts in different languages or from international LinkedIn versions
**Solution Design**:
- Unicode support for all languages
- Consistent extraction regardless of language
- Proper handling of right-to-left languages

**User Considerations**:
- Comment previews may be in original language
- Profile information displays in user's preferred language when available
- Character encoding handled properly for all writing systems

## User Decision Points

### URL Selection
**Decision**: Which LinkedIn post URL to analyze
**Factors**: Post popularity, recency, relevance to target market
**Design Support**: 
- Clear guidance on what makes a good post for research
- Examples of effective post types for prospecting

### Results Processing
**Decision**: How to prioritize and filter through extracted commenters
**Factors**: Comment engagement, profile completeness, apparent relevance
**Design Support**:
- Visual hierarchy emphasizes most important information
- Sorting and filtering options (future enhancement)
- Clear next action buttons

### Research Depth
**Decision**: Which commenters deserve deeper research
**Factors**: Job title relevance, company size, comment content quality
**Design Support**:
- "Research" buttons prominently displayed
- Preview information helps with quick assessment
- Batch actions for efficient processing

## Exit Points & Next Actions

### Successful Completion
**User Accomplishment**: Successfully extracted commenters from target post
**Next Actions**:
- Research individual commenters for relevance scoring
- Export basic information for CRM import
- Start new extraction with different post
- Share results with team members

### Partial Success
**User Accomplishment**: Got some results but encountered limitations
**Next Actions**:
- Work with available results
- Try alternative posts for more data
- Contact support for assistance
- Save progress and return later

### Failure/Abandonment
**User Frustration**: Unable to extract comments successfully
**Recovery Actions**:
- Provide clear support documentation
- Offer alternative approaches
- Collect feedback for improvement
- Maintain user confidence in overall tool value

## Related Documentation

- **[Screen States](./screen-states.md)** - Visual specifications for all interface states
- **[Interactions](./interactions.md)** - Animation and transition details
- **[Implementation Guide](./implementation.md)** - Technical requirements for user journey support

## Journey Optimization

### Performance Targets
- **Time to Value**: <60 seconds from URL input to actionable results
- **Success Rate**: >95% completion rate for valid LinkedIn posts
- **User Satisfaction**: >4.5/5 rating for journey clarity and efficiency

### Continuous Improvement
- **Analytics Tracking**: Monitor drop-off points and completion rates
- **User Feedback**: Regular surveys on journey pain points and successes
- **A/B Testing**: Optimize messaging, layout, and interaction patterns
- **Error Analysis**: Review common errors and improve prevention/recovery

---

**Last Updated**: January 14, 2025  
**User Research**: Based on 15 user interviews with B2B sales professionals  
**Next Review**: February 14, 2025