"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Volume2,
  VolumeX,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  Brain
} from "lucide-react"
import { generateDemoUserID, generateSessionID } from "@/lib/utils/uuid"

interface VoiceTrainingProps {
  onTrainingComplete?: (data: VoiceTrainingData) => void
  className?: string
}

interface VoiceTrainingData {
  sessionId: string
  duration: number
  transcription: string
  insights: string[]
  confidence: number
}

type TrainingState = 'idle' | 'recording' | 'processing' | 'complete' | 'error'

export function VoiceTraining({ onTrainingComplete, className }: VoiceTrainingProps) {
  const [state, setState] = React.useState<TrainingState>('idle')
  const [isRecording, setIsRecording] = React.useState(false)
  const [recordingTime, setRecordingTime] = React.useState(0)
  const [transcription, setTranscription] = React.useState('')
  const [insights, setInsights] = React.useState<string[]>([])
  const [volume, setVolume] = React.useState(0.5)
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null)
  const [recognition, setRecognition] = React.useState<any>(null)
  const [isListening, setIsListening] = React.useState(false)
  
  const intervalRef = React.useRef<NodeJS.Timeout>()

  // Start real-time voice recognition
  const startRecording = async () => {
    try {
      // Initialize Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (!SpeechRecognition) {
        throw new Error('Speech recognition not supported in this browser')
      }
      
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-US'
      
      let fullTranscript = ''
      
      recognitionInstance.onstart = () => {
        setIsRecording(true)
        setIsListening(true)
        setState('recording')
        setRecordingTime(0)
        setTranscription('')
        
        // Start timer
        intervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      }
      
      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        fullTranscript += finalTranscript
        const displayTranscript = fullTranscript + interimTranscript
        setTranscription(displayTranscript)
      }
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        if (event.error === 'no-speech') {
          // Continue listening for more speech
          return
        }
        setState('error')
      }
      
      recognitionInstance.onend = () => {
        setIsListening(false)
        if (isRecording) {
          // If still recording, restart recognition
          setTimeout(() => {
            try {
              recognitionInstance.start()
            } catch (e) {
              console.log('Recognition restart failed:', e)
            }
          }, 100)
        }
      }
      
      setRecognition(recognitionInstance)
      recognitionInstance.start()
      
    } catch (error) {
      console.error('Error starting recording:', error)
      setState('error')
    }
  }

  // Stop recording
  const stopRecording = async () => {
    if (recognition) {
      recognition.stop()
      setRecognition(null)
    }
    
    setIsRecording(false)
    setIsListening(false)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    // Process the final transcription
    if (transcription.trim()) {
      setState('processing')
      await processTranscription(transcription)
    } else {
      setState('idle')
    }
  }

  // Process transcription using real API
  const processTranscription = async (transcript: string) => {
    try {
      const transcriptionText = transcript.trim()
      const confidence = transcriptionText.length > 10 ? 0.85 : 0.5

      // Submit to voice feedback API
      const submissionResponse = await fetch('/api/voice-feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: generateDemoUserID(), // In production, get from auth context
          transcript: transcriptionText,
          confidence,
          language: 'en-US',
          duration: recordingTime,
          context: {
            feedbackType: 'voice_training',
            source: 'training_dashboard'
          }
        })
      })

      const submissionData = await submissionResponse.json()

      if (submissionData.success) {
        setTranscription(transcriptionText)
        setInsights(submissionData.insights || [])
        setState('complete')
        
        // Callback with training data
        if (onTrainingComplete) {
          onTrainingComplete({
            sessionId: submissionData.submissionId || generateSessionID(),
            duration: recordingTime,
            transcription: transcriptionText,
            insights: submissionData.insights || [],
            confidence
          })
        }
      } else {
        throw new Error(submissionData.error || 'Failed to process voice feedback')
      }

    } catch (error) {
      console.error('Error processing audio:', error)
      setState('error')
      
      // Show error feedback but still call completion with basic data
      const fallbackTranscription = "Voice processing encountered an error, but your training attempt has been recorded."
      setTranscription(fallbackTranscription)
      setInsights(['Training session recorded (processing failed)'])
      
      if (onTrainingComplete) {
        onTrainingComplete({
          sessionId: `voice-error-${Date.now()}`,
          duration: recordingTime,
          transcription: fallbackTranscription,
          insights: ['Training session recorded (processing failed)'],
          confidence: 0
        })
      }
    }
  }

  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result.toString())
        } else {
          reject(new Error('Failed to convert blob to base64'))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Transcribe using Web Speech API
  const transcribeWithWebSpeech = (audioBlob: Blob): Promise<{transcript: string, confidence: number}> => {
    return new Promise((resolve, reject) => {
      // For demo purposes, we'll use a mock transcription
      // In production, you'd implement actual Web Speech API integration
      setTimeout(() => {
        resolve({
          transcript: "I'm looking for VP of Engineering candidates with experience scaling teams at SaaS companies. Technical background and leadership skills are important.",
          confidence: 0.85
        })
      }, 1500)
    })
  }

  // Fallback transcription when speech recognition fails
  const getFallbackTranscription = async (): Promise<string> => {
    const fallbackMessages = [
      "Training feedback received - focusing on leadership and technical expertise",
      "Voice training captured - emphasis on experience and team scaling",
      "Training input recorded - priorities around SaaS and technical leadership",
      "Feedback session completed - focusing on candidate experience and skills"
    ]
    
    return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)]
  }

  // Reset session
  const resetSession = () => {
    setState('idle')
    setRecordingTime(0)
    setTranscription('')
    setInsights([])
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Voice Training Session
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Speak naturally about what makes a good prospect for you
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recording Interface */}
          <div className="text-center space-y-4">
            {/* Recording Button */}
            <div className="relative">
              <Button
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                className={`w-20 h-20 rounded-full ${isRecording ? 'animate-pulse' : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={state === 'processing'}
              >
                {state === 'processing' ? (
                  <div className="animate-spin">
                    <Brain className="w-8 h-8" />
                  </div>
                ) : isRecording ? (
                  <Square className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </Button>
              
              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute -top-2 -right-2">
                  <div className="w-6 h-6 bg-red-500 rounded-full animate-pulse" />
                </div>
              )}
            </div>

            {/* Status and Timer */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Badge variant={
                  state === 'recording' ? 'destructive' :
                  state === 'processing' ? 'secondary' :
                  state === 'complete' ? 'default' :
                  state === 'error' ? 'destructive' : 'outline'
                }>
                  {state === 'idle' && 'Ready to record'}
                  {state === 'recording' && 'Recording...'}
                  {state === 'processing' && 'Processing audio...'}
                  {state === 'complete' && 'Training complete!'}
                  {state === 'error' && 'Error occurred'}
                </Badge>
              </div>
              
              {(isRecording || recordingTime > 0) && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {formatTime(recordingTime)}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={resetSession}
                disabled={state === 'recording' || state === 'processing'}
              >
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled
              >
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </Button>
            </div>
          </div>

          {/* Live Transcription Results */}
          {(transcription || isListening) && (
            <Card className={`transition-colors ${isListening ? 'bg-blue-50 border-blue-200' : 'bg-muted/50'}`}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Volume2 className={`w-4 h-4 ${isListening ? 'text-blue-600 animate-pulse' : ''}`} />
                  {isListening ? 'Live Transcription' : 'Transcription'}
                  {isListening && (
                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                      Live
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-sm italic ${isListening ? 'text-blue-700' : 'text-muted-foreground'}`}>
                  "{transcription || (isListening ? 'Listening for speech...' : '')}"
                  {isListening && <span className="animate-pulse">|</span>}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Extracted Insights */}
          {insights.length > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  AI Insights Extracted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {state === 'error' && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">
                    Unable to access microphone. Please check permissions.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {state === 'idle' && (
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <h4 className="text-sm font-medium mb-2">Voice Training Tips:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Speak clearly about your ideal prospect criteria</li>
                  <li>• Mention specific industries, roles, or company types</li>
                  <li>• Describe what makes someone a good fit for you</li>
                  <li>• Include any deal-breakers or red flags</li>
                  <li>• Be as specific as possible for better AI learning</li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Complete State Actions */}
          {state === 'complete' && (
            <div className="flex gap-3 justify-center">
              <Button onClick={resetSession} variant="outline">
                Record Another Session
              </Button>
              <Button>
                Apply Learning
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default VoiceTraining