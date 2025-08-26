# AI Training System - User Guide

## Overview
The AI Training System allows you to train the AI to better understand your preferences and improve its accuracy in identifying relevant prospects. The system learns from your feedback and continuously improves its recommendations.

## Getting Started

### 1. Access the Training Dashboard
Navigate to `/training` in your browser to access the main training dashboard.

### 2. Understanding the Dashboard
The dashboard provides several key sections:

#### Key Metrics
- **Total Feedback**: Number of feedback interactions recorded
- **Accuracy Boost**: Improvement in AI accuracy since training began  
- **New Patterns**: AI-discovered patterns awaiting your review
- **Confidence**: Overall system confidence in its predictions
- **Last Update**: When the system was last updated with new data

#### Training Mode Toggle
- Toggle this ON to enable active learning from your interactions
- When enabled, the AI will learn from every action you take
- When disabled, training is paused but existing models remain active

## Training Methods

### 1. Voice Training
Voice training allows you to speak naturally about your ideal prospects.

**How to Use Voice Training:**
1. Click the "Voice Training" button or go to the Voice Training tab
2. Click the record button (microphone icon) 
3. Speak naturally for 10-60 seconds about:
   - What makes a good prospect for you
   - Industry preferences  
   - Role/seniority requirements
   - Company size preferences
   - Experience requirements
   - Any other criteria that matter to you

**Example Voice Training Session:**
> "I'm looking for VP of Engineering candidates who have experience scaling teams at fast-growing SaaS companies. They should have a strong technical background but also proven leadership skills. I particularly value candidates who have worked at companies that have gone through hypergrowth phases and can handle the challenges that come with rapid scaling."

**What Happens Next:**
- Your speech is transcribed automatically
- The system extracts key insights and preferences
- These insights are used to improve future recommendations
- You can see the extracted insights in the dashboard

### 2. Pattern Validation
The AI continuously discovers patterns in successful prospects and asks for your validation.

**How to Validate Patterns:**
1. Go to the "Pattern Validation" tab
2. Review each discovered pattern
3. For each pattern, you can:
   - **Approve**: This pattern accurately reflects your preferences
   - **Reject**: This pattern is incorrect or not important to you

**Example Patterns You Might See:**
- "VP Engineering with 5+ years at high-growth SaaS companies" (Boost +3.2 points)
- "Active in technical communities with detailed answers" (Boost +2.7 points)  
- "Posts primarily motivational quotes without technical content" (Reduce -2.1 points)

**Pattern Information:**
- **Confidence**: How sure the AI is about this pattern (0-100%)
- **Samples**: Number of examples supporting this pattern
- **Impact**: How much this pattern affects scoring (+/- points)
- **Evidence**: Specific examples from your past interactions

### 3. Personal Intelligence Monitoring
Track how the AI is learning about your specific preferences.

**What You Can See:**
- **Learning Progress**: Your accuracy improvement over time
- **Preferred Industries**: Industries the AI has learned you prefer
- **Success Patterns**: Behavioral patterns the AI has identified
- **Growth Opportunities**: Areas where the AI could improve

## Best Practices

### For Voice Training:
1. **Be Specific**: Instead of "good candidates," say "VP-level technical leaders with 5+ years experience"
2. **Include Context**: Mention why certain criteria matter to you
3. **Be Consistent**: Regular training sessions help the AI learn faster
4. **Natural Speech**: Speak conversationally, don't read scripts

### For Pattern Validation:
1. **Review Carefully**: Take time to understand what each pattern means
2. **Consider Context**: A pattern might be right for some situations but not others
3. **Be Decisive**: Clear approve/reject decisions help the AI learn faster
4. **Check Evidence**: Look at the supporting examples to validate patterns

## System Reset Options

If you want to start fresh or reset specific aspects of your training:

### Reset Training Data
**⚠️ WARNING: This action cannot be undone**

1. Click "Reset Training Data" in the Quick Actions section
2. Choose reset type:
   - **All**: Reset everything (feedback, patterns, profiles)
   - **Patterns**: Reset only discovered patterns
   - **Feedback**: Reset only feedback interactions  
   - **User Profiles**: Reset only your personal intelligence profile

3. Confirm by entering the provided confirmation code
4. The system will be reset and ready for fresh training

**When to Reset:**
- Your preferences have significantly changed
- You want to start training from scratch
- The AI has learned incorrect patterns you can't fix
- You're onboarding the system for a new user/role

## Understanding System Performance

### Metrics to Monitor:
- **Accuracy Improvement**: Should trend upward over time
- **Confidence Score**: Should increase as training progresses  
- **Pattern Discovery Rate**: New useful patterns should be discovered regularly
- **Processing Speed**: System should maintain fast response times

### Signs of Good Training:
- Steady accuracy improvements
- Relevant patterns being discovered
- High confidence scores (80%+)
- Consistent voice training sessions
- Regular pattern validation

### Troubleshooting:
- **Low Accuracy**: Provide more diverse training examples
- **Irrelevant Patterns**: More carefully validate/reject bad patterns  
- **Slow Learning**: Increase frequency of training sessions
- **System Errors**: Contact support or reset if issues persist

## Advanced Features

### Export Analytics
Export your training data and performance metrics for analysis or backup.

### Import Training Data
Bulk import training data from previous sessions or other sources.

### Performance Monitoring
Track system performance over time and identify optimization opportunities.

## Privacy and Data

### What Data is Stored:
- Voice recordings (for transcription only)
- Transcript text of your feedback
- Pattern approvals/rejections
- Performance metrics
- Personal preference profiles

### Data Security:
- All voice recordings are processed locally when possible
- Sensitive data is encrypted at rest
- You can delete your training data at any time
- Data is used only to improve your AI experience

### Data Retention:
- Voice recordings: Stored for analysis but can be deleted
- Transcripts: Kept for ongoing learning
- Metrics: Retained for performance tracking
- User preferences: Maintained until manually reset

## Support

For technical issues or questions about the training system:
1. Check the Performance tab for system health indicators
2. Review recent activity logs for error messages  
3. Try resetting specific components if issues persist
4. Contact support with specific error messages or behavior descriptions

## Getting the Best Results

### Training Schedule:
- **Week 1-2**: Daily voice training sessions (5-10 minutes)
- **Week 3-4**: Regular pattern validation as patterns are discovered
- **Ongoing**: Weekly voice training + pattern validation as needed

### Success Metrics:
- Target 80%+ accuracy improvement after 2 weeks
- 90%+ confidence scores after 1 month
- 5-10 validated patterns after 2 weeks
- Consistent positive feedback on prospect relevance

---

## Quick Reference

### Training Dashboard URL
`/training`

### API Endpoints (for developers)
- `GET /api/training/metrics` - Get training metrics
- `GET /api/training/patterns` - Get discovered patterns  
- `POST /api/training/patterns` - Approve/reject patterns
- `POST /api/voice-feedback/submit` - Submit voice training
- `POST /api/training/reset` - Reset training data

### Keyboard Shortcuts
- Voice training: Click and hold spacebar to record
- Pattern approval: Click "Approve" or press "A"
- Pattern rejection: Click "Reject" or press "R"

This guide will help you get the most out of the AI Training System. The key to success is consistent, specific feedback that helps the AI understand your unique preferences and requirements.