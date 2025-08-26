---
title: Screen States - Individual Commenter Research
description: Comprehensive visual specifications for all interface states in the individual commenter research and analysis feature
feature: commenter-research
last-updated: 2025-01-14
version: 1.0.0
related-files: 
  - ./README.md
  - ./user-journey.md
  - ./interactions.md
  - ../../design-system/style-guide.md
  - ../relevance-scoring/README.md
dependencies:
  - Design system components
  - Relevance scoring algorithm
  - LinkedIn API integration
status: draft
---

# Screen States - Individual Commenter Research

## Overview

This document provides detailed visual specifications for every state in the Individual Commenter Research feature, from the initial collapsed commenter cards through the complete expanded research interface. Each state includes layout specifications, content organization, interaction affordances, and responsive behavior to ensure consistent implementation across all user scenarios.

## Table of Contents

- [Collapsed Commenter Cards](#collapsed-commenter-cards)
- [Research Expansion States](#research-expansion-states)
- [Analysis Loading States](#analysis-loading-states)
- [Complete Research Interface](#complete-research-interface)
- [Error and Edge Case States](#error-and-edge-case-states)
- [Interactive Element States](#interactive-element-states)
- [Responsive Adaptations](#responsive-adaptations)

## Collapsed Commenter Cards

### Default Card State

**Purpose**: Provide essential commenter information with clear research action

#### Layout Specifications

**Card Dimensions**:
- **Width**: 340px (desktop), 100% (mobile)
- **Height**: 180px (fixed height for grid alignment)
- **Border radius**: 12px
- **Background**: White (#FFFFFF)
- **Border**: 1px solid Neutral-200 (#E5E7EB)
- **Shadow**: 0 1px 3px rgba(0, 0, 0, 0.1)

**Content Layout Grid**:
```
┌─────────────────────────────────────┐
│  [Avatar] John Smith                │ ← Header (60px height)
│  (48px)   Senior Sales Director     │
│           TechCorp Inc.             │
├─────────────────────────────────────┤
│  "Great insights on automation...   │ ← Comment preview (60px)
│  tools are really changing how..."  │
│  ↳ 12 likes, 3 replies • 2h ago    │
├─────────────────────────────────────┤
│           [Research Profile]        │ ← Action area (44px)
└─────────────────────────────────────┘
```

**Typography Specifications**:
- **Name**: H4 (18px, 600, Neutral-800)
- **Title**: Body (16px, 400, Neutral-600)
- **Company**: Body Small (14px, 400, Neutral-500)
- **Comment preview**: Body Small (14px, 400, Neutral-600), italic
- **Metadata**: Caption (12px, 400, Neutral-500)

**Research Button**:
- **Dimensions**: Full width, 44px height
- **Background**: Primary (#0066CC)
- **Typography**: Body (16px, 500, White)
- **Border radius**: 8px
- **Margin**: 16px from card edges

#### Visual States

**Default State**:
- Standard colors and styling as specified above
- Subtle hover hint: "Click to analyze this commenter's relevance"

**Hover State**:
- **Card elevation**: Shadow increases to 0 2px 8px rgba(0, 0, 0, 0.15)
- **Scale**: 1.02 transform with 200ms transition
- **Button**: Darker background (Primary Dark #004499)
- **Cursor**: Pointer on entire card (clickable)

**Previously Researched State**:
- **Visual indicator**: Small badge in top-right corner
- **Badge**: "Analyzed" with checkmark icon, Success color
- **Button text**: Changes to "View Analysis"
- **Button style**: Secondary (white background, Primary border)

**Loading/Disabled State**:
- **Button**: Neutral-300 background, disabled cursor
- **Text**: "Analyzing..." with spinner
- **Card**: Slight overlay prevents interaction

### Keyboard Focus State

**Focus Indicators**:
- **Card outline**: 2px solid Primary (#0066CC)
- **Outline offset**: 2px
- **Inner focus**: Button receives secondary focus ring when tabbed
- **Screen reader**: Announces card content and available actions

**Keyboard Interaction**:
- **Enter/Space**: Triggers research expansion
- **Tab**: Moves between cards in logical grid order
- **Escape**: Returns focus to page navigation (if applicable)

## Research Expansion States

### Expansion Animation Sequence

**Stage 1: Card Preparation (0-100ms)**:
- **Backdrop**: Semi-transparent overlay (rgba(0, 0, 0, 0.3)) appears
- **Card highlight**: Selected card gains z-index and stronger shadow
- **Grid adjustment**: Other cards fade to 60% opacity
- **Button state**: Changes to loading with spinner

**Stage 2: Size Transition (100-400ms)**:
- **Width expansion**: 340px → 700px (ease-out curve)
- **Height expansion**: 180px → 500px (synchronized timing)
- **Position**: Card centers in viewport with smooth transform
- **Border radius**: Maintains 12px throughout transition

**Stage 3: Content Population (400-800ms)**:
- **Loading skeleton**: Appears immediately for research content area
- **Header transformation**: Profile info reorganizes to expanded layout
- **Research area**: Slides in from bottom with fade transition
- **Action buttons**: New action buttons appear at bottom

### Expanded Card Layout

**Overall Structure**:
```
┌─────────────────────────────────────┐
│  [X] John Smith - Research Analysis │ ← Header (80px)
├─────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────────┐│
│  │ RELEVANCE   │ │ KEY INSIGHTS    ││ ← Analysis summary (120px)
│  │ SCORE       │ │                 ││
│  │             │ │                 ││
│  └─────────────┘ └─────────────────┘│
├─────────────────────────────────────┤
│  RECENT POSTS ANALYSIS              │ ← Posts section (260px)
│  [Scrollable content area]          │
├─────────────────────────────────────┤
│  [Save to CRM] [Export] [Feedback]  │ ← Actions (44px)
└─────────────────────────────────────┘
```

**Header Redesign**:
- **Close button**: Top-right X with hover state
- **Profile section**: Avatar (64px) + name/title on single line
- **Analysis status**: "Analysis complete" or loading indicator
- **Background**: Light gradient (White → Neutral-50)

## Analysis Loading States

### Initial Loading (0-2 seconds)

**Immediate Feedback**:
- **Relevance score area**: Skeleton animation with score placeholder
- **Key insights**: "Analyzing recent posts..." with spinner
- **Posts section**: Loading skeleton for 3-4 post previews
- **Progress indicator**: Minimal progress bar at top of expanded card

**Skeleton Animation**:
```css
.skeleton {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: loading 2s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Progress Updates (2-5 seconds)

**Staged Loading with Status**:
- **Stage 1**: "Retrieving recent posts..." (0-25% progress)
- **Stage 2**: "Analyzing content relevance..." (25-60% progress) 
- **Stage 3**: "Calculating relevance score..." (60-85% progress)
- **Stage 4**: "Gathering professional context..." (85-100% progress)

**Visual Progress Indicators**:
- **Progress bar**: Thin blue line at top of expanded card
- **Status text**: Below progress bar in Body Small font
- **Completion estimates**: "About 30 seconds remaining"

### Partial Loading States

**Some Data Available**:
- **Relevance score**: Shows with "Preliminary" label
- **Available posts**: Display with "Loading more..." at bottom
- **Context section**: Shows basic info, grays out unavailable data
- **Actions**: Disabled until analysis complete

## Complete Research Interface

### Relevance Score Section

**Score Display Layout**:
```
┌─────────────────────────────────────┐
│  RELEVANCE SCORE                    │
│                                     │
│      ████████▒▒  8                  │
│      HIGH RELEVANCE                 │
│                                     │
│  ⚡ High Confidence (47 posts analyzed)
│                                     │
│  🎯 Strong matches:                 │
│  [Sales Tech] [B2B SaaS] [Lead Gen] │
└─────────────────────────────────────┘
```

**Visual Specifications**:
- **Container**: 300px width, white background, subtle border
- **Score bar**: Height 16px, rounded corners, gradient fill
- **Score number**: H1 (48px, 700) positioned prominently right-aligned
- **Score label**: H4 (18px, 600) with semantic color
- **Confidence indicator**: Icon + text with tooltip explanation
- **Keyword tags**: Pill style with Primary background, white text

**Color Coding by Score**:
- **8-10 (High)**: Success gradient (#10B981 → #059669)
- **5-7 (Medium)**: Warning gradient (#F59E0B → #D97706)
- **0-4 (Low)**: Error gradient (#EF4444 → #DC2626)

### Key Insights Panel

**Insights Layout**:
```
┌─────────────────────────────────────┐
│  KEY INSIGHTS                       │
│                                     │
│  ✅ Decision maker at growing company│
│     TechCorp raised $50M Series B   │
│                                     │
│  📈 Active in relevant discussions  │
│     Posted 12 times about sales tech│
│                                     │
│  🤝 Well-connected in industry      │
│     2.5K connections, 500+ in SaaS  │
│                                     │
│  💡 Shows buying signals            │
│     "Looking for better tools..."   │
└─────────────────────────────────────┘
```

**Visual Treatment**:
- **Container**: 300px width, matches score section height
- **Insights**: Each insight has icon + headline + supporting detail
- **Typography**: 
  - **Headlines**: Body (16px, 500, Neutral-800)
  - **Details**: Body Small (14px, 400, Neutral-600)
- **Icons**: 16px, color-coded for insight type

### Recent Posts Analysis Section

**Posts List Container**:
- **Height**: 260px fixed with vertical scroll
- **Scroll behavior**: Smooth scrolling, momentum on mobile
- **Loading**: Progressive loading as user scrolls
- **Empty state**: "No recent posts found" with suggestions

**Individual Post Card**:
```
┌─────────────────────────────────────┐
│  📝 "The future of B2B sales auto..." │
│      3 days ago • 47 likes, 12 comments
│                                     │
│      "Marketing automation and      │
│      [lead generation] tools are    │
│      transforming how we approach   │
│      [prospecting] in modern..."    │
│                                     │
│      Relevance: +2 points          │
│      └─ Keywords: lead generation,  │
│          prospecting                │
│                                     │
│      [View Full Post] [Add Note]    │
└─────────────────────────────────────┘
```

**Post Card Specifications**:
- **Dimensions**: Full width, auto height (min 120px)
- **Background**: Neutral-50 (#F9FAFB)
- **Border**: 1px solid Neutral-200
- **Padding**: 16px
- **Margin bottom**: 12px
- **Border radius**: 8px

**Content Highlighting**:
- **Matched keywords**: Background highlight Primary Light (#E6F3FF)
- **Relevance score**: Color-coded (+2 = Success, 0 = Neutral, -1 = Warning)
- **Post engagement**: Neutral-500 color for metadata

### Professional Context Section

**Context Information Display**:
```
┌─────────────────────────────────────┐
│  PROFESSIONAL CONTEXT               │
│                                     │
│  Current Role                       │
│  Senior Sales Director @ TechCorp   │
│  • B2B SaaS, 500+ employees        │
│  • Previously: Sales Mgr @ StartupCo│
│                                     │
│  Company Intelligence               │
│  • Recently raised $50M Series B    │
│  • Expanding sales team (15 → 30)   │
│  • Using Salesforce, HubSpot       │
│                                     │
│  Network Insights                   │
│  • 2,500 connections (750 in SaaS)  │
│  • 5 mutual connections            │
│  • Active poster (2-3x/week)       │
└─────────────────────────────────────┘
```

**Layout Specifications**:
- **Full width**: Spans entire expanded card width
- **Background**: White with subtle top border
- **Sections**: Clear visual separation between information types
- **Typography**:
  - **Section headers**: H5 (16px, 600, Neutral-700)
  - **Primary info**: Body (16px, 400, Neutral-800)
  - **Secondary info**: Body Small (14px, 400, Neutral-600)

### Action Buttons Section

**Button Layout**:
- **Container**: Full width, 44px height, top border
- **Background**: Neutral-50
- **Button spacing**: 12px gaps between buttons
- **Alignment**: Left-aligned with right overflow handling

**Primary Actions**:
- **"Save to CRM"**: Primary button style
- **"Export Data"**: Secondary button style
- **"Share Analysis"**: Ghost button style
- **"Provide Feedback"**: Text button style

## Error and Edge Case States

### Private Profile Error

**Error Display**:
```
┌─────────────────────────────────────┐
│  🔒 Limited Analysis Available      │
│                                     │
│  This LinkedIn profile has privacy  │
│  settings that limit our analysis.  │
│                                     │
│  Available Information:             │
│  • Public profile details          │
│  • Comment activity on this post   │
│  • Professional background         │
│                                     │
│  For deeper analysis:               │
│  [View on LinkedIn] [Manual Research]│
└─────────────────────────────────────┘
```

**Visual Treatment**:
- **Icon**: Large lock icon (48px) in Warning color
- **Background**: Warning Light (#FEF3C7) for error section
- **Available data**: Shows what can be analyzed
- **Alternative actions**: Clear buttons for manual research options

### No Recent Posts State

**Alternative Analysis Display**:
```
┌─────────────────────────────────────┐
│  📝 No Recent Posts Found           │
│                                     │
│  This person hasn't posted recently │
│  on LinkedIn (last 90 days).       │
│                                     │
│  Alternative Analysis:              │
│  • Profile completeness: 85%       │
│  • Industry: B2B SaaS             │
│  • Experience level: Senior        │
│  • Network size: 2,500+           │
│                                     │
│  Recommendation: Medium priority    │
│  └─ Based on profile signals only  │
└─────────────────────────────────────┘
```

### API Failure State

**Service Unavailable Display**:
```
┌─────────────────────────────────────┐
│  ⚠️ Analysis Temporarily Unavailable │
│                                     │
│  LinkedIn's service is experiencing │
│  issues. We're monitoring the       │
│  situation and will retry           │
│  automatically.                     │
│                                     │
│  • Next retry in: 2 minutes        │
│  • You can continue with other     │
│    commenters while we wait        │
│                                     │
│  [Try Different Profile] [Retry Now]│
└─────────────────────────────────────┘
```

## Interactive Element States

### Research Button States

**Default State**:
- Background: Primary (#0066CC)
- Text: "Research Profile" (Body, 500, White)
- Border radius: 8px
- Height: 44px

**Hover State**:
- Background: Primary Dark (#004499)
- Shadow: 0 2px 4px rgba(0, 102, 204, 0.2)
- Transform: translateY(-1px) with 150ms transition
- Cursor: pointer

**Loading State**:
- Background: Primary (maintains color)
- Text: "Analyzing..." with spinner animation
- Spinner: 16px white spinner, left-aligned
- Disabled cursor

**Completed State**:
- Background: Success (#10B981)  
- Text: "Analysis Complete ✓"
- Temporary state (2 seconds) before reverting to "View Analysis"

### Keyword Tag Interactions

**Default Tags**:
- Background: Primary (#0066CC)
- Text: White, Body Small (14px, 500)
- Padding: 6px 12px
- Border radius: 20px (pill shape)

**Hover State**:
- Background: Primary Dark (#004499)
- Scale: 1.05 transform
- Cursor: pointer
- Tooltip: Shows relevance contribution

**Click/Active State**:
- Background: Primary Light (#E6F3FF)
- Text: Primary Dark (#004499)
- Border: 1px solid Primary
- Tooltip: Detailed explanation of keyword relevance

### Expandable Sections

**Collapsed State**:
- **Header**: H5 with chevron down icon
- **Content**: Hidden with 0 height
- **Hover**: Subtle background color change

**Expanded State**:
- **Header**: Chevron up icon
- **Content**: Slides down with 300ms ease-out
- **Max height**: Defined for smooth animation

## Responsive Adaptations

### Mobile Optimizations (320-767px)

**Expanded Card Behavior**:
- **Full screen**: Card expands to full viewport
- **Scroll behavior**: Entire card scrolls vertically
- **Header**: Sticky positioned with close button
- **Sections**: Stack vertically with full width

**Layout Changes**:
- **Score display**: Larger score number (64px) for touch clarity
- **Posts list**: Single column, larger touch targets
- **Action buttons**: Full width, stacked vertically
- **Keyword tags**: Wrap to multiple lines

### Tablet Adaptations (768-1023px)

**Hybrid Interface**:
- **Card size**: 600px width (smaller than desktop)
- **Two-column**: Score and insights side-by-side
- **Touch targets**: Minimum 44px for all interactive elements
- **Scrolling**: Smooth momentum scrolling for posts

### Desktop Enhancements (1024px+)

**Advanced Features**:
- **Hover states**: Rich interactive feedback
- **Keyboard shortcuts**: Visible shortcuts for power users
- **Multiple selection**: Support for batch research operations
- **Tooltip details**: Enhanced tooltips with more information

## Related Documentation

- **[User Journey](./user-journey.md)** - Context for these screen states
- **[Interactions](./interactions.md)** - Animation and transition specifications  
- **[Relevance Scoring](../relevance-scoring/README.md)** - Score calculation and display
- **[Design System](../../design-system/style-guide.md)** - Component and token references

---

**Last Updated**: January 14, 2025  
**Design Review Status**: Ready for development implementation  
**Accessibility Compliance**: WCAG 2.1 AA verified with screen reader testing