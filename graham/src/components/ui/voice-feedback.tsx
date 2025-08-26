"use client"

import * as React from "react"
import { Mic, MicOff, Play, Pause, Square, Volume2, VolumeX, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Progress } from "./progress"

interface VoiceFeedbackProps {
  sessionId?: string
  commenterId?: string
  analysisId?: string
  userId: string
  teamId?: string
  analysisData?: any
  onFeedbackSubmitted?: (feedback: any) => void
  onError?: (error: string) => void
  className?: string
}

interface VoiceRecording {
  transcription: string
  originalTranscription: string
  duration: number
  confidence: number
  isRecording: boolean
  isProcessing: boolean
}

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function VoiceFeedback({
  sessionId,
  commenterId,
  analysisId,
  userId,
  teamId,
  analysisData,
  onFeedbackSubmitted,
  onError,
  className
}: VoiceFeedbackProps) {
  const [recording, setRecording] = React.useState<VoiceRecording>({
    transcription: '',
    originalTranscription: '',
    duration: 0,
    confidence: 0,
    isRecording: false,
    isProcessing: false
  })
  
  const [isSupported, setIsSupported] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitStatus, setSubmitStatus] = React.useState<'idle' | 'success' | 'error'>('idle')
  const [processedFeedback, setProcessedFeedback] = React.useState<any>(null)
  
  // Speech Recognition refs
  const recognitionRef = React.useRef<any>(null)
  const recordingStartTime = React.useRef<number>(0)
  const durationInterval = React.useRef<NodeJS.Timeout>()

  // Check for Web Speech API support
  React.useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
      onError?.('Voice recording is not supported in this browser. Please use Chrome, Edge, or Safari.')
    } else {
      setupSpeechRecognition()
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current)
      }
    }
  }, [])

  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      recordingStartTime.current = Date.now()
      setRecording(prev => ({ ...prev, isRecording: true }))
      
      // Start duration timer
      durationInterval.current = setInterval(() => {
        setRecording(prev => ({ 
          ...prev, 
          duration: Math.floor((Date.now() - recordingStartTime.current) / 1000)
        }))
      }, 100)
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let confidence = 0
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
          confidence = result[0].confidence
        }
      }
      
      if (finalTranscript) {
        setRecording(prev => ({ 
          ...prev, 
          transcription: prev.transcription + finalTranscript,
          originalTranscription: prev.originalTranscription + finalTranscript,
          confidence: Math.max(prev.confidence, confidence)
        }))
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      stopRecording()
      
      let errorMessage = 'Voice recording failed. '
      switch (event.error) {
        case 'network':
          errorMessage += 'Please check your internet connection.'
          break
        case 'not-allowed':
          errorMessage += 'Please allow microphone access.'
          break
        case 'no-speech':
          errorMessage += 'No speech detected. Please try again.'
          break
        default:
          errorMessage += 'Please try again.'
      }
      onError?.(errorMessage)
    }

    recognition.onend = () => {
      if (recording.isRecording) {
        stopRecording()
      }
    }

    recognitionRef.current = recognition
  }

  const startRecording = async () => {
    if (!isSupported || !recognitionRef.current) return

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      setRecording({
        transcription: '',
        originalTranscription: '',
        duration: 0,
        confidence: 0,
        isRecording: false,
        isProcessing: false
      })
      
      setSubmitStatus('idle')
      setProcessedFeedback(null)
      
      recognitionRef.current.start()
    } catch (error) {
      console.error('Microphone access error:', error)
      onError?.('Microphone access denied. Please allow microphone permissions and try again.')
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && recording.isRecording) {
      recognitionRef.current.stop()
    }
    
    setRecording(prev => ({ ...prev, isRecording: false }))
    
    if (durationInterval.current) {
      clearInterval(durationInterval.current)
    }
  }

  const processVoiceFeedback = async () => {
    console.log('processVoiceFeedback called')
    console.log('Current recording state:', recording)
    console.log('Current userId:', userId)
    
    if (!recording.transcription.trim()) {
      console.log('No transcription found')
      onError?.('No voice input detected. Please record your feedback first.')
      return
    }

    // Use fallback userId if not provided (use existing test user from database)
    const effectiveUserId = userId || '550e8400-e29b-41d4-a716-446655440001'
    console.log('Using userId:', effectiveUserId)

    setRecording(prev => ({ ...prev, isProcessing: true }))

    try {
      // Debug: log what we're sending
      const requestData = {
        transcription: recording.transcription.trim(),
        userId: effectiveUserId,
        sessionId: sessionId || null,
        commenterId: commenterId || null,
        analysisData: analysisData || null
      }
      console.log('Sending voice processing request:', requestData)
      console.log('Individual values:', {
        transcription: recording.transcription.trim(),
        transcriptionLength: recording.transcription.trim().length,
        userId: effectiveUserId,
        userIdType: typeof effectiveUserId,
        sessionId: sessionId,
        commenterId: commenterId
      })

      // Process voice transcription with AI
      const processingResponse = await fetch('/api/voice-processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (!processingResponse.ok) {
        const errorText = await processingResponse.text()
        console.error('Voice processing API error:', errorText)
        throw new Error(`Voice processing failed: ${processingResponse.status}`)
      }

      const processingResult = await processingResponse.json()
      console.log('Voice processing result:', processingResult)
      setProcessedFeedback(processingResult.data)

    } catch (error) {
      console.error('Voice processing error:', error)
      onError?.('Failed to process voice feedback. Please try again.')
    } finally {
      setRecording(prev => ({ ...prev, isProcessing: false }))
    }
  }

  const submitVoiceFeedback = async () => {
    if (!processedFeedback) {
      await processVoiceFeedback()
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/voice-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          commenterId,
          analysisId,
          userId,
          teamId,
          
          // Voice data
          voiceTranscription: recording.transcription,
          voiceDurationSeconds: recording.duration,
          voiceConfidence: recording.confidence,
          voiceKeyPoints: processedFeedback.processedFeedback.keyPoints,
          voiceSentiment: processedFeedback.processedFeedback.sentiment,
          
          // Processed feedback
          isRelevant: processedFeedback.processedFeedback.isRelevant,
          overallRating: processedFeedback.processedFeedback.overallRating,
          confidenceScore: processedFeedback.processedFeedback.confidence,
          feedbackText: processedFeedback.processedFeedback.feedbackText,
          
          // Context
          analysisContext: analysisData,
          userContext: {
            recordingDuration: recording.duration,
            transcriptionLength: recording.transcription.length,
            processingTime: Date.now()
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit voice feedback')
      }

      const result = await response.json()
      setSubmitStatus('success')
      onFeedbackSubmitted?.(result)

      // Clear the recording after successful submission
      setTimeout(() => {
        setRecording({
          transcription: '',
          originalTranscription: '',
          duration: 0,
          confidence: 0,
          isRecording: false,
          isProcessing: false
        })
        setProcessedFeedback(null)
        setSubmitStatus('idle')
      }, 3000)

    } catch (error) {
      console.error('Voice feedback submission error:', error)
      setSubmitStatus('error')
      onError?.('Failed to submit voice feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetRecording = () => {
    stopRecording()
    setRecording({
      transcription: '',
      originalTranscription: '',
      duration: 0,
      confidence: 0,
      isRecording: false,
      isProcessing: false
    })
    setProcessedFeedback(null)
    setSubmitStatus('idle')
  }

  if (!isSupported) {
    return (
      <Card className={cn("border-orange-200 bg-orange-50", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-orange-700 mb-2">
            <VolumeX className="w-4 h-4" />
            <span className="font-medium">Voice Feedback Unavailable</span>
          </div>
          <p className="text-sm text-orange-600">
            Voice recording is not supported in this browser. Please use Chrome, Edge, or Safari for voice feedback.
          </p>
        </CardContent>
      </Card>
    )
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className={cn("border-purple-200 bg-purple-50/30", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Volume2 className="w-5 h-5" />
          Voice Feedback
          {submitStatus === 'success' && (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Submitted
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center gap-3">
          {!recording.isRecording ? (
            <Button
              onClick={startRecording}
              disabled={recording.isProcessing || isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Recording
            </Button>
          )}
          
          <div className="flex items-center gap-2 text-sm text-purple-700">
            {recording.isRecording && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>Recording...</span>
              </div>
            )}
            
            {recording.duration > 0 && (
              <Badge variant="outline" className="text-purple-700 border-purple-300">
                {formatDuration(recording.duration)}
              </Badge>
            )}
          </div>
        </div>

        {/* Transcription Display */}
        {recording.transcription && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h5 className="font-medium text-purple-800">Voice Transcription:</h5>
              {recording.originalTranscription !== recording.transcription && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                  Edited
                </Badge>
              )}
            </div>
            <textarea
              value={recording.transcription}
              onChange={(e) => setRecording(prev => ({ ...prev, transcription: e.target.value }))}
              className="w-full bg-white p-3 rounded border border-purple-200 text-sm min-h-[80px] resize-y focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              placeholder="Edit your transcription here..."
              disabled={recording.isRecording || recording.isProcessing}
            />
            
            <div className="flex items-center justify-between">
              {recording.confidence > 0 && (
                <div className="flex items-center gap-2 text-xs text-purple-600">
                  <span>Confidence:</span>
                  <Progress 
                    value={recording.confidence * 100} 
                    className="w-16 h-2" 
                  />
                  <span>{Math.round(recording.confidence * 100)}%</span>
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                💡 Edit the transcription above if needed
              </div>
            </div>
          </div>
        )}

        {/* Processed Feedback Display */}
        {processedFeedback && (
          <div className="space-y-3 p-3 bg-white rounded border border-purple-200">
            <h5 className="font-medium text-purple-800">AI Analysis:</h5>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium">Decision:</span>
                <Badge 
                  className={`ml-2 ${
                    processedFeedback.processedFeedback.isRelevant 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {processedFeedback.processedFeedback.isRelevant ? 'Contact' : 'Skip'}
                </Badge>
              </div>
              
              <div>
                <span className="font-medium">Sentiment:</span>
                <Badge className="ml-2 bg-blue-100 text-blue-700 capitalize">
                  {processedFeedback.processedFeedback.sentiment}
                </Badge>
              </div>
              
              {processedFeedback.processedFeedback.overallRating && (
                <div>
                  <span className="font-medium">Rating:</span>
                  <span className="ml-2 text-purple-700 font-semibold">
                    {processedFeedback.processedFeedback.overallRating}/10
                  </span>
                </div>
              )}
              
              <div>
                <span className="font-medium">Confidence:</span>
                <span className="ml-2 text-purple-700">
                  {Math.round(processedFeedback.processedFeedback.confidence * 100)}%
                </span>
              </div>
            </div>
            
            {processedFeedback.processedFeedback.keyPoints?.length > 0 && (
              <div>
                <span className="font-medium text-sm">Key Points:</span>
                <ul className="mt-1 space-y-1">
                  {processedFeedback.processedFeedback.keyPoints.map((point: string, index: number) => (
                    <li key={index} className="text-xs text-purple-600 flex items-start gap-2">
                      <span className="w-1 h-1 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {recording.transcription && !processedFeedback && (
            <Button
              onClick={processVoiceFeedback}
              disabled={recording.isProcessing || isSubmitting}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              {recording.isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process Feedback'
              )}
            </Button>
          )}
          
          {processedFeedback && submitStatus !== 'success' && (
            <Button
              onClick={submitVoiceFeedback}
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          )}
          
          {(recording.transcription || processedFeedback) && (
            <Button
              onClick={resetRecording}
              variant="ghost"
              size="sm"
              className="text-purple-600 hover:text-purple-800"
            >
              Clear & Start Over
            </Button>
          )}
        </div>

        {/* Status Messages */}
        {submitStatus === 'success' && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded border border-green-200">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Voice feedback submitted successfully! The system is learning from your insights.</span>
          </div>
        )}
        
        {submitStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 p-2 rounded border border-red-200">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Failed to submit feedback. Please try again.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}