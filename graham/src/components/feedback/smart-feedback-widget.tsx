/**
 * Smart Feedback Widget - Floating, contextual feedback collection
 * Non-intrusive floating widget that adapts to user context and behavior
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, MessageSquare, Star, ThumbsUp, ThumbsDown, Clock, Target, Mic, MicOff, Volume2, Edit3, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useImplicitFeedback } from '@/lib/hooks/use-implicit-feedback';
import { supabase } from '@/lib/supabase';

export interface SmartFeedbackWidgetProps {
  profileUrl?: string;
  userId?: string;
  contextData?: Record<string, any>;
  onFeedbackSubmitted?: (feedback: any) => void;
  minimizedByDefault?: boolean;
  triggerOnEvents?: ('scroll' | 'exit_intent' | 'time_threshold' | 'action_completion')[];
  enableVoiceRecording?: boolean;
  voiceLanguage?: string;
  onVoiceTranscript?: (transcript: string) => void;
}

interface FeedbackContext {
  type: 'profile_relevance' | 'research_quality' | 'feature_usefulness' | 'overall_experience';
  title: string;
  description: string;
  quickOptions: { value: string; label: string; icon?: React.ReactNode }[];
}

const FEEDBACK_CONTEXTS: Record<string, FeedbackContext> = {
  profile_relevance: {
    type: 'profile_relevance',
    title: 'How relevant was this profile?',
    description: 'Help us understand if this profile matches your research goals',
    quickOptions: [
      { value: 'highly_relevant', label: 'Perfect match', icon: <Star className="h-4 w-4" /> },
      { value: 'somewhat_relevant', label: 'Good fit', icon: <ThumbsUp className="h-4 w-4" /> },
      { value: 'not_relevant', label: 'Not a fit', icon: <ThumbsDown className="h-4 w-4" /> }
    ]
  },
  research_quality: {
    type: 'research_quality',
    title: 'How was the research quality?',
    description: 'Rate the depth and accuracy of information provided',
    quickOptions: [
      { value: 'excellent', label: 'Excellent', icon: <Star className="h-4 w-4" /> },
      { value: 'good', label: 'Good', icon: <ThumbsUp className="h-4 w-4" /> },
      { value: 'needs_improvement', label: 'Needs work', icon: <ThumbsDown className="h-4 w-4" /> }
    ]
  },
  overall_experience: {
    type: 'overall_experience',
    title: 'How was your research experience?',
    description: 'Share your overall thoughts about using this tool',
    quickOptions: [
      { value: 'excellent', label: 'Love it!', icon: <Star className="h-4 w-4" /> },
      { value: 'good', label: 'Pretty good', icon: <ThumbsUp className="h-4 w-4" /> },
      { value: 'okay', label: 'It\'s okay', icon: <Clock className="h-4 w-4" /> },
      { value: 'needs_improvement', label: 'Could be better', icon: <ThumbsDown className="h-4 w-4" /> }
    ]
  }
};

export function SmartFeedbackWidget({
  profileUrl,
  userId,
  contextData = {},
  onFeedbackSubmitted,
  minimizedByDefault = true,
  triggerOnEvents = ['exit_intent', 'time_threshold'],
  enableVoiceRecording = true,
  voiceLanguage = 'en-US',
  onVoiceTranscript
}: SmartFeedbackWidgetProps) {
  const [isVisible, setIsVisible] = useState(!minimizedByDefault);
  const [isMinimized, setIsMinimized] = useState(minimizedByDefault);
  const [currentContext, setCurrentContext] = useState<FeedbackContext | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [additionalFeedback, setAdditionalFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [voicePermissionDenied, setVoicePermissionDenied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  const triggerCountRef = useRef(0);
  const sessionStartTime = useRef(Date.now());
  const exitIntentTriggered = useRef(false);
  
  // Voice recording refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { recordAction } = useImplicitFeedback({
    profileUrl,
    userId,
    componentName: 'SmartFeedbackWidget'
  });

  // Initialize speech recognition
  useEffect(() => {
    if (enableVoiceRecording && typeof window !== 'undefined') {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      
      if (SpeechRecognition) {
        setIsVoiceSupported(true);
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = voiceLanguage;
        recognition.maxAlternatives = 1;
        
        recognition.onstart = () => {
          setIsListening(true);
          setVoiceError(null);
        };
        
        recognition.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            setVoiceTranscript(prev => prev + finalTranscript);
            onVoiceTranscript?.(finalTranscript);
          }
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setVoiceError(event.error === 'not-allowed' ? 'Microphone access denied' : 'Recognition error');
          if (event.error === 'not-allowed') {
            setVoicePermissionDenied(true);
          }
          setIsListening(false);
          setIsRecording(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
          if (isRecording) {
            // Restart recognition if still recording
            setTimeout(() => {
              try {
                recognition.start();
              } catch (error) {
                console.error('Failed to restart recognition:', error);
                setIsRecording(false);
              }
            }, 100);
          }
        };
        
        recognitionRef.current = recognition;
      } else {
        console.warn('Speech recognition not supported in this browser');
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [enableVoiceRecording, voiceLanguage, isRecording, onVoiceTranscript]);

  // Voice recording controls
  const startVoiceRecording = useCallback(async () => {
    if (!recognitionRef.current || !isVoiceSupported) return;
    
    try {
      setVoiceError(null);
      setIsRecording(true);
      setVoiceTranscript('');
      
      // Auto-stop recording after 60 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        stopVoiceRecording();
      }, 60000);
      
      recognitionRef.current.start();
      
      recordAction('voice_recording_started', {
        context_type: currentContext?.type,
        language: voiceLanguage
      });
      
    } catch (error) {
      console.error('Failed to start voice recording:', error);
      setVoiceError('Failed to start recording');
      setIsRecording(false);
    }
  }, [currentContext, voiceLanguage, recordAction, isVoiceSupported]);
  
  const stopVoiceRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    
    setIsRecording(false);
    setIsListening(false);
    
    recordAction('voice_recording_stopped', {
      context_type: currentContext?.type,
      transcript_length: voiceTranscript.length,
      has_transcript: voiceTranscript.length > 0
    });
  }, [currentContext, voiceTranscript.length, recordAction]);
  
  const clearVoiceTranscript = () => {
    setVoiceTranscript('');
    setVoiceError(null);
  };

  // Determine appropriate context based on user behavior and current state
  const determineContext = (): FeedbackContext => {
    const sessionDuration = Date.now() - sessionStartTime.current;
    
    // If user spent significant time, ask about overall experience
    if (sessionDuration > 120000) { // 2 minutes
      return FEEDBACK_CONTEXTS.overall_experience;
    }
    
    // If profile URL provided, focus on profile relevance
    if (profileUrl) {
      return FEEDBACK_CONTEXTS.profile_relevance;
    }
    
    // Default to research quality
    return FEEDBACK_CONTEXTS.research_quality;
  };

  // Handle trigger events
  useEffect(() => {
    const handlers: (() => void)[] = [];

    // Exit intent detection
    if (triggerOnEvents.includes('exit_intent')) {
      const handleMouseLeave = (event: MouseEvent) => {
        if (event.clientY <= 0 && !exitIntentTriggered.current && !hasSubmittedFeedback) {
          exitIntentTriggered.current = true;
          setCurrentContext(determineContext());
          setIsVisible(true);
          setIsMinimized(false);
        }
      };
      document.addEventListener('mouseleave', handleMouseLeave);
      handlers.push(() => document.removeEventListener('mouseleave', handleMouseLeave));
    }

    // Time threshold trigger
    if (triggerOnEvents.includes('time_threshold')) {
      const timer = setTimeout(() => {
        if (!hasSubmittedFeedback && !isVisible) {
          setCurrentContext(determineContext());
          setIsVisible(true);
          setIsMinimized(false);
        }
      }, 90000); // 1.5 minutes
      handlers.push(() => clearTimeout(timer));
    }

    // Scroll-based trigger
    if (triggerOnEvents.includes('scroll')) {
      const handleScroll = () => {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent > 70 && triggerCountRef.current === 0 && !hasSubmittedFeedback) {
          triggerCountRef.current++;
          setCurrentContext(determineContext());
          setIsVisible(true);
          setIsMinimized(false);
        }
      };
      window.addEventListener('scroll', handleScroll);
      handlers.push(() => window.removeEventListener('scroll', handleScroll));
    }

    return () => handlers.forEach(cleanup => cleanup());
  }, [triggerOnEvents, hasSubmittedFeedback, isVisible]);

  const handleSubmitFeedback = async () => {
    if (!selectedOption || !currentContext || !userId) return;

    setIsSubmitting(true);
    
    try {
      const feedbackData = {
        context_type: currentContext.type,
        selected_option: selectedOption,
        additional_feedback: additionalFeedback.trim() || null,
        voice_transcript: voiceTranscript.trim() || null,
        voice_enabled: enableVoiceRecording && isVoiceSupported,
        session_duration: Date.now() - sessionStartTime.current,
        trigger_reason: exitIntentTriggered.current ? 'exit_intent' : 'time_threshold',
        widget_settings: {
          triggers: triggerOnEvents,
          minimized_by_default: minimizedByDefault,
          voice_recording_enabled: enableVoiceRecording
        }
      };

      const contextDataWithProfile = {
        ...contextData,
        profileUrl,
        widget_context: currentContext.type,
        collection_timestamp: new Date().toISOString()
      };

      // Save to feedback_interactions table
      const { error } = await supabase
        .from('feedback_interactions')
        .insert({
          user_id: userId,
          interaction_type: 'explicit_rating',
          feedback_data: feedbackData,
          context_data: contextDataWithProfile,
          collection_method: 'prompted',
          ui_component: 'smart_feedback_widget'
        });

      if (error) throw error;

      // Record action for implicit tracking
      recordAction('feedback_submitted', {
        context_type: currentContext.type,
        selected_option: selectedOption,
        has_additional_feedback: !!additionalFeedback.trim(),
        has_voice_transcript: !!voiceTranscript.trim(),
        voice_enabled: enableVoiceRecording && isVoiceSupported
      });

      setHasSubmittedFeedback(true);
      onFeedbackSubmitted?.(feedbackData);
      
      // Hide widget after successful submission
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFeedback = (optionValue: string) => {
    setSelectedOption(optionValue);
    // Auto-submit for quick feedback if no additional context needed
    if (currentContext?.type === 'profile_relevance') {
      setTimeout(() => handleSubmitFeedback(), 100);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    recordAction('feedback_widget_minimized', { context_type: currentContext?.type });
  };

  const handleDismiss = () => {
    setIsVisible(false);
    recordAction('feedback_widget_dismissed', { context_type: currentContext?.type });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="bg-white shadow-lg border border-gray-200">
        {isMinimized ? (
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Quick feedback</span>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(false)}
                className="h-6 w-6 p-0"
              >
                <Target className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-800">
                  {currentContext?.title || 'Share your feedback'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimize}
                  className="h-6 w-6 p-0"
                >
                  <Clock className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {hasSubmittedFeedback ? (
              <div className="text-center py-4">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
                <p className="text-sm text-gray-600">Thank you for your feedback!</p>
              </div>
            ) : (
              <>
                {currentContext?.description && (
                  <p className="text-xs text-gray-600 mb-3">{currentContext.description}</p>
                )}

                <div className="space-y-2 mb-3">
                  {currentContext?.quickOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={selectedOption === option.value ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => handleQuickFeedback(option.value)}
                    >
                      {option.icon && <span className="mr-2">{option.icon}</span>}
                      {option.label}
                    </Button>
                  ))}
                </div>

                {selectedOption && currentContext?.type !== 'profile_relevance' && (
                  <div className="space-y-3">
                    {/* Voice Recording Section */}
                    {enableVoiceRecording && isVoiceSupported && (
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Record voice feedback:</span>
                          {voiceError && (
                            <span className="text-xs text-red-600">{voiceError}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant={isRecording ? "destructive" : "outline"}
                            size="sm"
                            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                            disabled={voicePermissionDenied}
                            className="flex-shrink-0"
                          >
                            {isRecording ? (
                              <>
                                <Square className="h-3 w-3 mr-1" />
                                Stop
                              </>
                            ) : (
                              <>
                                <Mic className="h-3 w-3 mr-1" />
                                Record
                              </>
                            )}
                          </Button>
                          
                          {isListening && (
                            <div className="flex items-center text-red-500">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              <span className="text-xs">Listening...</span>
                            </div>
                          )}
                          
                          {voiceTranscript && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearVoiceTranscript}
                              className="flex-shrink-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        
                        {voiceTranscript && (
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <div className="flex items-start justify-between mb-1">
                              <span className="text-gray-500">Transcript (editable):</span>
                              <Volume2 className="h-3 w-3 text-gray-400" />
                            </div>
                            <Textarea
                              value={voiceTranscript}
                              onChange={(e) => setVoiceTranscript(e.target.value)}
                              className="text-sm text-black bg-white border border-gray-200 resize-none min-h-[60px]"
                              placeholder="Your voice transcript will appear here..."
                              rows={3}
                            />
                          </div>
                        )}
                        
                        {voicePermissionDenied && (
                          <div className="bg-yellow-50 border border-yellow-200 p-2 rounded">
                            <p className="text-xs text-yellow-800">
                              Microphone access denied. Please enable microphone permissions to use voice feedback.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Text Feedback Section */}
                    <Textarea
                      placeholder={voiceTranscript ? "Add more thoughts (optional)" : "Any additional thoughts? (optional)"}
                      value={additionalFeedback}
                      onChange={(e) => setAdditionalFeedback(e.target.value)}
                      className="text-sm text-black bg-white border border-gray-200 resize-none"
                      rows={2}
                    />
                    <Button
                      onClick={handleSubmitFeedback}
                      disabled={isSubmitting || (isRecording && !voiceTranscript && !additionalFeedback.trim())}
                      size="sm"
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Feedback'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}