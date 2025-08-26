---
title: Training Dashboard Screen States and Visual Specifications
description: Complete screen-by-screen specifications for the training dashboard including all states, responsive breakpoints, and visual designs
feature: training-dashboard
last-updated: 2025-01-19
version: 1.0.0
related-files: 
  - ./README.md
  - ./user-journey.md
  - ./interactions.md
  - ../../design-system/style-guide.md
status: draft
---

# Training Dashboard Screen States and Visual Specifications

## Screen Architecture Overview

The Training Dashboard consists of 6 primary screens with multiple states and responsive variants. All screens follow the established dark mode design system with teal accents and maintain consistent navigation patterns.

### Screen Hierarchy
```
Training Dashboard
├── Overview Dashboard (Landing)
├── AI Learning Progress
├── Pattern Discovery Management  
├── Direct Training Interface
├── Personal Intelligence Profile
└── System Performance Analytics
```

## Screen 1: Overview Dashboard (Landing)

**Purpose**: Primary landing page that provides comprehensive training system status and quick access to all training activities.

### Default State

**Layout Structure**:
- **Header**: Consistent with main app navigation, adds "Training Dashboard" breadcrumb
- **Hero Section**: System health overview with key metrics and recent achievements  
- **Quick Actions Bar**: Primary training actions with estimated time/impact
- **Recent Activity Feed**: Timeline of recent learning events and improvements
- **Pending Actions Cards**: Patterns awaiting validation, training opportunities

**Visual Design Specifications**:

#### Header Section
- **Background**: Surface Primary (`#1F2937`) with subtle shadow
- **Typography**: H1 "Training Dashboard", Body text for description
- **Color**: Primary text (`#F3F4F6`) with Secondary text (`#D1D5DB`) for description
- **Spacing**: 32px top/bottom padding, 24px horizontal padding
- **Elements**: 
  - Title with brain icon (Primary Teal `#14B8A6`)
  - Last updated timestamp (Text Muted `#9CA3AF`)
  - Auto-refresh indicator with animated pulse for active status

#### Hero Metrics Section  
- **Layout**: 4-column grid on desktop, 2x2 on tablet, vertical stack on mobile
- **Card Specifications**:
  - Background: Surface Primary (`#1F2937`) 
  - Border: 1px solid Neutral-600 (`#4B5563`)
  - Border Radius: 12px
  - Padding: 24px
  - Shadow: `0 1px 3px rgba(0, 0, 0, 0.3)`

**Metric Card Content**:
- **System Health Score**: Large text (H1 size) with health color coding
  - 90%+ = Success green (`#10B981`)  
  - 70-89% = Warning yellow (`#F59E0B`)
  - <70% = Error red (`#EF4444`)
- **Patterns Discovered This Week**: Number with trend indicator
- **Training Actions Completed**: Number with personal vs. team comparison
- **Accuracy Improvement**: Percentage with time period context

#### Quick Actions Bar
- **Layout**: Horizontal scrolling card layout with primary actions
- **Card Specifications**:  
  - Width: 280px minimum, auto-expand for content
  - Height: 140px
  - Background: Gradient from Primary Teal Light to Primary Teal  
  - Border Radius: 16px (more rounded for emphasis)
  - Hover: Scale transform (1.02) with shadow increase

**Action Card Content**:
- **Voice Training**: Microphone icon, "5 min training", estimated impact
- **Validate Patterns**: Badge with count, "Review patterns", time estimate  
- **Upload Examples**: Upload icon, "Bulk training", batch size indicator
- **View Progress**: Chart icon, "See improvements", recent milestone

#### Recent Activity Feed
- **Layout**: Timeline interface with chronological learning events
- **Timeline Specifications**:
  - Left-aligned timestamps (Caption typography)
  - Central timeline line (2px, Primary Teal `#14B8A6`)  
  - Right-aligned content cards with connecting dots
- **Event Card Specifications**:
  - Background: Surface Secondary (`#374151`) 
  - Border: None (clean timeline appearance)
  - Border Radius: 8px
  - Padding: 16px
  - Hover: Background lightens to Neutral-600

**Activity Types**:
- **Pattern Discovery**: "AI discovered new pattern from your feedback on..."
- **Training Completion**: "Your training improved accuracy by X%"  
- **Validation Action**: "You approved/rejected pattern affecting Y recommendations"
- **Milestone Achievement**: "Your AI reached 90% accuracy milestone"

