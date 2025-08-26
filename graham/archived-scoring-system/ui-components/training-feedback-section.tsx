/**
 * Training Feedback Section Component
 * Captures Graham's decisions and reasoning for AI training
 */

"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { VoiceReasoningCapture } from "@/components/ui/voice-reasoning-capture"
import { Loader2, CheckCircle, UserCheck, UserX, Brain, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TrainingFeedbackSectionProps {
  profile: any
  aiPrediction?: any
  onFeedback: (decision: 'contact' | 'skip', reasoning?: {
    transcription: string;
    keyPoints: string[];
  }) => Promise<void>
  isSubmitting?: boolean
  className?: string
}

export function TrainingFeedbackSection({ 
  profile, 
  aiPrediction,
  onFeedback, 
  isSubmitting = false,
  className 
}: TrainingFeedbackSectionProps) {
  const [decision, setDecision] = React.useState<'contact' | 'skip' | null>(null)
  const [voiceReasoning, setVoiceReasoning] = React.useState<{
    transcription: string;
    keyPoints: string[];
  } | null>(null)
  const [decisionStartTime] = React.useState(Date.now())
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = async () => {
    if (!decision) return;

    const decisionTime = Date.now() - decisionStartTime;
    
    try {
      await onFeedback(decision, voiceReasoning || undefined);
      setSubmitted(true);
      
      // Reset form after brief delay
      setTimeout(() => {
        setDecision(null);
        setVoiceReasoning(null);
        setSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit training feedback:', error);
    }
  };


  if (submitted) {
    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Training feedback submitted successfully!</span>
          </div>
          <p className="text-center text-sm text-green-600 mt-2">
            The AI is learning from your decision to improve future predictions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-l-4 border-l-purple-500 bg-purple-50/30 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <span>Training Feedback</span>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            Learning Mode
          </Badge>
        </CardTitle>
        <CardDescription>
          Help the AI learn by sharing your decision on this prospect. Your feedback improves future predictions.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Decision Selection */}
        <div>
          <label className="text-sm font-medium text-white mb-3 block">
            Is this an opportunity worth pursuing?
          </label>
          <div className="flex space-x-4">
            <Button
              variant={decision === 'contact' ? 'default' : 'outline'}
              onClick={() => setDecision('contact')}
              className={`flex-1 h-12 ${
                decision === 'contact' 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'border-green-300 text-green-700 hover:bg-green-50'
              }`}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              OPPORTUNITY
            </Button>
            <Button
              variant={decision === 'skip' ? 'default' : 'outline'}
              onClick={() => setDecision('skip')}
              className={`flex-1 h-12 ${
                decision === 'skip' 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'border-red-300 text-red-700 hover:bg-red-50'
              }`}
            >
              <UserX className="h-4 w-4 mr-2" />
              NO OPPORTUNITY
            </Button>
          </div>
        </div>


        {/* Voice Reasoning (Optional) */}
        {decision && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-white">
              Voice Reasoning (Optional)
            </label>
            <p className="text-xs text-white">
              Record your thought process to help the AI understand your decision-making patterns.
            </p>
            <VoiceReasoningCapture
              onReasoningCapture={setVoiceReasoning}
              placeholder="Explain your reasoning for this decision..."
            />
            
            {voiceReasoning && (
              <div className="bg-white border rounded-md p-3 mt-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Captured Reasoning:</p>
                <p className="text-sm text-gray-600 italic">"{voiceReasoning.transcription}"</p>
                {voiceReasoning.keyPoints.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-700 mb-1">Key Points:</p>
                    <ul className="text-xs text-gray-600 list-disc list-inside">
                      {voiceReasoning.keyPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center text-sm text-white">
            <Clock className="h-4 w-4 mr-1" />
            Decision time: {Math.round((Date.now() - decisionStartTime) / 1000)}s
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!decision || isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Learning...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Submit & Train AI
              </>
            )}
          </Button>
        </div>

        {/* AI Prediction Comparison */}
        {decision && aiPrediction && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-blue-800">
                AI vs Your Decision:
              </p>
              <Badge variant="outline" className={`${
                decision === aiPrediction.predictedDecision
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : 'bg-orange-100 text-orange-700 border-orange-300'
              }`}>
                {decision === aiPrediction.predictedDecision ? 'MATCH' : 'DIFFERENT'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-medium text-blue-700 mb-1">AI Predicted:</p>
                <p className={`${aiPrediction.predictedDecision === 'contact' ? 'text-green-600' : 'text-orange-600'}`}>
                  {aiPrediction.predictedDecision.toUpperCase()} ({Math.round(aiPrediction.confidence)}% confident)
                </p>
              </div>
              <div>
                <p className="font-medium text-blue-700 mb-1">Your Decision:</p>
                <p className={`${decision === 'contact' ? 'text-green-600' : 'text-orange-600'}`}>
                  {decision === 'contact' ? 'OPPORTUNITY' : 'NO OPPORTUNITY'}
                </p>
              </div>
            </div>
            {decision !== aiPrediction.predictedDecision && (
              <p className="text-xs text-blue-600 mt-2 italic">
                🧠 This disagreement will help the AI learn your unique preferences!
              </p>
            )}
          </div>
        )}
        
        {/* Learning Impact Preview */}
        {decision && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-3 mt-4">
            <p className="text-sm font-medium text-purple-800 mb-1">
              Learning Impact Preview:
            </p>
            <p className="text-xs text-purple-700">
              {decision === 'contact' 
                ? `✓ AI will learn that prospects with similar profiles and ${profile.analysisData?.relevanceScore?.toFixed(1)}/10 relevance scores are good opportunities.`
                : `✗ AI will learn to avoid prospects with similar characteristics and content patterns.`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}