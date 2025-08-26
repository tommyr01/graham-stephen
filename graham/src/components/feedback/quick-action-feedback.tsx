/**
 * Quick Action Feedback - One-click feedback for common actions
 * Provides immediate, contextual feedback collection with minimal friction
 */

import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Star, Zap, Clock, Target, MessageSquare, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useImplicitFeedback } from '@/lib/hooks/use-implicit-feedback';
import { supabase } from '@/lib/supabase';

export interface QuickActionFeedbackProps {
  profileUrl: string;
  userId: string;
  actionContext?: {
    action: string;
    profileName?: string;
    actionResult?: any;
  };
  feedbackTrigger?: 'action_completion' | 'time_based' | 'manual';
  showReasons?: boolean;
  compactMode?: boolean;
  expertMode?: boolean;
  onFeedbackSubmitted?: (feedback: any) => void;
  customActions?: QuickAction[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  followUpQuestion?: string;
  color?: string;
}

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    id: 'excellent',
    label: 'Excellent',
    icon: <Star className="h-4 w-4" />,
    value: 'excellent',
    color: 'text-green-600'
  },
  {
    id: 'good',
    label: 'Good',
    icon: <ThumbsUp className="h-4 w-4" />,
    value: 'good',
    color: 'text-blue-600'
  },
  {
    id: 'okay',
    label: 'Okay',
    icon: <Clock className="h-4 w-4" />,
    value: 'okay',
    color: 'text-yellow-600'
  },
  {
    id: 'poor',
    label: 'Poor',
    icon: <ThumbsDown className="h-4 w-4" />,
    value: 'poor',
    color: 'text-red-600'
  }
];

const EXPERT_ACTIONS: QuickAction[] = [
  {
    id: 'highly_relevant',
    label: 'Highly Relevant',
    icon: <Target className="h-4 w-4" />,
    value: 'highly_relevant',
    followUpQuestion: 'What made this profile particularly relevant?',
    color: 'text-green-600'
  },
  {
    id: 'somewhat_relevant',
    label: 'Somewhat Relevant',
    icon: <ThumbsUp className="h-4 w-4" />,
    value: 'somewhat_relevant',
    followUpQuestion: 'What aspects were relevant?',
    color: 'text-blue-600'
  },
  {
    id: 'not_relevant',
    label: 'Not Relevant',
    icon: <ThumbsDown className="h-4 w-4" />,
    value: 'not_relevant',
    followUpQuestion: 'What was missing or mismatched?',
    color: 'text-red-600'
  },
  {
    id: 'insufficient_info',
    label: 'Need More Info',
    icon: <MessageSquare className="h-4 w-4" />,
    value: 'insufficient_info',
    followUpQuestion: 'What information would be helpful?',
    color: 'text-orange-600'
  }
];

const CONTEXTUAL_MESSAGES = {
  action_completion: {
    title: 'Quick feedback',
    subtitle: 'How was this research?'
  },
  time_based: {
    title: 'Share your thoughts',
    subtitle: 'How helpful was this information?'
  },
  manual: {
    title: 'Rate this profile',
    subtitle: 'Help us improve recommendations'
  }
};

