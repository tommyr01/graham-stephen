/**
 * Enhanced Profile Research Component
 * Integrates implicit feedback collection with LinkedIn profile research
 */

"use client"

import * as React from "react"
import { useImplicitFeedback, useAutoSectionTracking, useElementVisibilityTracking } from "@/lib/hooks/use-implicit-feedback"
import { CommenterCard } from "@/components/ui/commenter-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  User, 
  Target, 
  TrendingUp, 
  Clock, 
  Star, 
  MessageSquare,
  ExternalLink,
  Copy,
  Save,
  Send,
  Eye,
  MousePointer,
  Brain,
  Search,
  FileText,
  Sparkles
} from "lucide-react"

interface ProfileAnalysisData {
  id: string
  name: string
  headline: string
  company?: any
  location: string
  profilePicture?: string
  industry?: string
  connections?: string
  experience?: any[]
  recentPosts?: any[]
  analysisData?: {
    relevanceScore: number
    confidence: "high" | "medium" | "low"
    matchedTerms: string[]
    explanation?: any
  }
}

interface EnhancedProfileResearchProps {
  initialProfile?: ProfileAnalysisData | null
  userId?: string
  onAnalyzeProfile?: (url: string) => Promise<void>
  onContactAction?: (action: string, details?: any) => void
  className?: string
}