### Loading State

**Visual Treatment**:
- **Skeleton Animation**: Pulsing rectangles for metric cards and activity items
- **Animation**: Gentle pulse using opacity 0.6 to 1.0 over 2 seconds
- **Preservation**: Maintain layout structure during loading
- **Indicators**: Loading spinner for real-time metrics with "Calculating improvements..." text

### Error State

**Error Handling**:
- **Partial Errors**: Show available data with error badges for failed sections
- **Complete Failure**: Full-screen error with retry mechanism and contact support
- **Network Issues**: Offline indicator with "Last updated" timestamp
- **Data Issues**: Clear messaging about missing information with alternative actions

### Empty State (New User)

**First Visit Experience**:
- **Hero Message**: "Welcome to Training Dashboard - Help Your AI Learn"
- **Onboarding Cards**: Step-by-step introduction to training capabilities
- **Sample Data**: Mockup metrics showing potential improvements
- **Call-to-Action**: "Start Your First Training Session" with guided wizard

### Responsive Specifications

#### Mobile (320-767px)
- **Header**: Compressed with hamburger menu for secondary navigation  
- **Hero Metrics**: Vertical stack with full-width cards
- **Quick Actions**: Horizontal scroll with card snapping
- **Activity Feed**: Simplified timeline with condensed information

#### Tablet (768-1023px)  
- **Hero Metrics**: 2x2 grid layout with adequate spacing
- **Quick Actions**: 2x2 grid instead of horizontal scroll
- **Activity Feed**: Dual-column timeline with more content detail

#### Desktop (1024-1439px)
- **Full Layout**: Complete 4-column hero, horizontal actions bar
- **Sidebar Navigation**: Secondary training navigation for efficiency
- **Extended Content**: More detailed activity descriptions and metrics

#### Wide Screen (1440px+)
- **Expanded Layout**: Larger cards with additional context information
- **Side Panel**: Live training suggestions and system recommendations  
- **Advanced Analytics**: Additional metric visualizations and trends

## Screen 2: AI Learning Progress

**Purpose**: Detailed visualization of how the AI system has evolved over time with concrete examples of improvements.

### Default State

**Layout Structure**:
- **Progress Timeline**: Interactive timeline showing learning milestones
- **Before/After Comparison**: Side-by-side examples of recommendation improvements
- **Accuracy Trends**: Charts showing confidence and accuracy improvements over time
- **Personal Impact**: Individual user's contribution to system learning

**Visual Design Specifications**:

#### Progress Timeline Section
- **Layout**: Horizontal timeline with major milestones and detailed exploration
- **Timeline Specifications**:
  - Height: 120px for main timeline rail
  - Background: Gradient from Neutral-800 to Neutral-700
  - Milestone Markers: 16px circles in Primary Teal with pulse animation
  - Connection Lines: 4px in Primary Teal with fade-out at edges

**Milestone Types**:
- **Accuracy Milestones**: "Reached 85% accuracy" with celebration animation
- **Pattern Discoveries**: "Discovered pattern: Users prefer 5+ years experience"  
- **Training Achievements**: "100 training examples processed"
- **User Contributions**: "Your feedback improved SaaS prospect detection"

#### Before/After Comparison Section  
- **Layout**: Split-screen comparison with clear visual separation
- **Card Specifications**:
  - **Before**: Background with Error tint (`rgba(239, 68, 68, 0.1)`)
  - **After**: Background with Success tint (`rgba(16, 185, 129, 0.1)`)  
  - Arrow transition animation between states
  - Border: 1px solid respective color (red/green)

**Comparison Content**:
- **Prospect Examples**: Side-by-side profile summaries with old vs. new recommendations
- **Confidence Scores**: Visual confidence meters showing improvement
- **Recommendation Text**: Before/after AI reasoning with highlighted improvements
- **User Feedback**: Original feedback that drove the improvement

#### Accuracy Trends Charts
- **Chart Types**: Line charts for trends, bar charts for categorical improvements
- **Color Scheme**: Primary Teal for main data, Success green for positive trends
- **Interactive Elements**: Hover tooltips with detailed metrics and context
- **Time Controls**: Date range selector for different time periods

### Interactive State

**Timeline Exploration**:
- **Milestone Click**: Expandable detail cards with full improvement context
- **Date Range**: Slider control for exploring different time periods
- **Filter Options**: Filter by improvement type, user contribution, pattern category