export function QuickActionFeedback({
  profileUrl,
  userId,
  actionContext,
  feedbackTrigger = 'manual',
  showReasons = false,
  compactMode = true,
  expertMode = false,
  onFeedbackSubmitted,
  customActions
}: QuickActionFeedbackProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [followUpResponse, setFollowUpResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const { recordAction, trackFormInteraction } = useImplicitFeedback({
    profileUrl,
    userId,
    componentName: 'QuickActionFeedback'
  });

  const actions = customActions || (expertMode ? EXPERT_ACTIONS : DEFAULT_ACTIONS);
  const contextMessage = CONTEXTUAL_MESSAGES[feedbackTrigger];

  // Auto-hide after successful submission
  useEffect(() => {
    if (hasSubmitted && !showReasons) {
      const timer = setTimeout(() => setIsVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasSubmitted, showReasons]);

  const handleQuickAction = async (action: QuickAction) => {
    setSelectedAction(action.value);
    trackFormInteraction('quick_feedback', 'action_selected', action.value);

    // If action has follow-up question and reasons are enabled, show follow-up
    if (action.followUpQuestion && showReasons) {
      setShowFollowUp(true);
      return;
    }

    // Otherwise submit immediately
    await submitFeedback(action.value, '');
  };

  const handleFollowUpSubmit = async () => {
    if (!selectedAction) return;
    await submitFeedback(selectedAction, followUpResponse.trim());
  };

  const submitFeedback = async (actionValue: string, reasoning: string) => {
    setIsSubmitting(true);

    try {
      const selectedActionObj = actions.find(a => a.value === actionValue);
      
      const feedbackData = {
        quick_action: actionValue,
        quick_action_label: selectedActionObj?.label,
        reasoning: reasoning || null,
        trigger: feedbackTrigger,
        action_context: actionContext,
        response_time: Date.now(),
        form_type: expertMode ? 'expert' : 'standard',
        compact_mode: compactMode
      };

      // Save to feedback_interactions table
      const { error } = await supabase
        .from('feedback_interactions')
        .insert({
          user_id: userId,
          interaction_type: 'contextual_action',
          feedback_data: feedbackData,
          context_data: {
            profileUrl,
            profile_name: actionContext?.profileName,
            trigger_type: feedbackTrigger,
            expert_mode: expertMode,
            component_mode: compactMode ? 'compact' : 'full'
          },
          collection_method: feedbackTrigger === 'manual' ? 'voluntary' : 'prompted',
          ui_component: 'quick_action_feedback'
        });

      if (error) throw error;

      // Record action for implicit tracking
      recordAction('quick_feedback_submitted', {
        selected_action: actionValue,
        has_reasoning: !!reasoning,
        trigger_type: feedbackTrigger
      });

      setHasSubmitted(true);
      onFeedbackSubmitted?.(feedbackData);

    } catch (error) {
      console.error('Failed to submit quick feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    recordAction('quick_feedback_dismissed', { trigger: feedbackTrigger });
  };

  if (!isVisible) return null;

  if (hasSubmitted && !showFollowUp) {
    return (
      <Card className={`${compactMode ? 'max-w-xs' : 'max-w-sm'} mx-auto`}>
        <CardContent className="pt-4 pb-4">
          <div className="text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800">Thanks for your feedback!</p>
            {!compactMode && (
              <p className="text-xs text-gray-600 mt-1">
                Your input helps improve recommendations
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${compactMode ? 'max-w-xs' : 'max-w-sm'} mx-auto`}>
      <CardContent className="pt-4 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-800">
                {contextMessage.title}
              </span>
            </div>
            {!compactMode && (
              <p className="text-xs text-gray-600 mt-1">{contextMessage.subtitle}</p>
            )}
          </div>
          {feedbackTrigger !== 'manual' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Follow-up Question */}
        {showFollowUp && selectedAction && (
          <div className="space-y-3">
            {(() => {
              const selectedActionObj = actions.find(a => a.value === selectedAction);
              return (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedActionObj?.label}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {selectedActionObj?.followUpQuestion}
                  </p>
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={followUpResponse}
                    onChange={(e) => {
                      setFollowUpResponse(e.target.value);
                      trackFormInteraction('quick_feedback', 'follow_up_length', e.target.value.length);
                    }}
                    className="text-sm resize-none"
                    rows={compactMode ? 2 : 3}
                  />
                  <div className="flex space-x-2 mt-3">
                    <Button
                      onClick={handleFollowUpSubmit}
                      disabled={isSubmitting}
                      size="sm"
                      className="flex-1"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </Button>
                    <Button
                      onClick={() => submitFeedback(selectedAction, '')}
                      variant="outline"
                      size="sm"
                      disabled={isSubmitting}
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              );
            })()
            }
          </div>
        )}

        {/* Action Buttons */}
        {!showFollowUp && (
          <div className="space-y-2">
            {compactMode ? (
              // Compact layout - horizontal buttons
              <div className="grid grid-cols-2 gap-1">
                {actions.slice(0, 4).map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action)}
                    disabled={isSubmitting}
                    className="flex items-center justify-center space-x-1 text-xs"
                  >
                    <span className={action.color}>{action.icon}</span>
                    <span>{action.label}</span>
                  </Button>
                ))}
              </div>
            ) : (
              // Full layout - vertical buttons with more detail
              <div className="space-y-1">
                {actions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action)}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-start space-x-2 text-sm"
                  >
                    <span className={action.color}>{action.icon}</span>
                    <span>{action.label}</span>
                    {action.followUpQuestion && showReasons && (
                      <MessageSquare className="h-3 w-3 ml-auto text-gray-400" />
                    )}
                  </Button>
                ))}
              </div>
            )}
            
            {/* Additional context for profile */}
            {actionContext?.profileName && !compactMode && (
              <div className="border-t pt-2 mt-3">
                <p className="text-xs text-gray-600 text-center">
                  Feedback for <strong>{actionContext.profileName}</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Expert mode additional options */}
        {expertMode && !showFollowUp && !compactMode && (
          <div className="border-t pt-3 mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Expert mode</span>
              <Badge variant="outline" size="sm" className="text-xs">
                Detailed feedback
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * QuickFeedbackTrigger - Wrapper component that triggers quick feedback based on user actions
 */
export function QuickFeedbackTrigger({
  children,
  userId,
  profileUrl,
  triggerAction,
  feedbackProps = {}
}: {
  children: React.ReactNode;
  userId: string;
  profileUrl: string;
  triggerAction: 'click' | 'hover' | 'focus';
  feedbackProps?: Partial<QuickActionFeedbackProps>;
}) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [actionContext, setActionContext] = useState<any>(null);

  const handleTrigger = (event: React.SyntheticEvent) => {
    const target = event.target as HTMLElement;
    const actionType = target.textContent || target.getAttribute('aria-label') || 'unknown_action';
    
    setActionContext({
      action: actionType,
      timestamp: Date.now(),
      elementType: target.tagName.toLowerCase()
    });
    
    setShowFeedback(true);
  };

  const triggerProps = {
    onClick: triggerAction === 'click' ? handleTrigger : undefined,
    onMouseEnter: triggerAction === 'hover' ? handleTrigger : undefined,
    onFocus: triggerAction === 'focus' ? handleTrigger : undefined
  };

  return (
    <div>
      <div {...triggerProps}>
        {children}
      </div>
      
      {showFeedback && (
        <div className="mt-4">
          <QuickActionFeedback
            userId={userId}
            profileUrl={profileUrl}
            actionContext={actionContext}
            feedbackTrigger="action_completion"
            onFeedbackSubmitted={() => setShowFeedback(false)}
            {...feedbackProps}
          />
        </div>
      )}
    </div>
  );
}