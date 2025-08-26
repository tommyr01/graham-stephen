---
title: Style Guide - LinkedIn Comment Research Tool
description: Complete design system specifications including colors, typography, spacing, and component guidelines
last-updated: 2025-01-14
version: 1.0.0
related-files: 
  - ../README.md
  - ./tokens/colors.md
  - ./tokens/typography.md
  - ./tokens/spacing.md
  - ./tokens/animations.md
status: draft
---

# Style Guide - LinkedIn Comment Research Tool

## Overview

This comprehensive style guide defines the visual foundation and component system for the LinkedIn Comment Research Tool. It establishes consistent patterns that create an efficient, accessible, and professional user experience focused on helping B2B professionals research LinkedIn commenters effectively.

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Color System](#color-system)
- [Typography System](#typography-system)
- [Spacing & Layout System](#spacing--layout-system)
- [Component Specifications](#component-specifications)
- [Motion & Animation System](#motion--animation-system)
- [Implementation Guidelines](#implementation-guidelines)

## Design Philosophy

### Core Principles

**Dark Mode Foundation**: The interface defaults to a sophisticated dark theme with teal accents, reducing eye strain during extended research sessions while maintaining professional credibility.

**Bold Simplicity**: Clean, focused interfaces that prioritize user tasks over decorative elements. Every element serves a functional purpose in helping users research and assess LinkedIn commenters efficiently.

**Professional Confidence**: Visual design that conveys expertise and reliability, appropriate for B2B sales and recruitment professionals who depend on accurate research insights.

**Cognitive Efficiency**: Strategic use of dark backgrounds, teal highlights, and clear hierarchy that reduce mental load and support rapid decision-making during prospect research.

**Accessibility First**: Universal design principles ensure the tool works for users of all abilities, with high contrast ratios optimized for dark mode, keyboard navigation, and screen reader optimization.

## Color System

### Primary Colors (Teal Accent System)
- **Primary Teal**: `#14B8A6` – Main CTAs, brand elements, success indicators
- **Primary Teal Dark**: `#0D9488` – Hover states, emphasis, pressed buttons
- **Primary Teal Light**: `#5EEAD4` – Subtle highlights, selected states, progress indicators

### Background & Surface Colors (Dark Mode)
- **Background Primary**: `#111827` – Main page background, application foundation
- **Surface Primary**: `#1F2937` – Card backgrounds, elevated surfaces
- **Surface Secondary**: `#374151` – Secondary surfaces, hover states

### Text Colors (Dark Mode Optimized)
- **Text Primary**: `#F3F4F6` – Primary body text, headings
- **Text Secondary**: `#D1D5DB` – Secondary text, labels
- **Text Muted**: `#9CA3AF` – Placeholder text, disabled states
- **Text Maximum**: `#F9FAFB` – Maximum contrast for critical content

### Semantic Colors
- **Success**: `#10B981` – Positive actions, high relevance scores (8-10)
- **Warning**: `#F59E0B` – Caution states, medium relevance (4-7)
- **Error**: `#EF4444` – Errors, low relevance scores (0-3)
- **Info**: `#3B82F6` – Informational messages, neutral content

### Neutral Palette (Dark Mode Foundation)
- **Neutral-900**: `#111827` – Main backgrounds, application foundation
- **Neutral-800**: `#1F2937` – Card backgrounds, primary surfaces
- **Neutral-700**: `#374151` – Secondary surfaces, hover states
- **Neutral-600**: `#4B5563` – Borders, dividers
- **Neutral-500**: `#6B7280` – Secondary text, labels
- **Neutral-400**: `#9CA3AF` – Muted text, placeholders
- **Neutral-300**: `#D1D5DB` – Tertiary text
- **Neutral-200**: `#E5E7EB` – Secondary text light
- **Neutral-100**: `#F3F4F6` – Primary text
- **Neutral-50**: `#F9FAFB` – Maximum contrast text

### Dark Mode Accessibility Notes
- All dark mode color combinations meet WCAG AA standards (4.5:1 normal text, 3:1 large text)
- Teal accents provide excellent contrast on dark backgrounds (7.2:1 ratio)
- Critical interactions maintain 7:1+ contrast ratio for enhanced accessibility
- Color-blind friendly palette verified with Coblis and Stark tools for dark themes
- Never rely on color alone to convey meaning - always include icons or text
- Dark mode reduces eye strain during extended research sessions

## Typography System

### Font Stack
- **Primary**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Monospace**: `'JetBrains Mono', 'SF Mono', Consolas, monospace`

### Font Weights
- **Light**: 300 (reserved for large display text)
- **Regular**: 400 (body text, standard UI elements)
- **Medium**: 500 (button text, emphasized content)
- **Semibold**: 600 (card headings, section titles)
- **Bold**: 700 (page titles, critical information)

### Type Scale
- **H1**: `32px/1.2, 700, -0.025em` – Page titles, main feature headings
- **H2**: `24px/1.3, 600, -0.02em` – Section headers, card titles
- **H3**: `20px/1.4, 600, -0.015em` – Subsection headers, modal titles
- **H4**: `18px/1.4, 500, -0.01em` – Card subtitles, form sections
- **H5**: `16px/1.5, 500, 0em` – Minor headers, table headers
- **Body Large**: `18px/1.6` – Feature descriptions, important content
- **Body**: `16px/1.5` – Standard UI text, form labels
- **Body Small**: `14px/1.4` – Secondary information, captions
- **Caption**: `12px/1.3` – Metadata, timestamps, footnotes
- **Label**: `14px/1.4, 500, uppercase, 0.05em` – Form labels, tags
- **Code**: `14px/1.4, monospace` – API responses, technical content

### Responsive Typography
- **Mobile** (320-767px): Reduce H1 to 28px, H2 to 22px for better readability
- **Tablet** (768-1023px): Maintain standard scale with optimized line lengths
- **Desktop** (1024px+): Full scale with max line length of 65 characters
- **Wide** (1440px+): Increase body text to 18px for improved readability

## Spacing & Layout System

### Base Unit
`8px` - All spacing derives from this base unit for mathematical consistency

### Spacing Scale
- **xs**: `4px` (base × 0.5) – Micro spacing, icon gaps, tight element separation
- **sm**: `8px` (base × 1) – Small spacing, internal padding, form field gaps
- **md**: `16px` (base × 2) – Default spacing, card padding, standard margins
- **lg**: `24px` (base × 3) – Medium spacing, section separation, content blocks
- **xl**: `32px` (base × 4) – Large spacing, major component separation
- **2xl**: `48px` (base × 6) – Extra large spacing, page margins, hero sections
- **3xl**: `64px` (base × 8) – Huge spacing, major layout divisions

### Grid System
- **Columns**: 12 (desktop), 8 (tablet), 4 (mobile)
- **Gutters**: 24px (desktop), 16px (tablet), 12px (mobile)
- **Margins**: 32px (desktop), 24px (tablet), 16px (mobile)
- **Container max-widths**: 1200px (wide), 1024px (desktop), 768px (tablet)

### Breakpoints
- **Mobile**: 320px – 767px (priority: touch interactions, simplified navigation)
- **Tablet**: 768px – 1023px (priority: adaptive layouts, mixed interactions)
- **Desktop**: 1024px – 1439px (priority: efficiency, keyboard optimization)
- **Wide**: 1440px+ (priority: content density, advanced features)

## Component Specifications

### Buttons

**Primary Button (Dark Mode)**
- **Height**: `44px` (touch-friendly)
- **Padding**: `12px 24px` (horizontal padding adjusts with content)
- **Border Radius**: `8px` (consistent with card styling)
- **Typography**: Body, Medium (500)
- **Background**: Primary teal (`#14B8A6`)
- **Text Color**: Dark (`#111827`) for maximum contrast
- **States**:
  - Default: Teal background, dark text
  - Hover: Primary Teal Dark background (`#0D9488`), subtle shadow
  - Active: Primary Teal Dark background, inner shadow
  - Focus: 2px outline (`#14B8A6`), 2px offset
  - Disabled: Neutral-600 background, Neutral-400 text
  - Loading: Spinner + "Processing..." text

**Secondary Button (Dark Mode)**
- **Height**: `44px`
- **Padding**: `12px 24px`
- **Border**: `1px solid #14B8A6`
- **Background**: Transparent
- **Text Color**: Primary teal (`#14B8A6`)
- **States**:
  - Hover: Subtle teal background (`rgba(20, 184, 166, 0.1)`)
  - Active: Teal background, dark text
  - Focus: Same as primary button
  - Disabled: Neutral-600 border, Neutral-400 text

### Form Elements

**Input Fields**
- **Height**: `44px` (consistent with buttons)
- **Padding**: `12px 16px`
- **Border**: `1px solid #D1D5DB` (Neutral-300)
- **Border Radius**: `6px` (slightly smaller than buttons)
- **Typography**: Body (16px) for accessibility
- **Placeholder**: Neutral-400 (`#9CA3AF`)
- **States**:
  - Focus: Primary border (`#0066CC`), subtle box-shadow
  - Error: Error border (`#EF4444`), error text below
  - Success: Success border (`#10B981`), success icon
  - Disabled: Neutral-100 background, Neutral-400 text

### Cards

**Default Card (Dark Mode)**
- **Background**: Surface (`#1F2937`)
- **Border**: `1px solid #4B5563` (Neutral-600)
- **Border Radius**: `12px` (generous for modern feel)
- **Shadow**: `0 1px 3px rgba(0, 0, 0, 0.3)` (subtle elevation for dark mode)
- **Padding**: `24px` (comfortable internal spacing)
- **Hover State**: Background lightens to `#374151`, subtle shadow increase
- **Interactive State**: Teal border (`#14B8A6`) on selection

**Commenter Card (Feature-Specific)**
- **Height**: `120px` (collapsed), `auto` (expanded)
- **Layout**: Avatar (left), Content (center), Actions (right)
- **Transition**: `300ms ease-in-out` for expansion
- **States**:
  - Collapsed: Basic profile information visible
  - Expanded: Research results, posts, relevance score
  - Loading: Skeleton animation while fetching data

### Navigation

**Main Navigation Bar (Dark Mode)**
- **Height**: `64px` (standard web app header)
- **Background**: Surface (`#1F2937`) with subtle shadow
- **Border**: Bottom border `1px solid #4B5563`
- **Logo**: Left-aligned, 32px height
- **Actions**: Right-aligned, consistent spacing
- **Text Color**: Primary text (`#F3F4F6`)
- **Responsive**: Hamburger menu below 768px

## Motion & Animation System

### Timing Functions
- **Ease-out**: `cubic-bezier(0.0, 0, 0.2, 1)` – Element entrances, expansions
- **Ease-in-out**: `cubic-bezier(0.4, 0, 0.6, 1)` – State transitions, movements
- **Spring**: `cubic-bezier(0.34, 1.56, 0.64, 1)` – Playful interactions, success states

### Duration Scale
- **Micro**: `150ms` – State changes, hover effects, button presses
- **Short**: `300ms` – Card expansions, dropdown menus, local transitions
- **Medium**: `500ms` – Page transitions, modal appearances, complex state changes
- **Long**: `800ms` – Onboarding flows, guided tours, complex animations

### Animation Principles
- **Purpose-Driven**: Every animation serves a functional purpose (feedback, guidance, spatial relationships)
- **Performance First**: Hardware acceleration preferred, 60fps minimum
- **Accessibility Aware**: Respect `prefers-reduced-motion` setting
- **Consistent Timing**: Similar actions use similar durations and easing

### Common Animation Patterns
- **Card Expansion**: Scale from center point, stagger child elements
- **Loading States**: Skeleton screens with subtle pulse animation
- **Success Feedback**: Brief scale bounce + color transition
- **Error Shake**: Gentle horizontal shake (2px amplitude)
- **Page Transitions**: Fade with subtle vertical movement

## Implementation Guidelines

### CSS Custom Properties (Design Tokens)

```css
:root {
  /* Colors */
  --color-primary: #0066CC;
  --color-primary-dark: #004499;
  --color-primary-light: #E6F3FF;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  
  /* Typography */
  --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-h1: 2rem;
  --font-size-body: 1rem;
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Animation */
  --duration-micro: 150ms;
  --duration-short: 300ms;
  --ease-out: cubic-bezier(0.0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.6, 1);
}
```

### Component Development Standards
- **Semantic HTML**: Use appropriate HTML elements for accessibility
- **Component Props**: Support all defined states and variants
- **Focus Management**: Proper tab order and focus indicators
- **Error Handling**: Graceful degradation for failed states
- **Performance**: Lazy loading for non-critical components

### Quality Assurance Checklist

**Visual Consistency**
- [ ] Colors match defined palette exactly
- [ ] Typography follows established scale and weights
- [ ] Spacing uses defined scale consistently
- [ ] Components match state specifications
- [ ] Animation timing follows defined durations

**Accessibility Compliance**
- [ ] Color contrast ratios verified (4.5:1 minimum)
- [ ] Focus indicators visible and consistent
- [ ] Keyboard navigation complete and logical
- [ ] Screen reader labels accurate and helpful
- [ ] Motion respects reduced-motion preferences

**Responsive Behavior**
- [ ] Breakpoint behavior matches specifications
- [ ] Touch targets meet 44px minimum size
- [ ] Content reflows appropriately at all sizes
- [ ] Typography scales according to responsive rules
- [ ] Navigation adapts properly for mobile

## Related Documentation

- **[Color System Details](./tokens/colors.md)** - Extended color specifications and usage guidelines
- **[Typography System](./tokens/typography.md)** - Complete type scale and implementation details
- **[Spacing System](./tokens/spacing.md)** - Layout grid and spacing applications
- **[Component Library](./components/)** - Individual component specifications
- **[Animation System](./tokens/animations.md)** - Motion design and implementation
- **[Accessibility Guidelines](../accessibility/guidelines.md)** - WCAG compliance requirements

## Implementation Notes

This design system prioritizes:
1. **Rapid Development**: Consistent patterns reduce decision-making overhead
2. **Quality Assurance**: Clear specifications prevent inconsistencies
3. **Accessibility**: Built-in compliance reduces retrofitting needs
4. **Maintainability**: Systematic approach simplifies updates and extensions

All components should be developed with these principles in mind, ensuring the final product delivers a cohesive, professional experience that helps users accomplish their research goals efficiently.

---

**Last Updated**: January 14, 2025  
**Version**: 1.0.0  
**Status**: Draft - Ready for development team review