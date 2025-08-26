# Graham Stephens Build - Archived Scoring System

This directory contains all the lead scoring functionality that was removed from the main application on August 19, 2025.

## What's Archived

### Core Scoring Engines (/engines)
- `predictive-scoring-engine.ts` - Main AI prediction system based on Graham's training data
- `content-intelligence-engine.ts` - AI-powered LinkedIn content analysis
- `targeted-learning-engine.ts` - Personalized learning from user feedback
- `enhanced-relevance-scoring.ts` - Enhanced relevance scoring algorithms
- `graham-relevance-scoring.ts` - Graham-specific scoring logic
- `relevance-scoring.ts` - Base relevance scoring functionality
- `feedback-learning-database.ts` - Database layer for feedback learning
- `feedback-loop-system.ts` - Complete feedback loop system
- `performance-optimization.ts` - Performance optimization utilities

### API Endpoints (/api-endpoints)
- `prediction/` - V2 prediction evaluation API
- `training/` - V2 training decision capture API
- `content/` - V2 content analysis API
- `analytics/` - V2 analytics metrics API
- `feedback/` - Complete feedback management API
- `relevance-score/route.ts` - Analysis relevance score endpoint

### UI Components (/ui-components)
- `relevance-score.tsx` - Relevance score display component
- `score-reveal.tsx` - Score reveal animation component
- `content-intelligence-display.tsx` - Content intelligence results display
- `training-feedback-section.tsx` - Training feedback capture UI
- `training-mode-toggle.tsx` - Training mode toggle component
- `analytics-dashboard.tsx` - Analytics dashboard component
- `voice-reasoning-capture.tsx` - Voice reasoning capture component
- `feedback-*.tsx` - All feedback-related UI components

### Tests (/tests)
- `predictive-scoring-engine.unit.test.ts` - Unit tests for prediction engine
- `ai-service-utils.unit.test.ts` - AI service utility tests
- `performance-validation.unit.test.ts` - Performance validation tests
- `api-endpoints.performance.test.ts` - API performance tests

### Database Migrations (/migrations)
- `002_ai_prediction_tables.sql` - Complete AI prediction system tables

### Documentation (/documentation)
- `ai-powered-scoring-system.md` - Overall system design
- `predictive-scoring-engine.md` - Prediction engine documentation
- `content-intelligence-engine.md` - Content intelligence documentation

## Database Tables (Removed)

The following database tables were part of the scoring system:
- `training_decisions` - Graham's training decisions and voice transcriptions
- `decision_patterns` - Learned patterns for predictive scoring
- `prediction_results` - Cached prediction results with performance tracking
- `content_analysis` - AI content analysis results cache
- `prospect_content_summary` - Aggregated content intelligence summaries

## Why Archived

The scoring system was removed to start fresh with a new approach. The system had become complex and the user wanted to begin with a clean foundation for rebuilding scoring functionality.

## Core Features That Remain

The following core LinkedIn research functionality remains in the main application:
- LinkedIn data retrieval via RapidAPI
- Basic profile research functionality
- User management and session functionality
- LinkedIn URL validation and comment extraction
- Prospect profile analysis (without scoring)

## Restoration Notes

If you need to restore any part of this functionality:
1. Review the archived files for the specific functionality needed
2. Check for any dependencies on other archived components
3. Update database migrations if restoring data tables
4. Update imports and references in the main codebase
5. Run tests to ensure functionality works correctly

## Archive Date
August 19, 2025