/**
 * Voice Reasoning Capture Component
 * Records and transcribes voice notes for training decisions
 */

"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mic, MicOff, Square, Play, Pause, Loader2, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface VoiceReasoningCaptureProps {
  onReasoningCapture: (reasoning: {
    transcription: string;
    keyPoints: string[];
  }) => void
  placeholder?: string
  className?: string
}

export function VoiceReasoningCapture({ 
  onReasoningCapture, 
  placeholder = "Record your reasoning...",
  className 
}: VoiceReasoningCaptureProps) {
  const [isRecording, setIsRecording] = React.useState(false)
  const [isTranscribing, setIsTranscribing] = React.useState(false)
  const [recordingTime, setRecordingTime] = React.useState(0)
  const [transcription, setTranscription] = React.useState('')
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [hasRecording, setHasRecording] = React.useState(false)
  const [recordingError, setRecordingError] = React.useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = React.useState(false)
  
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const audioChunksRef = React.useRef<Blob[]>([])
  const audioUrlRef = React.useRef<string | null>(null)
  const audioElementRef = React.useRef<HTMLAudioElement | null>(null)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      setRecordingError(null)
      setPermissionDenied(false)
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser')
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        // Create audio URL for playback
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
        }
        audioUrlRef.current = URL.createObjectURL(audioBlob)
        setHasRecording(true)
        
        // Transcribe audio
        await transcribeAudio(audioBlob)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current.start(100) // Collect data every 100ms
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Failed to start recording:', error)
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setPermissionDenied(true)
          setRecordingError('Microphone access denied. Please allow microphone access and try again.')
        } else if (error.name === 'NotFoundError') {
          setRecordingError('No microphone found. Please connect a microphone and try again.')
        } else if (error.name === 'NotSupportedError') {
          setRecordingError('Audio recording is not supported in this browser.')
        } else {
          setRecordingError('Unable to access microphone. Please check your permissions and try again.')
        }
      } else {
        setRecordingError('An unexpected error occurred while accessing the microphone.')
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const playRecording = () => {
    if (audioUrlRef.current) {
      if (audioElementRef.current) {
        audioElementRef.current.pause()
      }
      
      audioElementRef.current = new Audio(audioUrlRef.current)
      audioElementRef.current.play()
      setIsPlaying(true)
      
      audioElementRef.current.onended = () => {
        setIsPlaying(false)
      }
    }
  }

  const stopPlayback = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true)
    
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      
      const response = await fetch('/api/v2/training/transcribe', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Transcription service not available')
        } else if (response.status === 413) {
          throw new Error('Recording too long - please keep under 2 minutes')
        } else if (response.status === 503) {
          throw new Error('Voice transcription temporarily unavailable - please type instead')
        } else if (response.status === 429) {
          throw new Error('Transcription service busy - please type your reasoning')
        } else {
          throw new Error(`Transcription failed (${response.status})`)
        }
      }
      
      const result = await response.json()
      
      if (result.success) {
        setTranscription(result.data.transcription)
        
        // Extract key points and submit reasoning
        const reasoning = {
          transcription: result.data.transcription,
          keyPoints: extractKeyPoints(result.data.transcription)
        }
        
        onReasoningCapture(reasoning)
        setRecordingError(null)
      } else {
        throw new Error(result.error || 'Transcription failed')
      }
      
    } catch (error) {
      console.error('Transcription failed:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('service not available')) {
          setTranscription('Voice transcription service unavailable. Please type your reasoning manually.')
          setRecordingError('Transcription service unavailable - manual input required')
        } else if (error.message.includes('too long')) {
          setRecordingError('Recording too long - please record a shorter message')
          setTranscription('')
        } else if (error.message.includes('temporarily unavailable') || error.message.includes('quota')) {
          setTranscription('Voice transcription temporarily unavailable due to high demand. Please type your reasoning.')
          setRecordingError('Transcription temporarily unavailable - please type instead')
        } else if (error.message.includes('busy') || error.message.includes('429')) {
          setTranscription('Transcription service is busy. Please type your reasoning.')
          setRecordingError('Service busy - please type your reasoning instead')
        } else {
          setTranscription('Transcription failed. Please type your reasoning manually.')
          setRecordingError('Transcription failed - you can type your reasoning instead')
        }
      } else {
        setTranscription('Transcription failed. Please type your reasoning manually.')
        setRecordingError('Transcription failed')
      }
    } finally {
      setIsTranscribing(false)
    }
  }

  const extractKeyPoints = (text: string): string[] => {
    // Simple key point extraction - in production this would use NLP
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
    return sentences.slice(0, 3).map(s => s.trim())
  }

  const handleManualTranscription = (value: string) => {
    setTranscription(value)
    
    if (value.trim()) {
      const reasoning = {
        transcription: value,
        keyPoints: extractKeyPoints(value)
      }
      onReasoningCapture(reasoning)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Recording Error Display */}
      {recordingError && (
        <div className={`p-3 rounded-lg border ${
          permissionDenied ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className={`h-4 w-4 ${
              permissionDenied ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <span className={`text-sm font-medium ${
              permissionDenied ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {permissionDenied ? 'Microphone Access Required' : 'Recording Issue'}
            </span>
          </div>
          <p className={`text-sm ${
            permissionDenied ? 'text-red-700' : 'text-yellow-700'
          }`}>
            {recordingError}
          </p>
          {permissionDenied && (
            <p className="text-xs text-red-600 mt-1">
              Click the microphone icon in your browser's address bar to allow access.
            </p>
          )}
        </div>
      )}
      
      {/* Recording Controls */}
      <div className="flex items-center space-x-2">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            variant="outline"
            size="sm"
            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            disabled={permissionDenied}
          >
            <Mic className="h-4 w-4 mr-2" />
            {permissionDenied ? 'Access Denied' : 'Record Voice Note'}
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            variant="destructive"
            size="sm"
            className="animate-pulse"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop Recording
          </Button>
        )}
        
        {isRecording && (
          <Badge variant="destructive" className="animate-pulse">
            Recording: {formatTime(recordingTime)}
          </Badge>
        )}
        
        {hasRecording && !isRecording && (
          <Button
            onClick={isPlaying ? stopPlayback : playRecording}
            variant="outline"
            size="sm"
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Play
              </>
            )}
          </Button>
        )}
        
        {isTranscribing && (
          <Badge variant="outline" className="bg-blue-50">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Transcribing...
          </Badge>
        )}
        
        {recordingTime > 0 && recordingTime < 120 && (
          <span className="text-xs text-white">
            Max 2 minutes
          </span>
        )}
        
        {recordingTime >= 120 && (
          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
            Max time reached
          </Badge>
        )}
      </div>

      {/* Transcription Text Area */}
      <Textarea
        value={transcription}
        onChange={(e) => handleManualTranscription(e.target.value)}
        placeholder={placeholder}
        className="min-h-[80px] resize-none"
        disabled={isTranscribing}
      />
      
      {/* Recording Instructions */}
      {!hasRecording && !transcription && !recordingError && (
        <p className="text-xs text-white">
          Click "Record Voice Note" to capture your reasoning, or type directly in the text area above. Keep recordings under 2 minutes for best results.
        </p>
      )}
      
      {recordingError && !permissionDenied && (
        <p className="text-xs text-gray-500">
          You can still type your reasoning manually in the text area above.
        </p>
      )}
      
      {/* Transcription Status */}
      {transcription && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-green-600">
            ✓ Reasoning captured ({transcription.length} characters)
          </p>
          <Button
            onClick={() => {
              setTranscription('')
              setHasRecording(false)
              setRecordingError(null)
              setPermissionDenied(false)
              if (audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current)
                audioUrlRef.current = null
              }
            }}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  )
}