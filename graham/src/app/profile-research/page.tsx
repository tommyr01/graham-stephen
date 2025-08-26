"use client"

import * as React from "react"
import { LinkedInProfileUrlInput } from "@/components/ui/linkedin-profile-url-input"
import { CommenterCard } from "@/components/ui/commenter-card"
import { CommenterCardSkeleton } from "@/components/ui/skeleton"
import { ErrorMessage, ErrorBoundary } from "@/components/ui/error-boundary"
import { MobileNav } from "@/components/ui/mobile-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PostFeedbackControls } from "@/components/ui/post-feedback-controls"
import { VoiceFeedback } from "@/components/ui/voice-feedback"
// Removed scoring/training-related imports
import { User, Target, TrendingUp, ArrowLeft, AlertTriangle, Building2, MapPin, Clock, ThumbsUp, MessageCircle, Repeat2, ChevronDown, ChevronUp, Briefcase, ExternalLink, Brain, Search, FileText, Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { generateDemoUserID } from "@/lib/utils/uuid"

interface AnalysisData {
  relevanceScore: number
  confidence: "high" | "medium" | "low"
  matchedTerms: string[]
  recentPosts?: Array<{
    id: string
    content: string
    publishedAt: string
    engagement: {
      likes: number
      comments: number
      reposts: number
    }
    relevanceContribution?: number
    images?: string[]
    postType?: string
    url?: string
  }>
  explanation?: {
    matchedBoostTerms?: { term: string; weight: number }[]
    matchedDownTerms?: { term: string; weight: number }[]
    contentAnalysis?: {
      businessRelevant: number
      promotional: number
      personal: number
    }
    // V2.0 Enhanced Analysis Fields
    aiPrediction?: any
    experienceAnalysis?: {
      yearsInIndustry: number
      careerConsistency: number
      credibilitySignals: string[]
    }
    contentIntelligence?: {
      overallQuality: 'high' | 'medium' | 'low'
      authenticityScore: number
      expertiseLevel: number
      aiContentPercentage: number
      redFlagCount: number
    }
  }
}

interface ProfileWithAnalysis {
  id: string
  name: string
  headline: string
  profileUrl: string
  profilePicture: string | null
  location: string
  company: string
  analysisData?: AnalysisData
  isAnalyzing?: boolean
  experience?: Array<{
    title: string
    company: string
    description?: string
    duration?: string
    start_date?: any
    end_date?: any
    is_current?: boolean
  }>
}

function ProfileResearchPageContent() {
  const [url, setUrl] = React.useState("")
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [analysisError, setAnalysisError] = React.useState<string | null>(null)
  const [profile, setProfile] = React.useState<ProfileWithAnalysis | null>(null)
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  
  // V2.0 Training Mode State
  const [trainingMode, setTrainingMode] = React.useState(false)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = React.useState(false)
  const [analysisStartTime, setAnalysisStartTime] = React.useState<number>(Date.now())
  
  // V2.0 AI Prediction State
  const [aiPrediction, setAiPrediction] = React.useState<any>(null)
  const [isGeneratingPrediction, setIsGeneratingPrediction] = React.useState(false)
  const [trainingStats, setTrainingStats] = React.useState<any>(null)
  const [predictionError, setPredictionError] = React.useState<string | null>(null)
  const [trainingStatsError, setTrainingStatsError] = React.useState<string | null>(null)

  // Mock user data for feedback system
  const [userId] = React.useState(generateDemoUserID()) // Would come from auth context
  const [teamId] = React.useState("team-456") // Would come from user profile
  
  // Integrated analysis view state
  const [postFeedback, setPostFeedback] = React.useState<Record<string, -1 | 0 | 1 | null>>({})
  const [showVoiceFeedback, setShowVoiceFeedback] = React.useState(false)
  const [isExperienceExpanded, setIsExperienceExpanded] = React.useState(false)
  
  // Load training stats when training mode is enabled
  React.useEffect(() => {
    if (trainingMode && !trainingStats) {
      loadTrainingStats()
    }
  }, [trainingMode])
  
  const loadTrainingStats = async () => {
    try {
      setTrainingStatsError(null)
      const response = await fetch('/api/v2/analytics/metrics')
      if (response.ok) {
        const stats = await response.json()
        setTrainingStats({
          totalDecisions: stats.totalDecisions || 0,
          accuracyRate: stats.accuracyRate || 0.0,
          patternsLearned: stats.patternsLearned || 0,
          lastTrainingSession: stats.lastTrainingSession
        })
      } else {
        // Provide fallback data if API is not available
        console.warn('Training stats API not available, using mock data')
        setTrainingStats({
          totalDecisions: 0,
          accuracyRate: 0.0,
          patternsLearned: 0,
          lastTrainingSession: null
        })
      }
    } catch (error) {
      console.error('Failed to load training stats:', error)
      setTrainingStatsError('Unable to load training statistics')
      // Provide fallback data
      setTrainingStats({
        totalDecisions: 0,
        accuracyRate: 0.0,
        patternsLearned: 0,
        lastTrainingSession: null
      })
    }
  }

  // Handle training feedback submission
  const handleTrainingFeedback = React.useCallback(async (
    decision: 'contact' | 'skip',
    reasoning?: { transcription: string; keyPoints: string[] }
  ) => {
    if (!profile) return;
    
    setIsSubmittingFeedback(true);
    
    try {
      const trainingDecision = {
        prospectId: profile.id,
        decision,
        confidence: 8, // Default high confidence since Graham will be confident after experience
        decisionTime: Date.now() - analysisStartTime,
        voiceNote: reasoning,
        prospectSnapshot: {
          basicInfo: {
            id: profile.id,
            name: profile.name,
            headline: profile.headline,
            company: profile.company,
            location: profile.location
          },
          recentPosts: profile.analysisData?.recentPosts || [],
          contentAnalysis: profile.analysisData?.explanation?.contentAnalysis,
          experienceAnalysis: profile.experience,
          systemScore: profile.analysisData?.relevanceScore
        },
        systemScore: profile.analysisData?.relevanceScore,
        sessionContext: {
          trainingModeEnabled: true,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent
        }
      };
      
      const response = await fetch('/api/v2/training/decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trainingDecision)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit training feedback');
      }
      
      const result = await response.json();
      console.log('Training feedback submitted successfully:', result);
      
    } catch (error) {
      console.error('Failed to submit training feedback:', error);
      throw error;
    } finally {
      setIsSubmittingFeedback(false);
    }
  }, [profile, analysisStartTime]);

  // Analyse LinkedIn profile with V2.0 enhanced scoring
  const handleAnalyzeProfile = React.useCallback(async (profileUrl: string) => {
    setIsAnalyzing(true)
    setAnalysisError(null)
    setProfile(null)
    setAnalysisStartTime(Date.now())
    
    try {
      // Step 1: Get basic profile data from legacy endpoint
      const response = await fetch('/api/dev/profile-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileUrl }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to analyse profile')
      }
      
      const data = await response.json()
      setSessionId(data.sessionId)
      
      // Step 2: Get V2.0 AI prediction for enhanced analysis
      let aiPrediction = null;
      try {
        const predictionResponse = await fetch('/api/v2/prediction/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prospectId: data.commenter.id,
            prospectData: {
              id: data.commenter.id,
              name: data.commenter.name,
              headline: data.commenter.headline,
              company: typeof data.commenter.company === 'string' ? data.commenter.company : (data.commenter.company?.name || ''),
              location: data.commenter.location,
              industry: data.commenter.industry || 'Unknown',
              role: data.commenter.headline || 'Unknown',
              experience: data.commenter.experience || [],
              recentPosts: data.commenter.recentPosts || [],
              profileUrl: data.commenter.profileUrl,
              profilePicture: data.commenter.profilePicture
            }
          })
        });
        
        if (predictionResponse.ok) {
          const predictionData = await predictionResponse.json();
          aiPrediction = predictionData.data.prediction;
        }
      } catch (predictionError) {
        console.warn('V2.0 prediction failed, using legacy scoring:', predictionError);
      }
      
      // Create enhanced analysis data combining legacy + V2.0 results
      const analysisDataObj: AnalysisData = {
        // Use V2.0 AI prediction score if available, otherwise fall back to legacy
        relevanceScore: aiPrediction ? 
          Math.max(0, Math.min(10, Math.abs(aiPrediction.scoreBreakdown.finalScore))) : // Use absolute value and cap at 10
          data.score,
        confidence: aiPrediction ? 
          (aiPrediction.confidence >= 80 ? 'high' : aiPrediction.confidence >= 60 ? 'medium' : 'low') :
          (data.confidence > 0.8 ? 'high' : data.confidence > 0.5 ? 'medium' : 'low'),
        matchedTerms: data.explanation?.matchedBoostTerms?.map((term: any) => term.term) || [],
        recentPosts: data.commenter.recentPosts?.map((post: any) => ({
          id: post.id,
          content: post.content,
          publishedAt: post.publishedAt,
          engagement: post.engagement,
          relevanceContribution: Math.round(Math.random() * 4 - 1) // Mock relevance contribution
        })) || [],
        explanation: {
          ...data.explanation,
          // Add V2.0 enhanced analysis if available
          aiPrediction: aiPrediction,
          experienceAnalysis: aiPrediction ? {
            yearsInIndustry: aiPrediction.reasoning.experienceMatch.yearsInIndustry,
            careerConsistency: aiPrediction.reasoning.experienceMatch.careerConsistency,
            credibilitySignals: aiPrediction.reasoning.experienceMatch.credibilitySignals
          } : undefined,
          contentIntelligence: aiPrediction ? aiPrediction.reasoning.contentQuality : undefined
        }
      }
      
      // Create profile object
      const profileData: ProfileWithAnalysis = {
        id: data.commenter.id,
        name: data.commenter.name,
        headline: data.commenter.headline,
        profileUrl: data.commenter.profileUrl,
        profilePicture: data.commenter.profilePicture,
        location: data.commenter.location,
        company: typeof data.commenter.company === 'string' ? data.commenter.company : (data.commenter.company?.name || ''),
        analysisData: analysisDataObj,
        experience: data.commenter.experience || [],
      }
      
      setProfile(profileData)
      
      // Generate AI prediction if training mode is enabled
      if (trainingMode) {
        await generateAIPrediction(profileData)
      }
      
    } catch (error) {
      console.error('Error analysing profile:', error)
      setAnalysisError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsAnalyzing(false)
    }
  }, [])
  
  // Generate AI prediction for the prospect
  const generateAIPrediction = React.useCallback(async (profileData: ProfileWithAnalysis) => {
    if (!trainingMode) return
    
    setIsGeneratingPrediction(true)
    setPredictionError(null)
    
    try {
      const response = await fetch('/api/v2/prediction/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prospect: {
            id: profileData.id,
            name: profileData.name,
            headline: profileData.headline,
            company: profileData.company,
            location: profileData.location,
            industry: 'Technology', // Would be extracted from profile
            role: profileData.headline || 'Unknown',
            experience: profileData.experience || [],
            recentPosts: profileData.analysisData?.recentPosts || [],
            profileUrl: profileData.profileUrl,
            profilePicture: profileData.profilePicture
          }
        })
      })
      
      if (response.ok) {
        const prediction = await response.json()
        setAiPrediction(prediction.data)
      } else {
        const errorText = await response.text()
        console.error('AI prediction failed:', errorText)
        
        // Check if it's a specific error we can handle gracefully
        if (response.status === 404) {
          setPredictionError('AI prediction service not available yet')
        } else if (response.status === 429) {
          setPredictionError('Too many requests - please try again later')
        } else {
          setPredictionError('Unable to generate AI prediction')
        }
      }
    } catch (error) {
      console.error('Failed to generate AI prediction:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setPredictionError('Network error - check your connection')
      } else {
        setPredictionError('AI prediction service unavailable')
      }
    } finally {
      setIsGeneratingPrediction(false)
    }
  }, [trainingMode])

  // Reset to start over
  const handleStartOver = React.useCallback(() => {
    setUrl("")
    setProfile(null)
    setAnalysisError(null)
    setSessionId(null)
    setAnalysisStartTime(Date.now())
    setAiPrediction(null)
    setIsGeneratingPrediction(false)
    setPredictionError(null)
    setTrainingStatsError(null)
    setPostFeedback({})
    setShowVoiceFeedback(false)
    setIsExperienceExpanded(false)
  }, [])

  // Handle post-level feedback
  const handlePostFeedback = React.useCallback((postId: string, feedback: -1 | 0 | 1 | null) => {
    setPostFeedback(prev => ({
      ...prev,
      [postId]: feedback
    }))
  }, [])

  // Handle voice feedback
  const handleVoiceFeedbackSubmitted = (feedbackResult: any) => {
    console.log('Voice feedback submitted successfully:', feedbackResult)
    setShowVoiceFeedback(false)
  }

  const handleVoiceFeedbackError = (error: string) => {
    console.error('Voice feedback error:', error)
  }

  // Format helper functions
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
      
      if (diffHours < 24) {
        return `${diffHours}h ago`
      }
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays < 7) {
        return `${diffDays}d ago`
      }
      const diffWeeks = Math.ceil(diffDays / 7)
      return `${diffWeeks}w ago`
    } catch {
      return dateString
    }
  }

  const formatEngagement = (engagement: { likes: number; comments: number; reposts: number }) => {
    const { likes, comments, reposts } = engagement
    return { likes, comments, reposts }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/10">
      <MobileNav />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Skip Navigation */}
        <a href="#main-content" className="skip-link focus-ring">
          Skip to main content
        </a>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
          <h1 className="text-h1 font-bold text-foreground mb-2">
            LinkedIn Profile Research
          </h1>
          <p className="text-body-lg text-muted-foreground">
            Analyse any LinkedIn profile to get detailed insights, relevance scoring, and recent post analysis.
          </p>
        </div>

        {/* Main Content */}
        <main id="main-content">
          {/* Training mode functionality removed */}
          
          {/* URL Input Section */}
          {!profile && !isAnalyzing && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Analyse LinkedIn Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LinkedInProfileUrlInput
                  value={url}
                  onChange={setUrl}
                  onSubmit={handleAnalyzeProfile}
                  isLoading={isAnalyzing}
                  error={analysisError || undefined}
                />
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {analysisError && (
            <ErrorMessage
              title="Analysis Failed"
              message={analysisError}
              onRetry={() => {
                setAnalysisError(null)
                if (url.trim()) {
                  handleAnalyzeProfile(url.trim())
                }
              }}
              className="mb-8"
            />
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Analysing Profile...
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Fetching profile data and analysing recent posts for relevance insights.
                  </p>
                  <CommenterCardSkeleton />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results Section - Integrated Analysis View */}
          {profile && !isAnalyzing && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="flex items-center justify-between">
                <h2 className="text-h2 font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Profile Analysis
                </h2>
                <Button
                  onClick={handleStartOver}
                  variant="outline"
                  className="gap-2"
                >
                  <User className="w-4 h-4" />
                  Analyse Another Profile
                </Button>
              </div>

              {/* Integrated Analysis Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel - Profile Summary & Analysis */}
                <div className="space-y-4">
                  {/* Profile Header */}
                  <Card>
                    <CardHeader className="pb-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <Avatar className="w-16 h-16 flex-shrink-0">
                          {profile.profilePicture ? (
                            <img 
                              src={profile.profilePicture} 
                              alt={`${profile.name} profile picture`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                              {profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                          )}
                        </Avatar>

                        {/* Profile Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-h3 font-semibold text-foreground truncate">
                                {profile.name}
                              </h3>
                              {profile.headline && (
                                <p className="text-body text-muted-foreground line-clamp-2 mt-1">
                                  {profile.headline}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-caption text-muted-foreground">
                                {(typeof profile.company === 'string' ? profile.company : profile.company?.name) && (
                                  <div className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    <span className="truncate">{typeof profile.company === 'string' ? profile.company : profile.company?.name}</span>
                                  </div>
                                )}
                                {profile.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">{profile.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {profile.profileUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => window.open(profile.profileUrl, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  LinkedIn
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Analysis Summary - Whimsical Edition */}
                  {profile.analysisData && (
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
                      <CardHeader className="border-b">
                        <CardTitle className="text-h4 flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
                          Analysis Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Relevance Score - The Star Metric */}
                          <div className="group cursor-pointer hover:scale-105 transition-transform duration-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className={`h-4 w-4 ${
                                (profile.analysisData.relevanceScore || 0) >= 7 ? 'text-green-600' :
                                (profile.analysisData.relevanceScore || 0) >= 4 ? 'text-yellow-600' : 'text-red-600'
                              }`} />
                              <p className="font-semibold text-white">Match Magic</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <p className={`text-2xl font-bold ${
                                (profile.analysisData.relevanceScore || 0) >= 7 ? 'text-green-600' :
                                (profile.analysisData.relevanceScore || 0) >= 4 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {(profile.analysisData.relevanceScore || 0).toFixed(1)}
                              </p>
                              <p className="text-sm text-white">/10</p>
                              <span className="ml-2 text-xs">
                                {(profile.analysisData.relevanceScore || 0) >= 7 ? '🎯' :
                                 (profile.analysisData.relevanceScore || 0) >= 4 ? '⚡' : '💡'}
                              </span>
                            </div>
                            <p className="text-xs text-white mt-1 group-hover:text-gray-200 transition-colors">
                              {(profile.analysisData.relevanceScore || 0) >= 7 ? 'Perfect match!' :
                               (profile.analysisData.relevanceScore || 0) >= 4 ? 'Good potential' : 'Keep exploring'}
                            </p>
                          </div>

                          {/* Confidence Level */}
                          <div className="group cursor-pointer hover:scale-105 transition-transform duration-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className={`h-4 w-4 ${
                                profile.analysisData.confidence === 'high' ? 'text-green-600' :
                                profile.analysisData.confidence === 'medium' ? 'text-yellow-600' : 'text-orange-600'
                              }`} />
                              <p className="font-semibold text-white">AI Confidence</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`capitalize font-medium ${
                                profile.analysisData.confidence === 'high' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                profile.analysisData.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                                'bg-orange-100 text-orange-700 hover:bg-orange-200'
                              }`}>
                                {profile.analysisData.confidence}
                              </Badge>
                              <span className="text-sm">
                                {profile.analysisData.confidence === 'high' ? '🚀' :
                                 profile.analysisData.confidence === 'medium' ? '🎲' : '🔍'}
                              </span>
                            </div>
                            <p className="text-xs text-white mt-1 group-hover:text-gray-200 transition-colors">
                              {profile.analysisData.confidence === 'high' ? 'Rock solid analysis' :
                               profile.analysisData.confidence === 'medium' ? 'Pretty good intel' : 'Need more data'}
                            </p>
                          </div>

                          {/* Matched Terms */}
                          <div className="group cursor-pointer hover:scale-105 transition-transform duration-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Search className={`h-4 w-4 ${
                                profile.analysisData.matchedTerms.length > 5 ? 'text-green-600' :
                                profile.analysisData.matchedTerms.length > 0 ? 'text-blue-600' : 'text-gray-400'
                              }`} />
                              <p className="font-semibold text-white">Keywords Found</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <p className={`text-2xl font-bold ${
                                profile.analysisData.matchedTerms.length > 5 ? 'text-green-600' :
                                profile.analysisData.matchedTerms.length > 0 ? 'text-blue-600' : 'text-gray-400'
                              }`}>
                                {profile.analysisData.matchedTerms.length}
                              </p>
                              <p className="text-sm text-white">terms</p>
                              <span className="ml-2 text-xs">
                                {profile.analysisData.matchedTerms.length > 5 ? '🎊' :
                                 profile.analysisData.matchedTerms.length > 0 ? '✨' : '🕵️'}
                              </span>
                            </div>
                            <p className="text-xs text-white mt-1 group-hover:text-gray-200 transition-colors">
                              {profile.analysisData.matchedTerms.length > 5 ? 'Keyword jackpot!' :
                               profile.analysisData.matchedTerms.length > 0 ? 'Good connections' : 'Keep digging'}
                            </p>
                          </div>

                          {/* Recent Posts */}
                          <div className="group cursor-pointer hover:scale-105 transition-transform duration-200">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className={`h-4 w-4 ${
                                (profile.analysisData.recentPosts?.length || 0) > 10 ? 'text-green-600' :
                                (profile.analysisData.recentPosts?.length || 0) > 0 ? 'text-blue-600' : 'text-gray-400'
                              }`} />
                              <p className="font-semibold text-white">Content Intel</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <p className={`text-2xl font-bold ${
                                (profile.analysisData.recentPosts?.length || 0) > 10 ? 'text-green-600' :
                                (profile.analysisData.recentPosts?.length || 0) > 0 ? 'text-blue-600' : 'text-gray-400'
                              }`}>
                                {profile.analysisData.recentPosts?.length || 0}
                              </p>
                              <p className="text-sm text-white">posts</p>
                              <span className="ml-2 text-xs">
                                {(profile.analysisData.recentPosts?.length || 0) > 10 ? '📚' :
                                 (profile.analysisData.recentPosts?.length || 0) > 0 ? '📄' : '📭'}
                              </span>
                            </div>
                            <p className="text-xs text-white mt-1 group-hover:text-gray-200 transition-colors">
                              {(profile.analysisData.recentPosts?.length || 0) > 10 ? 'Rich data source' :
                               (profile.analysisData.recentPosts?.length || 0) > 0 ? 'Some insights' : 'Limited content'}
                            </p>
                          </div>
                        </div>

                      </CardContent>
                    </Card>
                  )}

                  {/* Professional Experience */}
                  {profile.experience && profile.experience.length > 0 && (
                    <Card>
                      <CardHeader>
                        <button
                          onClick={() => setIsExperienceExpanded(!isExperienceExpanded)}
                          className="w-full flex items-center justify-between text-left hover:bg-muted/30 -m-2 p-2 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            <CardTitle className="text-h4">Professional Experience</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {profile.experience.length} positions
                            </Badge>
                          </div>
                          {isExperienceExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {/* Always show first 2 positions */}
                          {profile.experience.slice(0, 2).map((job, index) => (
                            <div key={index} className="border-l-2 border-primary/20 pl-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{job.title}</h4>
                                  <p className="text-sm text-muted-foreground">{job.company}</p>
                                  {job.duration && (
                                    <p className="text-xs text-muted-foreground">{job.duration}</p>
                                  )}
                                </div>
                                {job.is_current && (
                                  <Badge variant="outline" className="text-xs">Current</Badge>
                                )}
                              </div>
                              {job.description && (
                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                  {job.description}
                                </p>
                              )}
                            </div>
                          ))}

                          {/* Additional positions when expanded */}
                          {isExperienceExpanded && profile.experience.length > 2 && (
                            <div className="max-h-64 overflow-y-auto space-y-4 pt-2 border-t">
                              {profile.experience.slice(2).map((job, index) => (
                                <div key={index + 2} className="border-l-2 border-muted pl-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-sm">{job.title}</h4>
                                      <p className="text-sm text-muted-foreground">{job.company}</p>
                                      {job.duration && (
                                        <p className="text-xs text-muted-foreground">{job.duration}</p>
                                      )}
                                    </div>
                                    {job.is_current && (
                                      <Badge variant="outline" className="text-xs">Current</Badge>
                                    )}
                                  </div>
                                  {job.description && (
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                      {job.description}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Voice Feedback Section */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-h4">Provide Feedback</CardTitle>
                          <p className="text-body-sm text-muted-foreground mt-1">
                            Share your insights about this profile
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowVoiceFeedback(!showVoiceFeedback)}
                          className={showVoiceFeedback ? 'bg-purple-100 text-purple-700' : ''}
                        >
                          {showVoiceFeedback ? 'Hide' : 'Show'} Voice Feedback
                        </Button>
                      </div>
                    </CardHeader>
                    {showVoiceFeedback && (
                      <CardContent>
                        <VoiceFeedback
                          sessionId={sessionId || undefined}
                          commenterId={profile.id}
                          analysisId={profile.analysisData ? `analysis-${profile.id}` : undefined}
                          userId={userId}
                          teamId={teamId}
                          analysisData={profile.analysisData}
                          onFeedbackSubmitted={handleVoiceFeedbackSubmitted}
                          onError={handleVoiceFeedbackError}
                        />
                      </CardContent>
                    )}
                  </Card>
                </div>

                {/* Right Panel - Provide Feedback and Recent Posts */}
                <div className="space-y-4">
                  {/* Voice Feedback Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-h4">Provide Feedback</CardTitle>
                      <p className="text-body-sm text-muted-foreground">
                        Help improve our analysis by sharing your insights about this profile
                      </p>
                    </CardHeader>
                    <CardContent>
                      <VoiceFeedback
                        onTrainingComplete={(data) => {
                          console.log('Voice feedback completed:', data)
                        }}
                        className="mb-4"
                      />
                    </CardContent>
                  </Card>

                  {/* Recent Posts Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-h4">Recent Posts</CardTitle>
                      <p className="text-body-sm text-muted-foreground">
                        Analyse recent LinkedIn posts and provide feedback
                      </p>
                    </CardHeader>
                    <CardContent>
                      {profile.analysisData?.recentPosts && profile.analysisData.recentPosts.length > 0 ? (
                        <div className="space-y-4 max-h-[900px] overflow-y-auto pr-2">
                          {profile.analysisData.recentPosts.map((post) => {
                            const engagement = formatEngagement(post.engagement)
                            return (
                              <Card key={post.id} className="hover:bg-muted/30 transition-colors duration-200">
                                <CardContent className="p-4">
                                  {/* Post Header */}
                                  <div className="flex items-start gap-3 mb-3">
                                    <Avatar className="w-8 h-8">
                                      {profile.profilePicture ? (
                                        <img 
                                          src={profile.profilePicture} 
                                          alt={profile.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
                                          {profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </div>
                                      )}
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-body-sm font-medium text-foreground">
                                        {profile.name}
                                      </p>
                                      <p className="text-caption text-muted-foreground">
                                        {formatDate(post.publishedAt)}
                                      </p>
                                    </div>
                                    {post.relevanceContribution !== undefined && (
                                      <Badge
                                        variant={post.relevanceContribution > 0 ? "default" : "secondary"}
                                        className={cn(
                                          "text-xs",
                                          post.relevanceContribution > 0 
                                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                                            : post.relevanceContribution < 0
                                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                                            : "bg-muted text-muted-foreground"
                                        )}
                                      >
                                        {post.relevanceContribution > 0 ? '+' : ''}{post.relevanceContribution}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Post Content */}
                                  <div className="space-y-3">
                                    <p className="text-body-sm text-foreground leading-relaxed whitespace-pre-line">
                                      {post.content}
                                    </p>

                                    {/* Engagement Stats and Post Feedback */}
                                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                      <div className="flex items-center gap-4 text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <ThumbsUp className="w-3 h-3" />
                                          <span className="text-xs">{engagement.likes}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <MessageCircle className="w-3 h-3" />
                                          <span className="text-xs">{engagement.comments}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Repeat2 className="w-3 h-3" />
                                          <span className="text-xs">{engagement.reposts}</span>
                                        </div>
                                      </div>
                                      
                                      {/* Post Feedback Controls */}
                                      {/* Removed post feedback controls */}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No recent posts available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {/* AI Prediction Loading State */}
              {isGeneratingPrediction && (
                <Card className="border-purple-200 bg-purple-50/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center space-x-2 text-purple-700">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      <span className="font-medium">Generating AI prediction...</span>
                    </div>
                    <p className="text-center text-sm text-purple-600 mt-2">
                      Analysing patterns from your training decisions
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {/* AI Prediction Error State */}
              {predictionError && (
                <Card className="border-orange-200 bg-orange-50/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2 text-orange-700 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">AI Prediction Unavailable</span>
                    </div>
                    <p className="text-sm text-orange-600 mb-3">{predictionError}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => profile && generateAIPrediction(profile)}
                      className="text-orange-700 border-orange-300 hover:bg-orange-100"
                    >
                      Retry Prediction
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Empty State */}
          {!profile && !isAnalyzing && !analysisError && (
            <Card className="text-center py-12">
              <CardContent>
                <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-h3 font-semibold mb-2">Ready to Analyse</h3>
                <p className="text-body text-muted-foreground max-w-md mx-auto">
                  Enter a LinkedIn profile URL above to get detailed insights, relevance scoring, and recent post analysis.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}

export default function ProfileResearchPage() {
  return (
    <ErrorBoundary>
      <ProfileResearchPageContent />
    </ErrorBoundary>
  )
}