**Before/After Interaction**:
- **Prospect Examples**: Click to see full prospect profile and analysis
- **Improvement Details**: Expandable sections showing training data that drove change
- **Impact Metrics**: Hover states showing quantified improvement measurements

### Mobile Responsive Adaptations

#### Mobile Layout Changes
- **Timeline**: Vertical timeline instead of horizontal for better mobile interaction
- **Before/After**: Stacked layout with clear section separation and swipe gestures
- **Charts**: Simplified mobile-optimized chart views with tap interactions

## Screen 3: Pattern Discovery Management

**Purpose**: Interface for reviewing, validating, and managing patterns discovered by the AI system.

### Default State

**Layout Structure**:
- **Pattern Status Overview**: Summary metrics of patterns by status
- **Pending Validation Queue**: Cards for patterns awaiting user review
- **Pattern Detail Interface**: Expandable detailed view for pattern analysis
- **Validation History**: Timeline of previously validated/rejected patterns

**Visual Design Specifications**:

#### Pattern Status Overview
- **Layout**: Horizontal metrics bar with status-based color coding  
- **Metrics Cards**:
  - **Pending**: Warning yellow (`#F59E0B`) with count and urgency indicator
  - **Validated**: Success green (`#10B981`) with approval rate
  - **Testing**: Info blue (`#3B82F6`) with A/B testing status  
  - **Rejected**: Neutral gray with reasoning statistics

#### Pending Validation Cards
- **Card Layout**: 
  - Width: 100% on mobile, 48% on tablet, 32% on desktop  
  - Background: Surface Primary with colored left border (4px) indicating confidence
  - Border Radius: 12px
  - Padding: 24px  
  - Hover: Subtle elevation increase with teal accent glow

**Card Content Structure**:
- **Header**: Pattern title with confidence score badge
- **Description**: Natural language explanation of discovered pattern
- **Evidence Section**: Sample feedback that led to pattern discovery
- **Impact Preview**: Expected improvement from pattern implementation
- **Action Buttons**: Approve (Primary Teal), Reject (Error), Need More Info (Secondary)

#### Pattern Detail Modal  
- **Trigger**: Click on pattern card for detailed analysis
- **Modal Specifications**:
  - Width: 80vw on desktop, 95vw on mobile
  - Max-width: 800px
  - Background: Surface Primary with overlay backdrop
  - Border Radius: 16px
  - Animation: Scale-in from center with backdrop fade

**Detail Content**:
- **Pattern Analysis**: Comprehensive explanation with supporting data visualization
- **Evidence Timeline**: Chronological user feedback that contributed to discovery
- **Impact Simulation**: Preview of recommendations before/after pattern implementation
- **Similar Patterns**: Related patterns for context and consistency checking

### Pattern Validation States

#### Approval Flow
- **Confirmation**: "Are you sure? This pattern will affect X% of recommendations"
- **Success Feedback**: Checkmark animation with "Pattern approved! Changes will take effect in 2-4 hours"
- **Impact Tracking**: Automatic follow-up scheduled to monitor pattern performance

#### Rejection Flow  
- **Reasoning Capture**: Optional text input for rejection reasoning
- **Confirmation**: "Pattern rejected. This improves future pattern discovery quality"
- **Learning Integration**: Rejection reasoning used to improve pattern discovery algorithm

#### Need More Info State
- **Information Request**: Form for specifying what additional information is needed
- **Expert Consultation**: Option to escalate to AI team for complex patterns
- **Postpone Option**: Save for later review with reminder scheduling

## Screen 4: Direct Training Interface

**Purpose**: Comprehensive interface for users to directly train the AI system through multiple input methods.

### Default State

**Layout Structure**:
- **Training Method Selection**: Cards for different training approaches
- **Active Training Interface**: Dynamic interface based on selected training method
- **Training Progress Tracking**: Real-time feedback on training processing
- **Training History**: Log of previous training sessions and their impact

**Visual Design Specifications**:

#### Training Method Cards
- **Layout**: 2x2 grid on desktop, vertical stack on mobile
- **Card Specifications**:
  - Height: 160px for adequate content and touch targets
  - Background: Surface Secondary with gradient overlay on hover
  - Border: 2px solid transparent, Primary Teal on selection
  - Border Radius: 16px
  - Icon: 48px with semantic color coding

