/**
 * Training Mode Toggle Component - V2.0 Enhanced
 * Advanced toggle with analytics preview and learning insights
 */

"use client"

import * as React from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, AlertCircle, Target, Zap, Users, BarChart3 } from "lucide-react"

interface TrainingModeToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  className?: string
  trainingStats?: {
    totalDecisions: number
    accuracyRate: number
    patternsLearned: number
    lastTrainingSession?: string
  }
}

export function TrainingModeToggle({ enabled, onChange, className, trainingStats }: TrainingModeToggleProps) {
  const [isAnimating, setIsAnimating] = React.useState(false)
  
  const handleToggle = (newValue: boolean) => {
    setIsAnimating(true)
    onChange(newValue)
    setTimeout(() => setIsAnimating(false), 300)
  }
  return (
    <Card className={`border-l-4 transition-all duration-300 ${
      enabled 
        ? 'border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-blue-50/30' 
        : 'border-l-gray-300 hover:border-l-purple-300'
    } ${isAnimating ? 'scale-[1.02]' : ''} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg transition-all duration-300 ${
              enabled ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <Brain className={`h-5 w-5 ${enabled ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                AI Training Mode
                {enabled && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
              </CardTitle>
              {trainingStats && (
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {trainingStats.totalDecisions} decisions
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    {Math.round(trainingStats.accuracyRate * 100)}% accuracy
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {trainingStats.patternsLearned} patterns
                  </span>
                </div>
              )}
            </div>
          </div>
          <Switch
            id="training-mode"
            checked={enabled}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-purple-600"
          />
        </div>
        <CardDescription className="mt-2">
          {enabled ? (
            <span className="text-purple-700 flex items-start gap-2">
              <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Training mode is active. Your decisions will help train the AI to predict your preferences and improve future prospect evaluations.
              </span>
            </span>
          ) : (
            <span className="text-gray-600">
              <span className="text-white">Enable training mode to help the AI learn from your prospect evaluation decisions and provide predictive insights.</span>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      {enabled && (
        <CardContent className="pt-0 space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-2 text-purple-800">How AI Training Works:</p>
                <div className="grid gap-2 text-purple-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>After analyzing a prospect, you'll see predictive insights and training feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Make your OPPORTUNITY/NO OPPORTUNITY decision</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Record voice reasoning for complex decisions (optional)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>AI learns your patterns and improves future predictions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {trainingStats && trainingStats.totalDecisions > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Learning Progress
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{trainingStats.totalDecisions}</div>
                  <div className="text-xs text-gray-500">Training Decisions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{Math.round(trainingStats.accuracyRate * 100)}%</div>
                  <div className="text-xs text-gray-500">AI Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{trainingStats.patternsLearned}</div>
                  <div className="text-xs text-gray-500">Patterns Learned</div>
                </div>
              </div>
              {trainingStats.lastTrainingSession && (
                <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                  Last training session: {new Date(trainingStats.lastTrainingSession).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}