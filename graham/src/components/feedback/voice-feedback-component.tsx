/**
 * Voice Feedback Component - Dedicated voice recording with real-time transcription
 * Provides speech-to-text capability with fallback to manual text input
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, Edit3, Square, Loader2, Play, Pause, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useImplicitFeedback } from '@/lib/hooks/use-implicit-feedback';
import { supabase } from '@/lib/supabase';

export interface VoiceFeedbackComponentProps {
  userId: string;
  profileUrl?: string;
  contextType?: string;
  maxRecordingTime?: number; // seconds
  autoStop?: boolean;
  showTranscriptEdit?: boolean;
  showPlayback?: boolean;
  onVoiceSubmitted?: (data: VoiceFeedbackData) => void;
  onTranscriptChange?: (transcript: string) => void;
  language?: string;
  placeholder?: string;
  className?: string;
}

export interface VoiceFeedbackData {
  transcript: string;
  confidence: number;
  recordingDuration: number;
  language: string;
  editedTranscript?: string;
  audioBlob?: Blob;
  audioUrl?: string;
}

interface RecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export function VoiceFeedbackComponent({
  userId,
  profileUrl,
  contextType = 'voice_feedback',
  maxRecordingTime = 60,
  autoStop = true,
  showTranscriptEdit = true,
  showPlayback = false,
  onVoiceSubmitted,
  onTranscriptChange,
  language = 'en-US',
  placeholder = "Click record to start speaking your feedback...",
  className = ""
}: VoiceFeedbackComponentProps) {
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Transcript states
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [editedTranscript, setEditedTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  
  // System states
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Audio states
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingback, setIsPlayingback] = useState(false);
  
  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const { recordAction } = useImplicitFeedback({
    profileUrl,
    userId,
    componentName: 'VoiceFeedbackComponent'
  });

  // Initialize speech recognition and media recorder
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    
    if (SpeechRecognition) {
      setIsVoiceSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimText = '';
        let totalConfidence = 0;
        let finalResults = 0;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript;
            totalConfidence += result[0].confidence || 0.5;
            finalResults++;
          } else {
            interimText += transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript(prev => {
            const newTranscript = prev + finalTranscript;
            onTranscriptChange?.(newTranscript);
            return newTranscript;
          });
          
          if (finalResults > 0) {
            setConfidence(totalConfidence / finalResults);
          }
        }
        
        setInterimTranscript(interimText);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        switch (event.error) {
          case 'not-allowed':
            setError('Microphone access denied. Please enable microphone permissions.');
            setPermissionGranted(false);
            break;
          case 'no-speech':
            setError('No speech detected. Please try speaking again.');
            break;
          case 'audio-capture':
            setError('No microphone found. Please check your audio settings.');
            break;
          case 'network':
            setError('Network error. Please check your internet connection.');
            break;
          default:
            setError(`Speech recognition error: ${event.error}`);
        }
        
        stopRecording();
      };
      
      recognition.onend = () => {
        setIsListening(false);
        if (isRecording && !isPaused) {
          // Restart recognition if still recording
          setTimeout(() => {
            try {
              recognition.start();
            } catch (error) {
              console.error('Failed to restart recognition:', error);
              stopRecording();
            }
          }, 100);
        }
      };
      
      recognitionRef.current = recognition;
    } else {
      console.warn('Speech recognition not supported in this browser');
      setError('Voice recording is not supported in this browser. You can still type your feedback.');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }
    };
  }, [language, isRecording, isPaused, onTranscriptChange]);

  // Recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (autoStop && newTime >= maxRecordingTime) {
            stopRecording();
            return maxRecordingTime;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
    
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording, isPaused, autoStop, maxRecordingTime]);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);
      setError(null);
      
      // Set up media recorder for audio capture
      if (showPlayback) {
        const mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioBlob(audioBlob);
          setAudioUrl(audioUrl);
          audioChunksRef.current = [];
        };
        
        mediaRecorderRef.current = mediaRecorder;
      }
      
      // Stop the stream immediately - we'll request it again when recording
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Failed to get microphone permission:', error);
      setError('Microphone access denied. Please enable microphone permissions.');
      setPermissionGranted(false);
      return false;
    }
  }, [showPlayback]);

  const startRecording = useCallback(async () => {
    if (!isVoiceSupported) {
      setError('Voice recording is not supported in this browser.');
      return;
    }
    
    if (!permissionGranted) {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }
    
    try {
      setError(null);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      setTranscript('');
      setInterimTranscript('');
      setEditedTranscript('');
      setConfidence(0);
      startTimeRef.current = Date.now();
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
      // Start audio recording for playback
      if (showPlayback && mediaRecorderRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current.stream = stream;
        mediaRecorderRef.current.start();
      }
      
      // Set auto-stop timer
      if (autoStop) {
        autoStopTimerRef.current = setTimeout(() => {
          stopRecording();
        }, maxRecordingTime * 1000);
      }
      
      recordAction('voice_recording_started', {
        context_type: contextType,
        language: language,
        max_duration: maxRecordingTime
      });
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  }, [isVoiceSupported, permissionGranted, requestMicrophonePermission, showPlayback, autoStop, maxRecordingTime, contextType, language, recordAction]);

  const pauseRecording = useCallback(() => {
    if (!isRecording) return;
    
    setIsPaused(true);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    
    recordAction('voice_recording_paused', {
      context_type: contextType,
      duration_so_far: recordingTime
    });
  }, [isRecording, recordingTime, contextType, recordAction]);

  const resumeRecording = useCallback(async () => {
    if (!isRecording || !isPaused) return;
    
    setIsPaused(false);
    
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      
      recordAction('voice_recording_resumed', {
        context_type: contextType,
        duration_so_far: recordingTime
      });
      
    } catch (error) {
      console.error('Failed to resume recording:', error);
      setError('Failed to resume recording.');
    }
  }, [isRecording, isPaused, recordingTime, contextType, recordAction]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setIsPaused(false);
    setIsListening(false);
    setInterimTranscript('');
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
    
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    
    const duration = Date.now() - startTimeRef.current;
    
    recordAction('voice_recording_stopped', {
      context_type: contextType,
      duration_seconds: Math.floor(duration / 1000),
      transcript_length: transcript.length,
      confidence: confidence
    });
    
  }, [transcript.length, confidence, contextType, recordAction]);

  const clearRecording = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setEditedTranscript('');
    setConfidence(0);
    setRecordingTime(0);
    setError(null);
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);
    
    recordAction('voice_recording_cleared', {
      context_type: contextType
    });
  }, [audioUrl, contextType, recordAction]);

  const playAudio = useCallback(() => {
    if (!audioUrl) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.onplay = () => setIsPlayingback(true);
    audio.onended = () => setIsPlayingback(false);
    audio.onerror = () => {
      setIsPlayingback(false);
      setError('Failed to play audio');
    };
    
    audio.play().catch(error => {
      console.error('Failed to play audio:', error);
      setError('Failed to play audio');
    });
    
    recordAction('voice_playback_started', {
      context_type: contextType
    });
  }, [audioUrl, contextType, recordAction]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingback(false);
    }
  }, []);

  const submitVoiceFeedback = useCallback(async () => {
    const finalTranscript = editedTranscript || transcript;
    
    if (!finalTranscript.trim()) {
      setError('Please record some feedback or type your thoughts.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const voiceData: VoiceFeedbackData = {
        transcript: finalTranscript,
        confidence: confidence,
        recordingDuration: recordingTime,
        language: language,
        editedTranscript: editedTranscript || undefined,
        audioBlob: audioBlob || undefined,
        audioUrl: audioUrl || undefined
      };
      
      // Save to database
      const { error } = await supabase
        .from('feedback_interactions')
        .insert({
          user_id: userId,
          interaction_type: 'explicit_rating',
          feedback_data: {
            voice_feedback: voiceData,
            context_type: contextType,
            collection_method: 'voice_recording'
          },
          context_data: {
            profileUrl,
            voice_language: language,
            recording_duration: recordingTime,
            confidence_score: confidence,
            has_audio: !!audioBlob
          },
          collection_method: 'voluntary',
          ui_component: 'voice_feedback_component'
        });
      
      if (error) throw error;
      
      recordAction('voice_feedback_submitted', {
        context_type: contextType,
        transcript_length: finalTranscript.length,
        confidence: confidence,
        was_edited: !!editedTranscript,
        has_audio: !!audioBlob
      });
      
      onVoiceSubmitted?.(voiceData);
      
      // Clear after successful submission
      setTimeout(() => {
        clearRecording();
        setIsSubmitting(false);
      }, 1500);
      
    } catch (error) {
      console.error('Failed to submit voice feedback:', error);
      setError('Failed to submit feedback. Please try again.');
      setIsSubmitting(false);
    }
  }, [transcript, editedTranscript, confidence, recordingTime, language, audioBlob, audioUrl, contextType, userId, profileUrl, recordAction, onVoiceSubmitted, clearRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (recordingTime / maxRecordingTime) * 100;

  return (
    <Card className={`p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Volume2 className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-sm">Voice Feedback</span>
          {isVoiceSupported && (
            <Badge variant="outline" className="text-xs">
              {language}
            </Badge>
          )}
        </div>
        
        {isRecording && (
          <div className="flex items-center space-x-2 text-red-600">
            <div className="h-2 w-2 bg-red-600 rounded-full animate-pulse" />
            <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {/* Recording Progress */}
      {isRecording && (
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-gray-500 text-center">
            {maxRecordingTime - recordingTime} seconds remaining
          </p>
        </div>
      )}
      
      {/* Recording Controls */}
      <div className="flex items-center space-x-2">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            disabled={!isVoiceSupported || isSubmitting}
            className="flex-1"
          >
            <Mic className="h-4 w-4 mr-2" />
            Start Recording
          </Button>
        ) : (
          <>
            <Button
              onClick={isPaused ? resumeRecording : pauseRecording}
              variant="outline"
              size="sm"
            >
              {isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              onClick={stopRecording}
              variant="destructive"
              size="sm"
            >
              <Square className="h-4 w-4" />
            </Button>
          </>
        )}
        
        {(transcript || editedTranscript) && !isRecording && (
          <Button
            onClick={clearRecording}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Live Transcript */}
      {(isRecording || isListening) && (interimTranscript || transcript) && (
        <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
          <p className="text-sm text-blue-800">
            <span className="font-medium">{transcript}</span>
            {interimTranscript && (
              <span className="text-blue-600 italic">{interimTranscript}</span>
            )}
          </p>
          {confidence > 0 && (
            <p className="text-xs text-blue-600 mt-1">
              Confidence: {Math.round(confidence * 100)}%
            </p>
          )}
        </div>
      )}
      
      {/* Final Transcript */}
      {transcript && !isRecording && (
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Transcript:</span>
              <div className="flex items-center space-x-2">
                {confidence > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {Math.round(confidence * 100)}% confident
                  </Badge>
                )}
                {showPlayback && audioUrl && (
                  <Button
                    onClick={isPlayingback ? stopAudio : playAudio}
                    variant="ghost"
                    size="sm"
                  >
                    {isPlayingback ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{transcript}</p>
          </div>
          
          {/* Editable Transcript */}
          {showTranscriptEdit && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Edit3 className="h-3 w-3 mr-1" />
                Edit or add more details:
              </label>
              <Textarea
                placeholder="Edit the transcript above or add more thoughts..."
                value={editedTranscript}
                onChange={(e) => setEditedTranscript(e.target.value)}
                className="text-sm"
                rows={3}
              />
            </div>
          )}
        </div>
      )}
      
      {/* Fallback Text Input */}
      {!isVoiceSupported && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Your feedback:
          </label>
          <Textarea
            placeholder={placeholder}
            value={editedTranscript}
            onChange={(e) => setEditedTranscript(e.target.value)}
            className="text-sm"
            rows={4}
          />
        </div>
      )}
      
      {/* Submit Button */}
      {(transcript || editedTranscript) && !isRecording && (
        <Button
          onClick={submitVoiceFeedback}
          disabled={isSubmitting || (!transcript.trim() && !editedTranscript.trim())}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Submit Voice Feedback
            </>
          )}
        </Button>
      )}
      
      {/* Audio element for playback */}
      {showPlayback && <audio ref={audioRef} style={{ display: 'none' }} />}
    </Card>
  );
}

// Type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: (event: Event) => void;
  onend: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;