**Training Methods**:
- **Voice Training**: Microphone icon, "Natural conversation", "5-15 minutes" estimate
- **Example Upload**: Upload icon, "Prospect examples", "Bulk processing" capability
- **Scenario Training**: Checklist icon, "Guided scenarios", "Step-by-step" process  
- **Pattern Feedback**: Brain icon, "Review decisions", "Quick validation" flow

#### Voice Training Interface
- **Integration**: Enhanced version of existing voice feedback component
- **Visual Enhancements**:
  - Larger recording interface optimized for training sessions
  - Multi-round conversation support with conversation history
  - Real-time transcription with training insight extraction
  - Progress tracking for comprehensive training sessions

**Training Conversation Flow**:
- **AI Prompts**: "Tell me about a prospect you'd definitely want to contact"
- **User Response**: Voice input with live transcription and confidence scoring  
- **AI Processing**: "I understand you value X, Y, Z characteristics"
- **Confirmation**: User validates AI understanding before proceeding to next example

#### Example Upload Interface
- **Upload Zone**: 
  - Height: 200px with drag-and-drop visual cues
  - Background: Dashed border with Primary Teal accent
  - States: Default, drag-over highlight, uploading progress, success/error
- **Template Support**: CSV template download with example data
- **Batch Processing**: Progress bar with individual example validation

**Upload Content Structure**:
- **Prospect Examples**: CSV with prospect data and user decision (contact/skip)
- **Reasoning**: Optional text field for decision reasoning
- **Context**: Industry, role, territory information for better training
- **Impact Estimation**: System calculates expected improvement from upload

#### Training Progress Visualization
- **Real-time Processing**: Progress indicators for training example processing
- **Impact Estimation**: Live calculation of training impact on recommendation accuracy
- **Confidence Building**: Visual representation of AI learning from examples
- **Completion Celebration**: Success animation and impact summary upon completion

### Training Session States

#### Active Training State
- **Session Timer**: Clear indication of training session duration
- **Progress Tracking**: Examples processed, patterns learned, estimated impact
- **Pause/Resume**: Ability to pause training session and resume later
- **Auto-save**: Continuous saving of training progress to prevent data loss

#### Processing State  
- **Visual Feedback**: Animated processing indicators with descriptive text
- **Queue Status**: "Processing example 5 of 12" with time estimates
- **Error Handling**: Clear error messaging with correction opportunities
- **Partial Success**: Ability to process some examples even if others fail

#### Completion State
- **Success Summary**: Comprehensive overview of training session results
- **Impact Preview**: Estimated improvement in recommendation accuracy
- **Next Steps**: Suggestions for follow-up training or validation activities
- **Sharing Options**: Share training results with team or export for records

## Screen 5: Personal Intelligence Profile

**Purpose**: Individual user's AI learning profile showing personalization, preferences, and training history.

### Default State

**Layout Structure**:  
- **Profile Overview**: Personal AI statistics and learning summary
- **Learning Patterns**: Visual representation of discovered personal preferences
- **Training History**: Chronological log of user's training contributions
- **Personalization Settings**: Controls for AI behavior customization

**Visual Design Specifications**:

#### Profile Overview Section
- **Layout**: Hero card with personal metrics and learning achievements
- **Profile Card**:
  - Background: Gradient from Primary Teal Light to Surface Primary
  - Border Radius: 20px for friendly, personal feel
  - Padding: 32px for spacious, comfortable layout
  - Typography: Larger text sizes for personal, important information

**Personal Metrics**:
- **AI Accuracy For Me**: Large percentage with comparison to team/system average
- **Training Contributions**: Number of examples provided with impact scoring
- **Learning Confidence**: Personal AI confidence trend over time
- **Personalization Level**: Percentage showing how customized the AI is for user

#### Personal Learning Patterns  
- **Visualization**: Interactive visual map of discovered preferences
- **Pattern Cards**:
  - Circular/bubble layout showing pattern strength and confidence
  - Color coding by pattern category (experience, industry, role, etc.)
  - Size indicates pattern strength and impact on recommendations
  - Click to expand for detailed pattern explanation and examples

**Pattern Categories**:
- **Experience Preferences**: "Prefers 5+ years experience" with confidence score
- **Industry Focus**: "Strong preference for SaaS companies" with examples
- **Role Specificity**: "Focuses on senior-level positions" with impact metrics
- **Geographic Patterns**: "Primarily contacts North American prospects"

