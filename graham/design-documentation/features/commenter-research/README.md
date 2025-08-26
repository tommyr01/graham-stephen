---
title: Individual Commenter Research Feature
description: Complete design specification for the core research interface that analyzes individual commenters and provides relevance scoring with detailed insights
feature: commenter-research
last-updated: 2025-01-14
version: 1.0.0
related-files: 
  - ./user-journey.md
  - ./screen-states.md
  - ./interactions.md
  - ./implementation.md
  - ../../design-system/style-guide.md
  - ../post-comment-extraction/README.md
dependencies:
  - LinkedIn API integration
  - Relevance scoring algorithm
  - Post analysis system
status: draft
---

# Individual Commenter Research Feature

## Overview

The Individual Commenter Research feature transforms basic commenter information into actionable intelligence by analyzing their recent LinkedIn posts and calculating relevance scores. This feature serves as the core value proposition of the tool, turning hours of manual prospect research into minutes of AI-assisted analysis that helps B2B professionals make informed outreach decisions.

## Table of Contents

- [Feature Requirements](#feature-requirements)
- [User Experience Goals](#user-experience-goals)
- [Information Architecture](#information-architecture)
- [Research Interface Design](#research-interface-design)
- [Relevance Scoring Integration](#relevance-scoring-integration)
- [Performance Considerations](#performance-considerations)

## Feature Requirements

### Primary User Story
> **As a business development representative**, I want to click a "Research" button on any commenter and see their relevance score with recent posts, so that I can quickly assess if they're worth reaching out to without manually reviewing their LinkedIn profile.

### Acceptance Criteria

**Research Expansion**
- Given a commenter card, when user clicks "Research"
- Then system expands to show relevance score (0-10), matched keywords, and scrollable recent posts feed
- And loading state provides clear progress feedback during analysis
- And results are organized for quick scanning and decision-making

**Relevance Analysis**
- Given a commenter's recent posts (up to 100), when relevance analysis runs
- Then system returns score based on boost terms (relevant topics) and down terms (off-topic content)
- And system highlights matched terms and provides score explanation
- And confidence indicators show analysis quality

**Edge Case Handling**
- Given a private or restricted profile, when research is requested
- Then system shows appropriate message about limited data availability
- And provides alternative research approaches where possible
- And maintains user workflow continuity

**Data Quality Management**
- Given profiles with no recent posts or posts in non-English languages
- Then system provides meaningful feedback about analysis limitations
- And offers manual research suggestions
- And tracks data quality for algorithm improvement

## User Experience Goals

### Instant Intelligence
**Rapid Analysis**: Convert 15-30 minutes of manual LinkedIn browsing into 15 seconds of automated insights
**Decision Support**: Provide clear relevance indicators that guide prospect prioritization
**Context Preservation**: Maintain connection between individual analysis and overall research goals

### Trust Building
**Transparency**: Show exactly why each relevance score was calculated
**Confidence Indicators**: Communicate analysis quality and reliability
**Human Oversight**: Enable users to override or refine automated assessments

### Workflow Integration
**Seamless Expansion**: Research interface integrates smoothly with commenter card layout
**Batch Processing**: Support efficient analysis of multiple commenters
**Export Ready**: Prepare data for CRM integration and follow-up activities

## Information Architecture

### Research Interface Hierarchy

**Level 1: Quick Assessment**
- Relevance score (0-10) with color coding
- Confidence indicator (High/Medium/Low)
- Key matched terms or phrases
- One-sentence relevance summary

**Level 2: Supporting Evidence**
- Recent post titles and engagement metrics
- Keyword match highlights in context
- Professional background summary
- Activity patterns and posting frequency

**Level 3: Detailed Analysis**
- Full post content with relevance analysis
- Industry and topic categorization
- Engagement quality assessment
- Network influence indicators

### Progressive Disclosure Strategy

**Collapsed State** (Default commenter card):
- Name, title, company, comment preview
- "Research" button as primary action
- Visual indicators of previous research status

**Expanded State** (Research active):
- Relevance score prominent at top
- Key insights immediately visible
- Tabbed or sectioned detailed information
- Clear actions for next steps

**Deep Dive State** (Optional detailed view):
- Full posts analysis in dedicated interface
- Comparative relevance across multiple factors
- Historical analysis trends
- Export and sharing capabilities

## Research Interface Design

### Expansion Animation Strategy

**Card Transformation**:
- **Initial state**: Standard commenter card (300px width, 200px height)
- **Transition**: Smooth expansion to research view (600px width, 400px height)
- **Animation**: 300ms ease-out with staggered content appearance
- **Backdrop**: Subtle overlay to focus attention on expanded card

**Content Loading Sequence**:
1. **Immediate** (0ms): Relevance score placeholder appears
2. **Fast** (200ms): Score animates in with color and number
3. **Quick** (400ms): Key insights and matched terms appear
4. **Standard** (800ms): Recent posts list populates
5. **Complete** (1200ms): All analysis details available

### Relevance Score Display

**Score Visualization**:
```
┌─────────────────────────────────────┐
│  RELEVANCE SCORE                    │
│                                     │
│      ████████▒▒  8/10               │
│      High Relevance                 │
│                                     │
│  🎯 Strong match for: Sales Tech,   │
│      B2B SaaS, Lead Generation      │
│                                     │
│  ⚡ High Confidence (47 posts)      │
└─────────────────────────────────────┘
```

**Visual Specifications**:
- **Score bar**: Height 12px, rounded corners, color-coded by score range
- **Score number**: H2 (24px, 600) positioned prominently
- **Score label**: Body (16px, 500) with semantic color
- **Match keywords**: Pill-style tags with primary color background
- **Confidence indicator**: Icon + text with explanation tooltip

### Recent Posts Analysis

**Posts List Interface**:
- **Container**: Scrollable area, max height 300px
- **Individual posts**: Card-style with relevance highlighting
- **Post preview**: Title + first line + engagement metrics
- **Relevance indicators**: Highlighted keywords and relevance contribution

**Post Card Design**:
```
┌─────────────────────────────────────┐
│  📝 "The future of B2B sales..."    │
│      Posted 3 days ago • 47 likes   │
│                                     │
│      "...automation tools are       │
│      changing how we approach       │
│      [lead generation]..."          │
│      ↳ +2 relevance (keyword match) │
│                                     │
│      [View Full Post] [Add to CRM]  │
└─────────────────────────────────────┘
```

**Keyword Highlighting**:
- **Matched terms**: Background highlight in Primary Light (#E6F3FF)
- **Border**: 1px solid Primary (#0066CC) for emphasis
- **Hover state**: Tooltip explaining relevance contribution
- **Accessibility**: High contrast maintained, screen reader support

### Professional Context Section

**Background Analysis**:
- **Current role**: Enhanced with industry context
- **Career progression**: Brief timeline of relevant positions
- **Company information**: Size, industry, recent news
- **Network insights**: Mutual connections, shared interests

**Context Presentation**:
```
┌─────────────────────────────────────┐
│  PROFESSIONAL CONTEXT               │
│                                     │
│  👤 Senior Sales Director @ TechCorp│
│      B2B SaaS company (500+ employees)
│      Previously: Sales Manager @ StartupCo
│                                     │
│  🏢 TechCorp recently raised Series B│
│      Growing sales team by 40%      │
│                                     │
│  🤝 5 mutual connections            │
│      Connected to your network      │
└─────────────────────────────────────┘
```

## Relevance Scoring Integration

### Score Calculation Display

**Transparent Scoring**:
- Show which factors contributed to score
- Display confidence levels for each factor
- Provide clear explanations for human understanding
- Enable score adjustment based on user feedback

**Factor Breakdown**:
```
┌─────────────────────────────────────┐
│  SCORE BREAKDOWN                    │
│                                     │
│  Content Relevance     +4 points    │
│  ├─ Keywords matched: 8/12          │
│  ├─ Topic alignment: High           │
│  └─ Industry focus: B2B SaaS        │
│                                     │
│  Engagement Quality    +2 points    │
│  ├─ Post frequency: Regular         │
│  ├─ Response rate: 75%              │
│  └─ Network size: 2.5K connections  │
│                                     │
│  Professional Level    +2 points    │
│  ├─ Decision maker: Likely          │
│  ├─ Budget authority: Probable      │
│  └─ Buying signals: Present         │
│                                     │
│  Total Score: 8/10 (High Relevance) │
└─────────────────────────────────────┘
```

### Confidence Indicators

**Analysis Quality Metrics**:
- **High Confidence**: 50+ recent posts, clear industry focus
- **Medium Confidence**: 10-50 posts, some relevant content
- **Low Confidence**: <10 posts, limited data available

**Visual Indicators**:
- **High**: Green dot + "High Confidence" text
- **Medium**: Yellow dot + "Medium Confidence" text  
- **Low**: Red dot + "Low Confidence" text + explanation

## Performance Considerations

### Loading Strategy

**Staged Loading**:
1. **Instant**: Basic profile information (already cached)
2. **Fast (0-2s)**: Recent posts retrieval and initial analysis
3. **Complete (2-5s)**: Deep relevance analysis and scoring
4. **Enhanced (5-10s)**: Professional context and network analysis

**Progress Communication**:
- Progress bar showing analysis stages
- Status text explaining current processing step
- Estimated completion time for longer analyses
- Option to work with partial results

### Data Caching

**Intelligent Caching**:
- **Profile basics**: Cache for 24 hours
- **Recent posts**: Cache for 6 hours  
- **Relevance scores**: Cache for 1 hour
- **Professional context**: Cache for 48 hours

**Cache Invalidation**:
- User-initiated refresh option
- Automatic refresh for critical data
- Smart cache warming for likely research targets

### Error Handling

**Graceful Degradation**:
- Partial analysis when some data unavailable
- Clear indication of missing information
- Alternative research suggestions
- Manual override options

**Error States**:
- **Profile Private**: Show available public information
- **No Recent Posts**: Focus on professional context
- **API Limitations**: Explain temporary restrictions
- **Analysis Failed**: Provide manual research tools

## Success Metrics

### User Efficiency
- **Research Time**: Average time from click to decision <30 seconds
- **Decision Confidence**: >90% of users feel confident in relevance assessment
- **Workflow Continuity**: <5% abandonment rate during research process

### Analysis Quality
- **Score Accuracy**: >80% user agreement with relevance scores
- **False Positives**: <15% of high-relevance scores marked as incorrect
- **False Negatives**: <10% of low-relevance scores marked as incorrect

### Technical Performance
- **Load Time**: Basic analysis complete <5 seconds
- **Success Rate**: >95% of research attempts complete successfully
- **Data Quality**: Analysis possible for >85% of LinkedIn profiles

## Integration Points

### CRM Export
- One-click export of research results
- Standardized data format for easy import
- Custom field mapping for different CRM systems
- Batch export for multiple prospects

### Feedback Loop
- Simple thumbs up/down for score accuracy
- Optional detailed feedback for algorithm improvement
- Learning system that adapts to user preferences
- Team-based learning for organization-wide improvement

### Workflow Continuation
- Clear next steps after research completion
- Integration with outreach tools and templates
- Calendar integration for follow-up scheduling
- Team collaboration features

## Related Documentation

- **[User Journey](./user-journey.md)** - Complete user flow for research feature
- **[Screen States](./screen-states.md)** - Detailed visual specifications
- **[Interactions](./interactions.md)** - Animation and interaction patterns
- **[Relevance Scoring](../relevance-scoring/README.md)** - Scoring algorithm integration
- **[Implementation Guide](./implementation.md)** - Technical specifications

---

**Priority**: P0 (Core value proposition)  
**Dependencies**: LinkedIn API, scoring algorithm, UI component library  
**Estimated Development**: 3-4 weeks including algorithm integration and testing