export function EnhancedProfileResearch({
  initialProfile,
  userId,
  onAnalyzeProfile,
  onContactAction,
  className = ""
}: EnhancedProfileResearchProps) {
  const [profile, setProfile] = React.useState<ProfileAnalysisData | null>(initialProfile || null)
  const [profileUrl, setProfileUrl] = React.useState("")
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [notes, setNotes] = React.useState("")
  const [tags, setTags] = React.useState<string[]>([])
  const [newTag, setNewTag] = React.useState("")
  
  // Refs for visibility tracking
  const profileHeaderRef = React.useRef<HTMLDivElement>(null)
  const analysisRef = React.useRef<HTMLDivElement>(null)
  const postsRef = React.useRef<HTMLDivElement>(null)
  const actionsRef = React.useRef<HTMLDivElement>(null)

  // Initialize implicit feedback collection
  const {
    trackSearch,
    trackFormInteraction,
    recordAction,
    saveNow,
    sectionTracker
  } = useImplicitFeedback({
    profileUrl: profile?.id ? `https://linkedin.com/in/${profile.id}` : undefined,
    userId,
    componentName: 'ProfileResearch',
    trackSections: true,
    autoSave: true
  })

  // Auto-track sections as they become visible
  useElementVisibilityTracking(profileHeaderRef, 'profile_header', { 
    componentName: 'ProfileResearch',
    threshold: 0.3 
  })
  useElementVisibilityTracking(analysisRef, 'analysis_section', { 
    componentName: 'ProfileResearch',
    threshold: 0.3 
  })
  useElementVisibilityTracking(postsRef, 'posts_section', { 
    componentName: 'ProfileResearch',
    threshold: 0.3 
  })
  useElementVisibilityTracking(actionsRef, 'actions_section', { 
    componentName: 'ProfileResearch',
    threshold: 0.3 
  })

  // Handle profile URL change
  const handleProfileUrlChange = (url: string) => {
    setProfileUrl(url)
    trackFormInteraction('url_input', 'profileUrl', url)
  }

  // Handle profile analysis
  const handleAnalyze = async () => {
    if (!profileUrl.trim()) return

    setIsAnalyzing(true)
    sectionTracker.start('profile_analysis')
    
    try {
      // Track the search query
      trackSearch(profileUrl)
      
      // Call the analysis function
      if (onAnalyzeProfile) {
        await onAnalyzeProfile(profileUrl)
      }
      
      recordAction('profile_analyzed', {
        profileUrl,
        analysisTime: Date.now()
      })
    } catch (error) {
      recordAction('analysis_failed', {
        profileUrl,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsAnalyzing(false)
      sectionTracker.stop('profile_analysis')
    }
  }

  // Handle notes change
  const handleNotesChange = (value: string) => {
    setNotes(value)
    trackFormInteraction('notes_form', 'notes', value.length) // Track length, not content for privacy
  }

  // Handle tag addition
  const handleAddTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return
    
    const updatedTags = [...tags, newTag.trim()]
    setTags(updatedTags)
    setNewTag("")
    
    trackFormInteraction('tags_form', 'tags', updatedTags.length)
  }

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove)
    setTags(updatedTags)
    
    trackFormInteraction('tags_form', 'tags', updatedTags.length)
  }

  // Handle contact actions
  const handleContactAction = (action: string) => {
    sectionTracker.start('contact_action')
    
    recordAction(action, {
      profileId: profile?.id,
      profileName: profile?.name,
      notes: notes,
      tags: tags,
      actionTime: Date.now()
    })
    
    if (onContactAction) {
      onContactAction(action, {
        profileId: profile?.id,
        notes: notes,
        tags: tags
      })
    }
    
    sectionTracker.stop('contact_action')
  }

  // Handle copy actions
  const handleCopy = (text: string, context: string) => {
    navigator.clipboard.writeText(text)
    recordAction('copy_action', {
      context,
      textLength: text.length,
      profileId: profile?.id
    })
  }

  // Auto-save notes and tags
  React.useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (notes || tags.length > 0) {
        saveNow()
      }
    }, 5000) // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(saveTimer)
  }, [notes, tags, saveNow])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profile URL Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            LinkedIn Profile Research
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter LinkedIn profile URL..."
              value={profileUrl}
              onChange={(e) => handleProfileUrlChange(e.target.value)}
              className="flex-1"
              onFocus={() => sectionTracker.start('url_input_focus')}
              onBlur={() => sectionTracker.stop('url_input_focus')}
            />
            <Button 
              onClick={handleAnalyze}
              disabled={!profileUrl.trim() || isAnalyzing}
            >
              {isAnalyzing ? 'Analysing...' : 'Analyse'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Display Section */}
      {profile && (
        <div ref={profileHeaderRef} className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {profile.profilePicture && (
                  <img
                    src={profile.profilePicture}
                    alt={profile.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{profile.name}</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(profile.name, 'profile_name')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {profile.headline && (
                    <div className="flex items-center gap-2">
                      <p className="text-muted-foreground">{profile.headline}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(profile.headline, 'profile_headline')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {profile.company && (
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {typeof profile.company === 'string' ? profile.company : profile.company.name}
                      </span>
                    )}
                    {profile.location && (
                      <span>{profile.location}</span>
                    )}
                    {profile.connections && (
                      <span>{profile.connections} connections</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {profile.analysisData && (
            <div ref={analysisRef}>
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
                    Analysis Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Enhanced Relevance Score */}
                    <div className="group cursor-pointer hover:scale-105 transition-all duration-200 p-3 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className={`h-4 w-4 ${
                          profile.analysisData.relevanceScore >= 70 ? 'text-green-600' :
                          profile.analysisData.relevanceScore >= 40 ? 'text-yellow-600' : 'text-red-600'
                        }`} />
                        <span className="text-sm font-semibold text-gray-700">Match Power</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-bold ${
                          profile.analysisData.relevanceScore >= 70 ? 'text-green-600' :
                          profile.analysisData.relevanceScore >= 40 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {profile.analysisData.relevanceScore}
                        </span>
                        <span className="text-sm text-gray-500">/100</span>
                        <span className="ml-2 text-sm">
                          {profile.analysisData.relevanceScore >= 70 ? '🎯' :
                           profile.analysisData.relevanceScore >= 40 ? '⚡' : '💡'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-600">
                        {profile.analysisData.relevanceScore >= 70 ? 'Excellent match!' :
                         profile.analysisData.relevanceScore >= 40 ? 'Good potential' : 'Needs work'}
                      </p>
                    </div>
                    
                    {/* Enhanced Confidence */}
                    <div className="group cursor-pointer hover:scale-105 transition-all duration-200 p-3 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className={`h-4 w-4 ${
                          profile.analysisData.confidence === 'high' ? 'text-green-600' :
                          profile.analysisData.confidence === 'medium' ? 'text-yellow-600' : 'text-orange-600'
                        }`} />
                        <span className="text-sm font-semibold text-gray-700">AI Confidence</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`capitalize font-medium text-sm px-3 py-1 ${
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
                      <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-600">
                        {profile.analysisData.confidence === 'high' ? 'Very reliable' :
                         profile.analysisData.confidence === 'medium' ? 'Decent quality' : 'More data needed'}
                      </p>
                    </div>
                  </div>

                  {profile.analysisData.matchedTerms.length > 0 && (
                    <div>
                      <span className="text-sm font-medium mb-2 block">Matched Terms:</span>
                      <div className="flex flex-wrap gap-2">
                        {profile.analysisData.matchedTerms.map((term, index) => (
                          <Badge key={index} variant="secondary">
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Posts */}
          {profile.recentPosts && profile.recentPosts.length > 0 && (
            <div ref={postsRef}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Recent Posts ({profile.recentPosts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.recentPosts.slice(0, 3).map((post, index) => (
                      <div key={index} className="border rounded p-4 space-y-2">
                        <p className="text-sm line-clamp-3">{post.content}</p>
                        {post.engagement && (
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>{post.engagement.likes} likes</span>
                            <span>{post.engagement.comments} comments</span>
                            <span>{post.engagement.reposts} reposts</span>
                          </div>
                        )}
                        {post.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              window.open(post.url, '_blank')
                              recordAction('external_link_clicked', {
                                linkType: 'linkedin_post',
                                profileId: profile.id
                              })
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Post
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notes and Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Research Notes & Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Notes</label>
                <Textarea
                  placeholder="Add your research notes..."
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  onFocus={() => sectionTracker.start('notes_focus')}
                  onBlur={() => sectionTracker.stop('notes_focus')}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1"
                  />
                  <Button onClick={handleAddTag} disabled={!newTag.trim()}>
                    Add
                  </Button>
                </div>
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div ref={actionsRef}>
            <Card>
              <CardHeader>
                <CardTitle>Next Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button 
                    onClick={() => handleContactAction('contact')}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Contact
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => handleContactAction('save_for_later')}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save for Later
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => handleContactAction('skip')}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Skip
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedProfileResearch