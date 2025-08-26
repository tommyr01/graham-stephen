/**
 * Outcome Tracking Forms - Track contact results and success
 * Comprehensive forms to track contact outcomes and measure success
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Mail, Phone, MessageSquare, Calendar, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useImplicitFeedback } from '@/lib/hooks/use-implicit-feedback';
import { supabase } from '@/lib/supabase';

export interface OutcomeTrackingProps {
  profileUrl: string;
  userId: string;
  profileData?: {
    name?: string;
    title?: string;
    company?: string;
  };
  initialRelevanceRating?: number;
  researchSessionId?: string;
  onOutcomeRecorded?: (outcome: ContactOutcome) => void;
  allowMultipleUpdates?: boolean;
  compactMode?: boolean;
}

interface ContactOutcome {
  contacted: boolean;
  contactMethod?: string;
  contactDate?: Date;
  responseReceived: boolean;
  responseDate?: Date;
  responseType?: string;
  outcome?: string;
  nextSteps?: string;
  notes?: string;
  successScore?: number; // 1-10 scale
  wouldResearchAgain?: boolean;
  campaignId?: string;
  followUpScheduled?: boolean;
  followUpDate?: Date;
}

const CONTACT_METHODS = [
  { value: 'linkedin_message', label: 'LinkedIn Message', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'linkedin_connection', label: 'LinkedIn Connection', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
  { value: 'phone', label: 'Phone Call', icon: <Phone className="h-4 w-4" /> },
  { value: 'meeting_request', label: 'Meeting Request', icon: <Calendar className="h-4 w-4" /> },
  { value: 'other', label: 'Other', icon: <MessageSquare className="h-4 w-4" /> }
];

const RESPONSE_TYPES = [
  { value: 'positive', label: 'Positive/Interested', color: 'text-green-600' },
  { value: 'neutral', label: 'Neutral/Polite', color: 'text-blue-600' },
  { value: 'negative', label: 'Not Interested', color: 'text-red-600' },
  { value: 'no_response', label: 'No Response', color: 'text-gray-600' },
  { value: 'auto_reply', label: 'Auto-Reply', color: 'text-gray-500' }
];

const OUTCOME_TYPES = [
  { value: 'meeting_scheduled', label: 'Meeting Scheduled', icon: <Calendar className="h-4 w-4" /> },
  { value: 'call_scheduled', label: 'Call Scheduled', icon: <Phone className="h-4 w-4" /> },
  { value: 'ongoing_conversation', label: 'Ongoing Conversation', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'information_shared', label: 'Information Shared', icon: <Mail className="h-4 w-4" /> },
  { value: 'referral_received', label: 'Referral Received', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'declined_politely', label: 'Declined Politely', icon: <XCircle className="h-4 w-4" /> },
  { value: 'no_response', label: 'No Response', icon: <Clock className="h-4 w-4" /> },
  { value: 'blocked_reported', label: 'Blocked/Reported', icon: <AlertCircle className="h-4 w-4" /> }
];

export function OutcomeTrackingForms({
  profileUrl,
  userId,
  profileData = {},
  initialRelevanceRating,
  researchSessionId,
  onOutcomeRecorded,
  allowMultipleUpdates = true,
  compactMode = false
}: OutcomeTrackingProps) {
  const [step, setStep] = useState<'initial' | 'contact_details' | 'response_tracking' | 'final_outcome'>('initial');
  const [outcome, setOutcome] = useState<Partial<ContactOutcome>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { recordAction, trackFormInteraction } = useImplicitFeedback({
    profileUrl,
    userId,
    componentName: 'OutcomeTrackingForms'
  });

  const handleInitialDecision = (contacted: boolean) => {
    setOutcome({ ...outcome, contacted });
    trackFormInteraction('outcome_tracking', 'initial_decision', contacted ? 'contacted' : 'not_contacted');
    
    if (contacted) {
      setStep('contact_details');
    } else {
      setStep('final_outcome');
    }
  };

  const handleContactDetails = (details: Partial<ContactOutcome>) => {
    const updatedOutcome = { ...outcome, ...details };
    setOutcome(updatedOutcome);
    
    Object.entries(details).forEach(([key, value]) => {
      trackFormInteraction('outcome_tracking', `contact_${key}`, value);
    });
    
    setStep('response_tracking');
  };

  const handleResponseDetails = (responseDetails: Partial<ContactOutcome>) => {
    const updatedOutcome = { ...outcome, ...responseDetails };
    setOutcome(updatedOutcome);
    
    Object.entries(responseDetails).forEach(([key, value]) => {
      trackFormInteraction('outcome_tracking', `response_${key}`, value);
    });
    
    setStep('final_outcome');
  };

  const handleFinalSubmit = async (finalDetails: Partial<ContactOutcome>) => {
    const completeOutcome = { ...outcome, ...finalDetails };
    setOutcome(completeOutcome);
    setIsSubmitting(true);

    try {
      const outcomeData = {
        profile_url: profileUrl,
        profile_data: profileData,
        initial_relevance_rating: initialRelevanceRating,
        research_session_id: researchSessionId,
        ...completeOutcome,
        tracking_timestamp: new Date().toISOString(),
        form_completion_time: Date.now() - (outcome.contactDate?.getTime() || Date.now()),
        user_experience_rating: finalDetails.successScore
      };

      // Save to feedback_interactions table
      const { error } = await supabase
        .from('feedback_interactions')
        .insert({
          user_id: userId,
          interaction_type: 'outcome_report',
          feedback_data: outcomeData,
          context_data: {
            profileUrl,
            profile_name: profileData.name,
            contacted: completeOutcome.contacted,
            success_score: completeOutcome.successScore,
            tracking_method: compactMode ? 'compact' : 'full'
          },
          collection_method: 'voluntary',
          ui_component: 'outcome_tracking_forms'
        });

      if (error) throw error;

      // Record action for implicit tracking
      recordAction('contact_outcome_recorded', {
        contacted: completeOutcome.contacted,
        response_received: completeOutcome.responseReceived,
        success_score: completeOutcome.successScore,
        outcome_type: completeOutcome.outcome
      });

      setHasSubmitted(true);
      setShowSuccess(true);
      onOutcomeRecorded?.(completeOutcome as ContactOutcome);

      setTimeout(() => setShowSuccess(false), 3000);

    } catch (error) {
      console.error('Failed to submit outcome:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Outcome Recorded!
            </h3>
            <p className="text-sm text-gray-600">
              Thank you for tracking your results. This helps improve our recommendations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${compactMode ? 'max-w-sm' : 'max-w-lg'} mx-auto`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <span>Track Contact Outcome</span>
        </CardTitle>
        {profileData.name && (
          <p className="text-sm text-gray-600">
            How did your outreach to <strong>{profileData.name}</strong> go?
          </p>
        )}
      </CardHeader>

      <CardContent>
        {/* Step 1: Initial Decision */}
        {step === 'initial' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">Did you contact this person?</h3>
              <div className="flex space-x-3">
                <Button
                  onClick={() => handleInitialDecision(true)}
                  className="flex-1 flex items-center justify-center space-x-2"
                  variant="outline"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Yes, I contacted them</span>
                </Button>
                <Button
                  onClick={() => handleInitialDecision(false)}
                  className="flex-1 flex items-center justify-center space-x-2"
                  variant="outline"
                >
                  <XCircle className="h-4 w-4" />
                  <span>No, I didn't contact them</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Contact Details */}
        {step === 'contact_details' && (
          <ContactDetailsForm
            onComplete={handleContactDetails}
            compactMode={compactMode}
          />
        )}

        {/* Step 3: Response Tracking */}
        {step === 'response_tracking' && (
          <ResponseTrackingForm
            contactMethod={outcome.contactMethod}
            onComplete={handleResponseDetails}
            compactMode={compactMode}
          />
        )}

        {/* Step 4: Final Outcome */}
        {step === 'final_outcome' && (
          <FinalOutcomeForm
            contacted={outcome.contacted || false}
            responseReceived={outcome.responseReceived}
            onComplete={handleFinalSubmit}
            isSubmitting={isSubmitting}
            compactMode={compactMode}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Contact Details Form Component
function ContactDetailsForm({ 
  onComplete, 
  compactMode 
}: { 
  onComplete: (details: Partial<ContactOutcome>) => void;
  compactMode: boolean;
}) {
  const [contactMethod, setContactMethod] = useState('');
  const [contactDate, setContactDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleNext = () => {
    onComplete({
      contactMethod,
      contactDate: contactDate ? new Date(contactDate) : undefined,
      notes: notes.trim() || undefined
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Contact Details</h3>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-2 block">How did you contact them?</label>
          <Select value={contactMethod} onValueChange={setContactMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Select contact method" />
            </SelectTrigger>
            <SelectContent>
              {CONTACT_METHODS.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  <div className="flex items-center space-x-2">
                    {method.icon}
                    <span>{method.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Contact Date</label>
          <Input
            type="date"
            value={contactDate}
            onChange={(e) => setContactDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {!compactMode && (
          <div>
            <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
            <Textarea
              placeholder="Any specific details about your outreach..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        )}
      </div>

      <Button
        onClick={handleNext}
        disabled={!contactMethod}
        className="w-full"
      >
        Next: Track Response
      </Button>
    </div>
  );
}

// Response Tracking Form Component
function ResponseTrackingForm({ 
  contactMethod,
  onComplete, 
  compactMode 
}: { 
  contactMethod?: string;
  onComplete: (details: Partial<ContactOutcome>) => void;
  compactMode: boolean;
}) {
  const [responseReceived, setResponseReceived] = useState<boolean | null>(null);
  const [responseType, setResponseType] = useState('');
  const [responseDate, setResponseDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleNext = () => {
    onComplete({
      responseReceived: responseReceived || false,
      responseType: responseType || undefined,
      responseDate: responseDate ? new Date(responseDate) : undefined,
      notes: notes.trim() || undefined
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Response Tracking</h3>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-2 block">Did they respond?</label>
          <div className="flex space-x-2">
            <Button
              variant={responseReceived === true ? "default" : "outline"}
              size="sm"
              onClick={() => setResponseReceived(true)}
              className="flex-1"
            >
              Yes, they responded
            </Button>
            <Button
              variant={responseReceived === false ? "default" : "outline"}
              size="sm"
              onClick={() => setResponseReceived(false)}
              className="flex-1"
            >
              No response yet
            </Button>
          </div>
        </div>

        {responseReceived && (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Response Type</label>
              <Select value={responseType} onValueChange={setResponseType}>
                <SelectTrigger>
                  <SelectValue placeholder="How was their response?" />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className={type.color}>{type.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Response Date</label>
              <Input
                type="date"
                value={responseDate}
                onChange={(e) => setResponseDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </>
        )}

        {!compactMode && (
          <div>
            <label className="text-sm font-medium mb-2 block">Response Notes (optional)</label>
            <Textarea
              placeholder="What was their response like? Any key details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        )}
      </div>

      <Button
        onClick={handleNext}
        disabled={responseReceived === null}
        className="w-full"
      >
        Next: Final Outcome
      </Button>
    </div>
  );
}

// Final Outcome Form Component
function FinalOutcomeForm({ 
  contacted,
  responseReceived,
  onComplete, 
  isSubmitting,
  compactMode 
}: { 
  contacted: boolean;
  responseReceived?: boolean;
  onComplete: (details: Partial<ContactOutcome>) => void;
  isSubmitting: boolean;
  compactMode: boolean;
}) {
  const [outcome, setOutcome] = useState('');
  const [successScore, setSuccessScore] = useState(5);
  const [wouldResearchAgain, setWouldResearchAgain] = useState<boolean | null>(null);
  const [nextSteps, setNextSteps] = useState('');
  const [followUpScheduled, setFollowUpScheduled] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');

  const handleSubmit = () => {
    onComplete({
      outcome: outcome || undefined,
      successScore,
      wouldResearchAgain: wouldResearchAgain || false,
      nextSteps: nextSteps.trim() || undefined,
      followUpScheduled,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Final Outcome</h3>
      
      <div className="space-y-3">
        {contacted && (
          <div>
            <label className="text-sm font-medium mb-2 block">What was the outcome?</label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger>
                <SelectValue placeholder="Select the outcome" />
              </SelectTrigger>
              <SelectContent>
                {OUTCOME_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      {type.icon}
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">
            Success Rating (1-10)
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="1"
              max="10"
              value={successScore}
              onChange={(e) => setSuccessScore(Number(e.target.value))}
              className="flex-1"
            />
            <Badge variant="outline" className="min-w-[3rem] justify-center">
              {successScore}/10
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            How successful was this research/outreach overall?
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Would you research similar profiles again?
          </label>
          <div className="flex space-x-2">
            <Button
              variant={wouldResearchAgain === true ? "default" : "outline"}
              size="sm"
              onClick={() => setWouldResearchAgain(true)}
              className="flex-1"
            >
              Yes, definitely
            </Button>
            <Button
              variant={wouldResearchAgain === false ? "default" : "outline"}
              size="sm"
              onClick={() => setWouldResearchAgain(false)}
              className="flex-1"
            >
              No, not really
            </Button>
          </div>
        </div>

        {responseReceived && !compactMode && (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Next Steps (optional)</label>
              <Textarea
                placeholder="Any follow-up actions planned..."
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="followUp"
                checked={followUpScheduled}
                onChange={(e) => setFollowUpScheduled(e.target.checked)}
              />
              <label htmlFor="followUp" className="text-sm font-medium">
                Follow-up scheduled
              </label>
            </div>

            {followUpScheduled && (
              <div>
                <label className="text-sm font-medium mb-2 block">Follow-up Date</label>
                <Input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || wouldResearchAgain === null}
        className="w-full"
      >
        {isSubmitting ? 'Recording Outcome...' : 'Record Outcome'}
      </Button>
    </div>
  );
}