#### Training History Timeline
- **Layout**: Vertical timeline with personal training events
- **Event Types**:
  - **Voice Training Sessions**: Duration, examples provided, impact achieved
  - **Example Uploads**: Number of examples, processing success rate, learning outcomes
  - **Pattern Validations**: Patterns approved/rejected with reasoning
  - **Feedback Contributions**: Individual feedback that improved system-wide accuracy

### Personalization Control States

#### Settings Interface
- **Preference Controls**: Sliders and toggles for AI behavior customization
- **Training Priorities**: Weight settings for different types of learning
- **Feedback Preferences**: How user prefers to provide training (voice, text, examples)
- **Notification Settings**: Training opportunities, pattern validations, improvement alerts

#### Customization Impact Preview
- **Before/After**: Show how personalization settings change recommendations
- **Confidence Impact**: Display effect of customization on AI confidence scores
- **Team Comparison**: Show personal settings vs. team average settings
- **Reset Options**: Ability to reset to defaults or team standards

## Screen 6: System Performance Analytics

**Purpose**: Comprehensive system-wide analytics showing overall training effectiveness and performance metrics.

### Default State

**Layout Structure**:
- **Performance Overview**: System-wide health and performance metrics
- **Training Impact Analytics**: Charts showing correlation between training and improvements
- **User Participation Metrics**: Team engagement with training activities
- **System Insights**: AI-generated insights about training effectiveness

**Visual Design Specifications**:

#### Performance Metrics Dashboard
- **Layout**: Grid of metric cards with integrated charts and trends
- **Chart Specifications**:
  - Color scheme: Primary Teal for main metrics, Success green for positive trends
  - Interactive tooltips with detailed breakdown of metrics
  - Time range controls for historical analysis
  - Export options for data analysis and reporting

**Key Metrics**:
- **Overall System Accuracy**: Trend line with training event correlations
- **Pattern Quality Score**: Validation success rate and pattern effectiveness
- **User Training Participation**: Activity levels and contribution quality
- **Recommendation Confidence**: Average confidence scores with trend analysis

#### Training Effectiveness Analysis
- **Correlation Charts**: Visual representation of training activity impact on accuracy
- **ROI Calculations**: Training time investment vs. accuracy improvement returns
- **Pattern Success Tracking**: Performance of validated patterns over time  
- **User Impact Ranking**: Top contributing users and their training effectiveness

### Analytics Interaction States

#### Drill-Down Analysis
- **Metric Exploration**: Click metrics for detailed breakdown and historical trends
- **Filter Controls**: Date ranges, user segments, pattern categories, training types
- **Comparison Tools**: Before/after analysis for specific training initiatives
- **Export Functions**: Data export for external analysis and reporting

#### Real-time Monitoring
- **Live Updates**: Real-time metrics during active training sessions
- **Alert System**: Notifications for significant performance changes or milestones
- **System Health Monitoring**: Real-time status of AI learning components
- **Performance Predictions**: Forecasting based on current training trends

---

## Cross-Screen Design Consistency

### Navigation Patterns
- **Persistent Header**: Consistent navigation with clear location indicators
- **Secondary Navigation**: Tab-based or sidebar navigation for training sections
- **Breadcrumbs**: Clear hierarchical navigation for complex workflows
- **Quick Actions**: Consistent placement of primary actions across screens

### Visual Language Consistency
- **Color Application**: Consistent use of teal for primary actions, semantic colors for status
- **Typography Hierarchy**: Uniform text sizing and weight across all training interfaces
- **Card Design**: Consistent card specifications and interaction patterns
- **Animation Timing**: Uniform transition timing and easing across all interactions

### State Management
- **Loading States**: Consistent skeleton screens and loading indicators
- **Error States**: Uniform error messaging and recovery options
- **Empty States**: Consistent messaging and call-to-action patterns
- **Success States**: Unified celebration and confirmation patterns

### Responsive Design Principles
- **Mobile-first**: All interfaces designed for mobile interaction first
- **Progressive Enhancement**: Additional features and detail at larger breakpoints
- **Touch Optimization**: Adequate touch targets and gesture-friendly interfaces
- **Content Priority**: Most important content and actions prioritized on smaller screens

---

**Implementation Priority**: Start with Overview Dashboard and Pattern Validation interfaces as these provide immediate value, then expand to comprehensive training interfaces and analytics.