/**
 * Similar Prospects Display Component - V2.0
 * Shows prospects similar to current one from training data
 */

"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { 
  Users, 
  TrendingUp, 
  ExternalLink,
  CheckCircle,
  XCircle,
  Building2,
  MapPin,
  Star,
  MessageSquare,
  Calendar
} from "lucide-react"

interface SimilarProspect {
  prospectId: string
  name: string
  headline: string
  company: string
  location: string
  profilePicture?: string
  profileUrl?: string
  similarity: number
  grahamDecision: 'contact' | 'skip'
  grahamConfidence: number
  matchingFactors: string[]
  originalReasoning?: string
  outcome?: {
    contacted: boolean
    responded: boolean
    meetingHeld: boolean
    dealClosed: boolean
  }
  decisionDate: string
}

interface SimilarProspectsDisplayProps {
  currentProspectId: string
  similarProspects: SimilarProspect[]
  className?: string
  compact?: boolean
  maxDisplay?: number
}

export function SimilarProspectsDisplay({ 
  currentProspectId,
  similarProspects,
  className,
  compact = false,
  maxDisplay = 5
}: SimilarProspectsDisplayProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  
  const displayProspects = isExpanded ? similarProspects : similarProspects.slice(0, maxDisplay)
  const contactDecisions = similarProspects.filter(p => p.grahamDecision === 'contact').length
  const skipDecisions = similarProspects.filter(p => p.grahamDecision === 'skip').length
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'text-green-600 bg-green-100 border-green-300'
    if (similarity >= 0.6) return 'text-yellow-600 bg-yellow-100 border-yellow-300'
    return 'text-orange-600 bg-orange-100 border-orange-300'
  }

  const getOutcomeStatus = (outcome?: SimilarProspect['outcome']) => {
    if (!outcome) return null
    
    if (outcome.dealClosed) return { label: 'Deal Closed', color: 'text-green-600', icon: Star }
    if (outcome.meetingHeld) return { label: 'Meeting Held', color: 'text-blue-600', icon: Calendar }
    if (outcome.responded) return { label: 'Responded', color: 'text-purple-600', icon: MessageSquare }
    if (outcome.contacted) return { label: 'Contacted', color: 'text-gray-600', icon: CheckCircle }
    
    return null
  }

  if (!similarProspects || similarProspects.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2" />
            <p>No similar prospects found</p>
            <p className="text-sm">Continue training to build comparison data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Similar Prospects
          </CardTitle>
          <CardDescription>
            {similarProspects.length} similar prospects from your training data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{contactDecisions}</div>
              <div className="text-xs text-muted-foreground">Contacted</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{skipDecisions}</div>
              <div className="text-xs text-muted-foreground">Skipped</div>
            </div>
          </div>
          
          <div className="space-y-2">
            {displayProspects.slice(0, 3).map((prospect) => (
              <div key={prospect.prospectId} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-6 h-6">
                    {prospect.profilePicture ? (
                      <img src={prospect.profilePicture} alt={prospect.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
                        {getInitials(prospect.name)}
                      </div>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium truncate">{prospect.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{prospect.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getSimilarityColor(prospect.similarity)}>
                    {Math.round(prospect.similarity * 100)}%
                  </Badge>
                  {prospect.grahamDecision === 'contact' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-orange-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {similarProspects.length > 3 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-2"
            >
              {isExpanded ? 'Show Less' : `Show ${similarProspects.length - 3} More`}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Similar Prospects Analysis
            </CardTitle>
            <CardDescription>
              {similarProspects.length} prospects with similar profiles from your training decisions
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{Math.round((contactDecisions / similarProspects.length) * 100)}%</div>
            <div className="text-xs text-muted-foreground">Contact Rate</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Decision Summary */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Contacted</span>
            </div>
            <div className="text-xl font-bold text-green-600">{contactDecisions}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((contactDecisions / similarProspects.length) * 100)}% of similar prospects
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Skipped</span>
            </div>
            <div className="text-xl font-bold text-orange-600">{skipDecisions}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((skipDecisions / similarProspects.length) * 100)}% of similar prospects
            </div>
          </div>
        </div>

        {/* Individual Prospects */}
        <div className="space-y-3">
          {displayProspects.map((prospect) => {
            const outcomeStatus = getOutcomeStatus(prospect.outcome)
            
            return (
              <Card key={prospect.prospectId} className={`${
                prospect.grahamDecision === 'contact' 
                  ? 'border-green-200 bg-green-50/30' 
                  : 'border-orange-200 bg-orange-50/30'
              }`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-10 h-10">
                        {prospect.profilePicture ? (
                          <img src={prospect.profilePicture} alt={prospect.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                            {getInitials(prospect.name)}
                          </div>
                        )}
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{prospect.name}</h4>
                          {prospect.profileUrl && (
                            <a
                              href={prospect.profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary-dark"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{prospect.headline}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {prospect.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {prospect.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getSimilarityColor(prospect.similarity)}>
                        {Math.round(prospect.similarity * 100)}% similar
                      </Badge>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`${
                          prospect.grahamDecision === 'contact'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : 'bg-orange-100 text-orange-700 border-orange-300'
                        }`}>
                          {prospect.grahamDecision === 'contact' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {prospect.grahamDecision.toUpperCase()}
                        </Badge>
                        
                        <span className="text-xs text-muted-foreground">
                          {prospect.grahamConfidence}/10
                        </span>
                      </div>
                      
                      {outcomeStatus && (
                        <Badge variant="outline" className={`text-xs ${outcomeStatus.color}`}>
                          <outcomeStatus.icon className="h-3 w-3 mr-1" />
                          {outcomeStatus.label}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Matching Factors */}
                  {prospect.matchingFactors.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Matching Factors:</p>
                      <div className="flex flex-wrap gap-1">
                        {prospect.matchingFactors.map((factor, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Original Reasoning */}
                  {prospect.originalReasoning && (
                    <div className="mt-3 p-2 bg-white border border-gray-200 rounded text-xs">
                      <p className="font-medium text-muted-foreground mb-1">Original Reasoning:</p>
                      <p className="text-muted-foreground italic line-clamp-2">
                        "{prospect.originalReasoning}"
                      </p>
                    </div>
                  )}

                  {/* Decision Date */}
                  <div className="mt-2 text-xs text-muted-foreground">
                    Decision made: {new Date(prospect.decisionDate).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Show More/Less Button */}
        {similarProspects.length > maxDisplay && (
          <Button 
            variant="outline" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {isExpanded ? 'Show Less' : `Show ${similarProspects.length - maxDisplay} More Similar Prospects`}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}