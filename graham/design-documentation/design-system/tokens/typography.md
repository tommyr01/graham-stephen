---
title: Typography System - LinkedIn Comment Research Tool
description: Complete typography scale, hierarchy, and implementation specifications for optimal readability and information architecture
last-updated: 2025-01-14
version: 1.0.0
related-files: 
  - ../style-guide.md
  - ./spacing.md
  - ../../accessibility/guidelines.md
dependencies:
  - Inter font family
  - JetBrains Mono for code elements
status: draft
---

# Typography System

## Overview

The typography system for the LinkedIn Comment Research Tool prioritizes readability during extended research sessions while establishing clear information hierarchy that guides users through complex commenter data. The system uses Inter as the primary typeface for its exceptional legibility at all sizes, complemented by JetBrains Mono for technical content and API responses.

## Table of Contents

- [Font Selection Rationale](#font-selection-rationale)
- [Type Scale & Hierarchy](#type-scale--hierarchy)
- [Responsive Typography](#responsive-typography)
- [Content-Specific Applications](#content-specific-applications)
- [Implementation Guidelines](#implementation-guidelines)
- [Accessibility Considerations](#accessibility-considerations)
- [Performance Optimization](#performance-optimization)

## Font Selection Rationale

### Primary Typeface: Inter

**Why Inter?**
- **Exceptional legibility**: Designed specifically for user interfaces and digital screens
- **Professional character**: Conveys trustworthiness appropriate for B2B research tools
- **Comprehensive weights**: Supports subtle hierarchy without jarring weight jumps
- **Excellent hinting**: Maintains clarity across various screen densities and operating systems
- **Open source**: Reduces licensing complexity and ensures long-term availability

**Technical Benefits**
- Optimized for small sizes (12px+) common in data-dense interfaces
- Excellent character differentiation (1/I/l clarity crucial for LinkedIn URLs)
- Wide language support for international user base
- Active maintenance and regular improvements

### Secondary Typeface: JetBrains Mono

**Use Cases**
- API endpoints and responses
- LinkedIn URLs and technical identifiers
- Code snippets in documentation
- Data export formats

**Benefits**
- Designed by developers for developers
- Excellent character alignment and spacing
- Clear distinction between similar characters (0/O, 1/I/l)
- Comfortable for extended reading of technical content

### System Font Fallbacks

**Complete Font Stack**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', sans-serif;
```

**Fallback Strategy**
1. **Inter**: Primary choice, loaded via font display API
2. **System fonts**: Immediate rendering while Inter loads
3. **Generic sans-serif**: Final fallback ensures content accessibility

## Type Scale & Hierarchy

### Display & Headings

**H1 - Page Titles**: `32px/38px, 700, -0.025em`
- **Usage**: Main page headings, feature titles, primary user actions
- **Context**: "LinkedIn Comment Research", "Research Results"
- **Line height**: Tight (1.19) for impact while maintaining readability
- **Letter spacing**: Slight negative to improve cohesion at large sizes

**H2 - Section Headers**: `24px/32px, 600, -0.02em`
- **Usage**: Major section divisions, card titles, modal headers
- **Context**: "Commenter Analysis", "Relevance Insights", "Recent Posts"
- **Line height**: Balanced (1.33) for comfortable scanning
- **Weight**: Semibold creates clear hierarchy without excessive boldness

**H3 - Subsection Headers**: `20px/28px, 600, -0.015em`
- **Usage**: Content subsections, detailed breakdowns, feature explanations
- **Context**: "Profile Overview", "Post Analysis", "Keyword Matches"
- **Optimal for**: Breaking down complex research data into digestible sections

**H4 - Card Titles**: `18px/24px, 500, -0.01em`
- **Usage**: Individual commenter names, post titles, data labels
- **Context**: Personal names, job titles, company names
- **Weight**: Medium provides emphasis without competing with H2/H3

**H5 - Minor Headers**: `16px/24px, 500, 0em`
- **Usage**: Form section labels, metadata categories, table headers
- **Context**: "Contact Information", "Recent Activity", "Engagement Metrics"
- **Neutral spacing**: Maintains readability without artificial tightening

### Body Text Hierarchy

**Body Large**: `18px/28px, 400`
- **Usage**: Feature descriptions, important explanatory content, onboarding text
- **Context**: Welcome messages, feature benefits, success confirmations
- **Line height**: Generous (1.56) for comfortable extended reading
- **When to use**: Primary reading content where comprehension is critical

**Body**: `16px/24px, 400`
- **Usage**: Standard interface text, form labels, navigation items
- **Context**: Button text, menu items, general UI content
- **Standard**: Default text size for most interface elements
- **Accessibility**: Meets WCAG minimum size recommendations

**Body Small**: `14px/20px, 400`
- **Usage**: Secondary information, supporting details, compact displays
- **Context**: Timestamps, metadata, secondary descriptions
- **Line height**: Maintains readability (1.43) despite smaller size
- **Limit usage**: Avoid for primary content to ensure accessibility

### Specialized Text Styles

**Caption**: `12px/16px, 400`
- **Usage**: Minimal supporting information, fine print, attribution
- **Context**: "Last updated", "Data source", legal disclaimers
- **Minimum size**: Below this risks accessibility non-compliance
- **Color pairing**: Use with Neutral-500 or darker for sufficient contrast

**Label**: `14px/20px, 500, uppercase, 0.05em`
- **Usage**: Form field labels, category tags, status indicators
- **Context**: "RELEVANCE SCORE", "POST TYPE", "ENGAGEMENT LEVEL"
- **Letter spacing**: Positive spacing improves uppercase readability
- **Weight**: Medium provides clear hierarchy without shouting

**Code/Technical**: `14px/20px, 400, monospace`
- **Font**: JetBrains Mono with system fallbacks
- **Usage**: URLs, API responses, export data, error messages
- **Context**: "https://linkedin.com/posts/...", JSON responses
- **Background**: Often paired with neutral background for emphasis

### Weight Hierarchy

**Light (300)**
- **Reserved for**: Large display text, decorative headers
- **Avoid**: Small sizes, body text, critical information
- **Accessibility**: Requires larger sizes for sufficient contrast

**Regular (400)**
- **Primary use**: All body text, standard UI elements
- **Versatility**: Works at all approved sizes
- **Reliability**: Safest choice for extended reading

**Medium (500)**
- **Purpose**: Button text, emphasized content, minor headers
- **Balance**: Noticeable emphasis without boldness
- **UI elements**: Labels, active states, selected items

**Semibold (600)**
- **Function**: Section headers, card titles, important UI labels
- **Hierarchy**: Creates clear information levels
- **Professional**: Strong enough for authority, not aggressive

**Bold (700)**
- **Limited to**: Page titles, critical alerts, brand elements
- **Impact**: Reserved for highest importance content
- **Sparingly**: Overuse reduces effectiveness

## Responsive Typography

### Mobile First Approach (320-767px)

**Optimizations for Touch Interfaces**
- **H1**: Reduced to `28px/34px` (maintains impact, improves fit)
- **H2**: Reduced to `22px/28px` (prevents awkward line breaks)
- **Body minimum**: `16px` (iOS requirement, prevents zoom on focus)
- **Touch targets**: Minimum 44px height for interactive text elements
- **Line length**: Max 40 characters for comfortable thumb reading

**Content Prioritization**
- **Essential information first**: Commenter names, relevance scores prominent
- **Progressive disclosure**: Detailed analysis collapsed by default
- **Scannable hierarchy**: Clear size differences between heading levels

### Tablet Adaptations (768-1023px)

**Balanced Approach**
- **Standard scale**: Full type scale appropriate for medium screens
- **Line length optimization**: 45-65 characters for optimal readability
- **Hybrid interactions**: Support both touch and pointer input
- **Flexible layouts**: Typography supports both portrait and landscape

### Desktop Excellence (1024px+)

**Information Density**
- **Full hierarchy**: All type sizes available and effective
- **Optimal line lengths**: 65 characters maximum for body text
- **Micro-typography**: Letter spacing and fine-tuning applied
- **Advanced features**: Hover states, keyboard shortcuts visible

### Large Display Optimization (1440px+)

**Enhanced Readability**
- **Body text increase**: `18px` becomes minimum for reduced eye strain
- **Generous spacing**: Increased line heights for comfortable scanning
- **Content areas**: Constrained width prevents excessive line lengths
- **Focus enhancement**: Larger target areas for precision interactions

## Content-Specific Applications

### Commenter Cards

**Name Display**: H4 (18px, 500) for clear identification
**Job Title**: Body (16px, 400) with Neutral-600 color
**Company**: Body Small (14px, 400) with Neutral-500 color
**Metadata**: Caption (12px, 400) for timestamps, post counts

### Relevance Scoring

**Score Number**: H2 (24px, 600) with semantic color coding
**Score Label**: Label (14px, 500, uppercase) for category identification
**Explanation**: Body (16px, 400) for clear reasoning
**Keywords**: Code (14px, 400, monospace) for matched terms

### Research Results

**Section Headers**: H3 (20px, 600) for content organization
**Post Titles**: H4 (18px, 500) for individual post identification
**Post Content**: Body (16px, 400) for extended readability
**Engagement Data**: Caption (12px, 400) with tabular alignment

### Form Elements

**Field Labels**: Label (14px, 500, uppercase) for clear identification
**Input Text**: Body (16px, 400) for accessibility compliance
**Helper Text**: Body Small (14px, 400) with Neutral-500 color
**Error Messages**: Body Small (14px, 400) with Error color

## Implementation Guidelines

### CSS Custom Properties

```css
:root {
  /* Font Families */
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Consolas, 'Liberation Mono', monospace;
  
  /* Type Scale */
  --font-size-h1: 2rem;        /* 32px */
  --font-size-h2: 1.5rem;      /* 24px */
  --font-size-h3: 1.25rem;     /* 20px */
  --font-size-h4: 1.125rem;    /* 18px */
  --font-size-h5: 1rem;        /* 16px */
  --font-size-body-lg: 1.125rem; /* 18px */
  --font-size-body: 1rem;      /* 16px */
  --font-size-body-sm: 0.875rem; /* 14px */
  --font-size-caption: 0.75rem; /* 12px */
  
  /* Line Heights */
  --line-height-tight: 1.2;
  --line-height-snug: 1.33;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.56;
  
  /* Font Weights */
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Letter Spacing */
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0em;
  --letter-spacing-wide: 0.05em;
}

/* Responsive Typography */
@media (max-width: 767px) {
  :root {
    --font-size-h1: 1.75rem;     /* 28px */
    --font-size-h2: 1.375rem;    /* 22px */
  }
}

@media (min-width: 1440px) {
  :root {
    --font-size-body: 1.125rem;  /* 18px */
  }
}
```

### Utility Classes

```css
/* Heading Classes */
.text-h1 {
  font-size: var(--font-size-h1);
  line-height: var(--line-height-tight);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-tight);
}

.text-h2 {
  font-size: var(--font-size-h2);
  line-height: var(--line-height-snug);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--letter-spacing-tight);
}

/* Body Text Classes */
.text-body {
  font-size: var(--font-size-body);
  line-height: var(--line-height-normal);
  font-weight: var(--font-weight-normal);
}

.text-body-sm {
  font-size: var(--font-size-body-sm);
  line-height: var(--line-height-normal);
  font-weight: var(--font-weight-normal);
}

/* Specialized Classes */
.text-label {
  font-size: var(--font-size-body-sm);
  line-height: var(--line-height-normal);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}

.text-code {
  font-family: var(--font-mono);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-height-normal);
}
```

## Accessibility Considerations

### WCAG Compliance

**Minimum Size Requirements**
- **Body text**: 16px minimum (browser default) prevents mobile zoom
- **Small text**: 14px maximum reduction while maintaining readability
- **Caption text**: 12px absolute minimum for secondary information

**Contrast Requirements**
- **Regular text**: 4.5:1 minimum contrast ratio
- **Large text** (18px+ or 14px+ bold): 3:1 minimum contrast ratio
- **Enhanced contrast**: 7:1 for critical information and actions

### User Preferences

**System Respect**
```css
/* Respect user font size preferences */
@media (prefers-reduced-motion: no-preference) {
  .text-scalable {
    font-size: calc(1rem + 0.5vw);
  }
}

/* High contrast mode adaptations */
@media (prefers-contrast: high) {
  :root {
    --font-weight-normal: 500;
    --font-weight-medium: 600;
  }
}

/* Reduced data mode (smaller fonts) */
@media (prefers-reduced-data: reduce) {
  .text-body-lg {
    font-size: var(--font-size-body);
  }
}
```

### Screen Reader Optimization

**Semantic Markup**
- Use proper heading hierarchy (H1 → H2 → H3, never skip levels)
- Apply aria-labels for context-specific content
- Provide text alternatives for typography-based information hierarchy

**Content Structure**
- Maintain logical reading order independent of visual hierarchy
- Use list markup for grouped content (commenter lists, feature lists)
- Implement skip links for navigation efficiency

## Performance Optimization

### Font Loading Strategy

```css
/* Optimized font loading */
@font-face {
  font-family: 'Inter';
  src: url('inter-variable.woff2') format('woff2');
  font-weight: 300 700;
  font-display: swap;
  font-named-instance: 'Regular';
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('jetbrains-mono.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
```

**Loading Phases**
1. **FOIT Prevention**: `font-display: swap` prevents invisible text
2. **Progressive Enhancement**: System fonts provide immediate rendering
3. **Optimization**: Variable fonts reduce file size and HTTP requests

### Performance Budgets

**Font Loading Targets**
- **Critical fonts**: Load within first 1.5 seconds
- **Secondary fonts**: Load within 3 seconds
- **Total font weight**: Maximum 200KB for primary family

**Rendering Performance**
- **Layout stability**: Consistent sizing prevents cumulative layout shift
- **GPU acceleration**: Avoid font rendering on frequently animated elements
- **Caching strategy**: Long-term caching for font files with version headers

## Testing & Validation

### Automated Testing
- **Contrast validation**: Automated tests verify all text/background combinations
- **Responsive testing**: Typography scales appropriately across breakpoints
- **Performance monitoring**: Font loading times tracked and optimized

### Manual Testing Checklist
- [ ] Typography hierarchy clear at all screen sizes
- [ ] Text remains readable with user zoom up to 200%
- [ ] High contrast mode maintains text visibility
- [ ] Screen reader announces content in logical order
- [ ] Touch targets meet minimum size requirements
- [ ] Font loading graceful with slow connections

## Related Documentation

- **[Style Guide](../style-guide.md)** - Complete design system overview
- **[Spacing System](./spacing.md)** - Layout relationships with typography
- **[Accessibility Guidelines](../../accessibility/guidelines.md)** - WCAG compliance details
- **[Component Specifications](../components/)** - Typography application in components

---

**Last Updated**: January 14, 2025  
**Font Version**: Inter 4.0, JetBrains Mono 2.304  
**Accessibility Standard**: WCAG 2.1 AA