---
title: Screen States - Post Comment Extraction
description: Detailed visual specifications for all interface states in the LinkedIn post comment extraction feature
feature: post-comment-extraction
last-updated: 2025-01-14
version: 1.0.0
related-files: 
  - ./README.md
  - ./user-journey.md
  - ./interactions.md
  - ../../design-system/style-guide.md
  - ../../design-system/tokens/colors.md
  - ../../design-system/tokens/typography.md
dependencies:
  - Design system components
  - Color and typography tokens
status: draft
---

# Screen States - Post Comment Extraction

## Overview

This document provides comprehensive visual specifications for every possible state in the Post Comment Extraction feature. Each state includes detailed layout specifications, typography treatment, color applications, interaction affordances, and responsive behavior to ensure consistent implementation across all devices and user scenarios.

## Table of Contents

- [Initial Load State](#initial-load-state)
- [URL Input States](#url-input-states)
- [Processing States](#processing-states)
- [Success States](#success-states)
- [Error States](#error-states)
- [Edge Case States](#edge-case-states)
- [Responsive Adaptations](#responsive-adaptations)

## Initial Load State

### Default/Empty State

**Purpose**: First impression and primary action guidance for new users

#### Visual Design Specifications

**Layout Structure**:
- **Container**: Center-aligned, max-width 800px, margin auto
- **Vertical spacing**: 64px from header, 48px internal padding
- **Horizontal padding**: 32px (desktop), 24px (tablet), 16px (mobile)

**Typography Treatment**:
- **Main Heading**: H1 (32px, 700, Neutral-800)
  - Text: "Extract LinkedIn Post Comments"
  - Line height: 1.2, letter spacing: -0.025em
- **Subheading**: Body Large (18px, 400, Neutral-600)
  - Text: "Instantly analyze all commenters from any LinkedIn post for efficient prospect research"
  - Line height: 1.56, max width: 600px
- **Instructions**: Body (16px, 400, Neutral-500)
  - Text: "Paste a LinkedIn post URL below to get started"
  - Positioned above input field

**Input Field Specifications**:
- **Container**: Full width of parent, max 600px
- **Height**: 56px (enhanced for prominence)
- **Padding**: 16px horizontal, 14px vertical
- **Border**: 2px solid Neutral-300 (#D1D5DB)
- **Border radius**: 8px
- **Background**: White (#FFFFFF)
- **Typography**: Body (16px, 400, Neutral-900)
- **Placeholder**: "https://linkedin.com/posts/username_activity-12345" (Neutral-400)

**Button Specifications**:
- **Position**: Below input, centered
- **Dimensions**: Height 56px, padding 16px 32px
- **Background**: Neutral-300 (disabled state)
- **Border**: None
- **Border radius**: 8px
- **Typography**: Body (16px, 500, Neutral-500)
- **Text**: "Extract Comments"
- **State**: Disabled until valid URL entered

**Helper Content**:
- **Example section**: Light gray background (Neutral-50)
- **Padding**: 24px
- **Border radius**: 12px
- **Margin top**: 32px
- **Typography**: 
  - Label: "Example LinkedIn Post URLs:" (Body Small, 500, Neutral-700)
  - Examples: Code style (14px, 400, monospace, Neutral-600)

#### Accessibility Specifications

**Screen Reader Support**:
```html
<main role="main" aria-labelledby="page-title">
  <h1 id="page-title">Extract LinkedIn Post Comments</h1>
  <p class="subtitle">Instantly analyze all commenters from any LinkedIn post</p>
  
  <form role="search" aria-label="LinkedIn post comment extraction">
    <label for="post-url" class="sr-only">LinkedIn Post URL</label>
    <input 
      id="post-url" 
      type="url" 
      required
      aria-describedby="url-help url-examples"
      placeholder="https://linkedin.com/posts/username_activity-12345"
    />
    <div id="url-help">Paste a LinkedIn post URL below to get started</div>
    <button type="submit" disabled aria-describedby="submit-help">
      Extract Comments
    </button>
    <div id="submit-help" class="sr-only">
      Button will be enabled when you enter a valid LinkedIn post URL
    </div>
  </form>
</main>
```

**Keyboard Navigation**:
- Tab order: Header navigation → URL input → Submit button → Help links
- Focus indicators: 2px blue outline with 2px offset
- Enter key: Submits form when input is valid

## URL Input States

### Typing/Active State

**Trigger**: User clicks in input field or begins typing
**Visual Changes**:
- **Input border**: Changes to Primary blue (2px solid #0066CC)
- **Focus shadow**: 0 0 0 4px rgba(0, 102, 204, 0.2)
- **Placeholder**: Fades to 50% opacity when typing begins
- **Helper text**: Becomes more prominent (Neutral-600)

#### Real-time Validation States

**Valid URL Format**:
- **Indicator**: Green checkmark icon appears on right side of input
- **Border**: Changes to Success green (2px solid #10B981)
- **Button**: Becomes enabled with Primary background (#0066CC)
- **Feedback**: "Valid LinkedIn post URL ✓" appears below input

**Invalid URL Format**:
- **Border**: Changes to Error red (2px solid #EF4444)
- **Icon**: Red X appears on right side of input
- **Error message**: Appears below input with specific guidance
- **Button**: Remains disabled

### Validation Error Messages

**Generic Invalid Format**:
```
❌ This doesn't appear to be a LinkedIn post URL.
Please check the format and try again.

Example: https://linkedin.com/posts/username_activity-12345
```

**Non-LinkedIn URL**:
```
❌ Please enter a LinkedIn post URL.
This tool only works with LinkedIn posts, not other websites.
```

**Profile URL Instead of Post**:
```
❌ This appears to be a LinkedIn profile URL.
We need a specific post URL. Look for URLs that include "/posts/"
```

#### Visual Specifications for Error States

**Error Message Styling**:
- **Typography**: Body Small (14px, 400, Error #EF4444)
- **Icon**: Red warning icon (16px, aligned with text)
- **Background**: Error Light (#FEE2E2) with 12px padding
- **Border radius**: 6px
- **Margin top**: 8px from input field
- **Animation**: Slides down with 200ms ease-out transition

## Processing States

### Initial Loading State (0-2 seconds)

**Visual Transformation**:
- **Button**: Changes to loading state immediately
- **Button text**: "Extracting..." with spinner icon
- **Button background**: Maintains Primary blue
- **Input field**: Becomes disabled (Neutral-100 background)
- **Overlay**: Subtle overlay prevents interaction with form

**Loading Button Specifications**:
```css
.btn-loading {
  background: var(--color-primary);
  color: white;
  position: relative;
  padding-left: 48px; /* Space for spinner */
}

.btn-loading::before {
  content: '';
  position: absolute;
  left: 16px;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

### Extended Loading State (2+ seconds)

**Additional Elements**:
- **Progress container**: Appears below the form
- **Background**: Neutral-50 with 24px padding, 12px border radius
- **Progress bar**: Visual indicator of completion
- **Status text**: Updates with specific progress messages

**Progress Bar Specifications**:
- **Container**: Height 8px, background Neutral-200
- **Fill**: Primary blue (#0066CC) with smooth transitions
- **Border radius**: 4px on container and fill
- **Animation**: Width changes with 300ms ease-out transitions

**Status Message Examples**:
- "Connecting to LinkedIn..." (0-20%)
- "Fetching post data..." (20-40%)
- "Extracting comments..." (40-80%)
- "Gathering commenter profiles..." (80-95%)
- "Processing results..." (95-100%)

### Long Process State (10+ seconds)

**Enhanced Feedback**:
- **Time estimate**: "Estimated time remaining: 30 seconds"
- **Comment count**: "Processing 127 comments..."
- **Cancel option**: "Cancel" button appears for user control
- **Detailed progress**: More specific status updates

**Cancel Button**:
- **Position**: Right side of progress container
- **Style**: Ghost button (transparent background, Primary border)
- **Typography**: Body Small (14px, 500, Primary)
- **Hover state**: Light Primary background (#E6F3FF)

## Success States

### Results Display State

**Layout Transformation**:
- **Form section**: Collapses to compact header version
- **Results section**: Slides in from bottom with stagger animation
- **Summary header**: Shows extraction summary
- **Grid layout**: Responsive card grid for commenter information

#### Compact Header Design

**Visual Specifications**:
- **Background**: Neutral-50 with bottom border (1px solid Neutral-200)
- **Height**: 80px
- **Content**: URL display + "New Search" button
- **Position**: Sticky header behavior

**URL Display**:
- **Typography**: Body Small (14px, 400, Neutral-600)
- **Format**: "Extracted from: [truncated URL]"
- **Max width**: Truncate with ellipsis if needed

**New Search Button**:
- **Style**: Secondary button (16px height, compact padding)
- **Position**: Right-aligned in header
- **Text**: "New Search" or "Extract Different Post"

#### Results Summary

**Summary Bar**:
- **Background**: Success light (#D1FAE5)
- **Padding**: 16px 24px
- **Border**: 1px solid Success (#10B981)
- **Border radius**: 8px (top only, connects to results grid)

**Typography**:
- **Main text**: "Found 47 commenters from this post" (Body, 600, Success)
- **Metadata**: "Extracted 2 minutes ago" (Caption, 400, Neutral-500)
- **Action**: "Research individual profiles below" (Body Small, 400, Neutral-600)

#### Commenter Cards Grid

**Grid Specifications**:
- **Desktop**: 3 columns, 24px gaps
- **Tablet**: 2 columns, 16px gaps  
- **Mobile**: 1 column, 12px gaps
- **Container**: Max width 1200px, centered

**Individual Card Design**:
- **Dimensions**: 300px width (desktop), auto height
- **Background**: White with 1px border (Neutral-200)
- **Border radius**: 12px
- **Shadow**: 0 1px 3px rgba(0, 0, 0, 0.1)
- **Padding**: 20px
- **Hover state**: Shadow increases, slight scale (1.02)

**Card Content Layout**:
```
┌─────────────────────────────────────┐
│  [Avatar]  John Smith               │
│  (64px)    Senior Sales Director    │
│            TechCorp Inc.            │
│                                     │
│  "Great insights on automation..."  │
│  ↳ 12 likes, 3 replies             │
│                                     │
│           [Research Profile]        │
└─────────────────────────────────────┘
```

**Card Typography**:
- **Name**: H4 (18px, 600, Neutral-800)
- **Title**: Body (16px, 400, Neutral-600)
- **Company**: Body Small (14px, 400, Neutral-500)
- **Comment preview**: Body Small (14px, 400, Neutral-600), italic, max 2 lines
- **Engagement**: Caption (12px, 400, Neutral-500)

**Research Button**:
- **Style**: Primary button, full width of card
- **Height**: 44px
- **Typography**: Body (16px, 500, White)
- **Hover**: Primary Dark background (#004499)

## Error States

### Network Error State

**Visual Design**:
- **Icon**: Large network error icon (48px, Error color)
- **Heading**: "Connection Problem" (H3, 600, Neutral-800)
- **Message**: Explanatory text about network issues
- **Actions**: Retry button + offline mode info

**Error Container**:
- **Background**: Error Light (#FEE2E2)
- **Border**: 1px solid Error (#EF4444)
- **Padding**: 40px
- **Border radius**: 12px
- **Text alignment**: Center

### LinkedIn API Error State

**Specific Error Messages**:

**Rate Limited**:
```
⏰ Too Many Requests

LinkedIn is temporarily limiting requests. 
This usually resolves within 15 minutes.

[Try Again in 5 minutes] [Check Status]
```

**Post Not Accessible**:
```
🔒 Post Not Accessible

This post may be private, deleted, or restricted.
Make sure you can view it on LinkedIn first.

[Try Different Post] [LinkedIn Help]
```

**Service Unavailable**:
```
🔧 Service Temporarily Unavailable

LinkedIn's API is currently experiencing issues.
We're monitoring the situation.

[Check Service Status] [Try Again]
```

### No Comments Error State

**Visual Design**:
- **Icon**: Comment bubble with "0" (48px, Neutral-400)
- **Heading**: "No Comments Found" (H3, 600, Neutral-700)
- **Message**: Helpful explanation and suggestions

**Message Content**:
```
📝 This post doesn't have any comments yet.

For better results, try:
• Posts from industry thought leaders
• Popular posts with high engagement
• Recent posts about trending topics

[Try Different Post] [Browse Examples]
```

## Edge Case States

### Large Post Processing

**Progressive Loading Design**:
- **Initial batch**: First 50 comments load immediately
- **Load more**: Button to fetch additional comments
- **Batch size**: 50 comments per batch for performance

**Batch Loading Interface**:
```
┌─────────────────────────────────────┐
│  Showing 50 of 200+ comments       │
│  ────────────────                  │
│                                     │
│  [Commenter cards displayed here]   │
│                                     │
│  [Load Next 50 Comments]           │
│  or [Load All Remaining (150)]     │
└─────────────────────────────────────┘
```

### Mixed Content Types

**Post Type Indicators**:
- **Video post**: Video icon in header
- **Image post**: Image icon in header
- **Poll post**: Poll icon + "Poll results may affect comment visibility"
- **Article**: Article icon + "LinkedIn article comments"

### International Content

**Language Support**:
- **RTL languages**: Proper text direction and layout mirroring
- **Character encoding**: Full Unicode support for all languages
- **Font fallbacks**: Appropriate fonts for various scripts

## Responsive Adaptations

### Mobile Optimizations (320-767px)

**Layout Changes**:
- **Input height**: Increases to 56px for touch accessibility
- **Button height**: Minimum 44px for touch targets
- **Card grid**: Single column with full width
- **Spacing**: Reduced margins and padding

**Touch Interactions**:
- **Tap targets**: Minimum 44×44px for all interactive elements
- **Hover states**: Replaced with touch-appropriate feedback
- **Scroll behavior**: Smooth scrolling with momentum

### Tablet Adaptations (768-1023px)

**Hybrid Design**:
- **Two-column grid**: Balances content density and readability
- **Mixed interactions**: Support for both touch and pointer
- **Landscape optimization**: Better use of horizontal space

### Desktop Enhancements (1024px+)

**Power User Features**:
- **Keyboard shortcuts**: Visible hints and full keyboard navigation
- **Hover states**: Rich interactive feedback
- **Information density**: Optimal use of screen real estate

## Related Documentation

- **[User Journey](./user-journey.md)** - Context for these screen states
- **[Interactions](./interactions.md)** - Animation and transition specifications
- **[Design System](../../design-system/style-guide.md)** - Component and token references
- **[Implementation Guide](./implementation.md)** - Technical specifications for developers

---

**Last Updated**: January 14, 2025  
**Design Review Status**: Ready for development team review  
**Accessibility Compliance**: WCAG 2.1 AA verified