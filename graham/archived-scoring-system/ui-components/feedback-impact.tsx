"use client"

import * as React from "react"
import { TrendingUp, Target, Users, Lightbulb, Award, BarChart3, X, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Progress } from "./progress"
import { Badge } from "./badge"

interface FeedbackImpactProps {
  userId: string
  teamId?: string
  impactData?: {
    personalLearning: {
      feedbackCount: number
      accuracyImprovement: number
      recentFeedbackCount: number
      learningConfidence: number
    }
    teamLearning?: {
      teamAccuracy: number
      contributionRank: number
      benefitFromTeam: number
    }
    recentImprovements: Array<{
      area: string
      improvement: number
      description: string
    }>
    achievements: Array<{
      id: string
      title: string
      description: string
      unlockedAt: string
      type: 'feedback_streak' | 'accuracy_milestone' | 'team_contributor' | 'algorithm_trainer'
    }>
  }
  onClose?: () => void
  className?: string
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  value: string | number
  subtitle: string
  trend?: number
  color?: 'success' | 'warning' | 'primary' | 'muted'
  className?: string
}

function MetricCard({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  trend, 
  color = 'primary',
  className 
}: MetricCardProps) {
  return (
    <div className={cn(
      "p-4 rounded-lg border border-border bg-card/50",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon className={cn(
              "w-4 h-4",
              color === 'success' && "text-success",
              color === 'warning' && "text-warning",
              color === 'primary' && "text-primary",
              color === 'muted' && "text-muted-foreground"
            )} />
            <span className="text-caption font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-h3 font-bold text-foreground">
              {value}
            </div>
            <div className="text-caption text-muted-foreground">
              {subtitle}
            </div>
          </div>
        </div>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
            trend > 0 ? "bg-success/10 text-success" : 
            trend < 0 ? "bg-error/10 text-error" : 
            "bg-muted/20 text-muted-foreground"
          )}>
            {trend > 0 ? <ArrowUp className="w-3 h-3" /> : 
             trend < 0 ? <ArrowDown className="w-3 h-3" /> : null}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  )
}

const ACHIEVEMENT_ICONS = {
  feedback_streak: Target,
  accuracy_milestone: TrendingUp,
  team_contributor: Users,
  algorithm_trainer: Lightbulb
} as const

const ACHIEVEMENT_COLORS = {
  feedback_streak: 'text-primary',
  accuracy_milestone: 'text-success',
  team_contributor: 'text-warning',
  algorithm_trainer: 'text-purple-500'
} as const

export function FeedbackImpact({
  userId,
  teamId,
  impactData,
  onClose,
  className,
  ...props
}: FeedbackImpactProps) {
  // Mock data if not provided (for demonstration)
  const data = impactData || {
    personalLearning: {
      feedbackCount: 47,
      accuracyImprovement: 23,
      recentFeedbackCount: 8,
      learningConfidence: 0.85
    },
    teamLearning: teamId ? {
      teamAccuracy: 78,
      contributionRank: 3,
      benefitFromTeam: 15
    } : undefined,
    recentImprovements: [
      {
        area: 'Buying Signal Detection',
        improvement: 18,
        description: 'Better identification of purchase intent indicators'
      },
      {
        area: 'Role Seniority Assessment',
        improvement: 12,
        description: 'Improved accuracy in determining decision-making authority'
      },
      {
        area: 'Industry Classification',
        improvement: 9,
        description: 'More precise industry and sector categorization'
      }
    ],
    achievements: [
      {
        id: '1',
        title: 'Feedback Contributor',
        description: 'Provided feedback on 25 analyses',
        unlockedAt: '2025-01-10',
        type: 'feedback_streak' as const
      },
      {
        id: '2',
        title: 'Algorithm Trainer',
        description: 'Helped improve accuracy by 20%',
        unlockedAt: '2025-01-12',
        type: 'algorithm_trainer' as const
      }
    ]
  }

  return (
    <Card className={cn("bg-card border border-border rounded-xl shadow-sm", className)} {...props}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-h3 font-semibold">
            <Target className="w-6 h-6 text-primary" />
            Your Feedback Impact
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Close impact dashboard"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-body text-muted-foreground">
          See how your feedback is helping improve the relevance scoring algorithm
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Thank You Message */}
        <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Award className="w-4 h-4 text-success" />
            </div>
            <div className="space-y-1">
              <h4 className="text-body font-medium text-foreground">
                Thanks for your input!
              </h4>
              <p className="text-body-sm text-muted-foreground">
                Your feedback has helped improve scoring accuracy and makes the tool more effective for everyone.
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={Target}
            title="Feedback Given"
            value={data.personalLearning.feedbackCount}
            subtitle="Total contributions"
            color="primary"
          />
          <MetricCard
            icon={TrendingUp}
            title="Accuracy Gain"
            value={`+${data.personalLearning.accuracyImprovement}%`}
            subtitle="Personal improvement"
            trend={data.personalLearning.accuracyImprovement}
            color="success"
          />
          <MetricCard
            icon={BarChart3}
            title="Learning Score"
            value={`${Math.round(data.personalLearning.learningConfidence * 100)}%`}
            subtitle="Model confidence"
            color="warning"
          />
          <MetricCard
            icon={Users}
            title="Recent Activity"
            value={data.personalLearning.recentFeedbackCount}
            subtitle="Last 30 days"
            color="muted"
          />
        </div>

        {/* Team Performance (if part of a team) */}
        {data.teamLearning && (
          <div className="space-y-3">
            <h4 className="text-body font-medium text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Team Performance
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border border-border bg-card/50">
                <div className="space-y-2">
                  <div className="text-caption font-medium text-muted-foreground uppercase tracking-wide">
                    Team Accuracy
                  </div>
                  <div className="text-h4 font-bold text-foreground">
                    {data.teamLearning.teamAccuracy}%
                  </div>
                  <Progress 
                    value={data.teamLearning.teamAccuracy} 
                    className="h-2"
                  />
                </div>
              </div>
              <MetricCard
                icon={Award}
                title="Your Rank"
                value={`#${data.teamLearning.contributionRank}`}
                subtitle="Team contributor"
                color="primary"
              />
              <MetricCard
                icon={TrendingUp}
                title="Team Benefit"
                value={`+${data.teamLearning.benefitFromTeam}%`}
                subtitle="From team learning"
                trend={data.teamLearning.benefitFromTeam}
                color="success"
              />
            </div>
          </div>
        )}

        {/* Recent Improvements */}
        <div className="space-y-3">
          <h4 className="text-body font-medium text-foreground flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            Recent Improvements from Your Feedback
          </h4>
          <div className="space-y-2">
            {data.recentImprovements.map((improvement, index) => (
              <div 
                key={index}
                className="p-3 rounded-lg border border-border bg-card/30 hover:bg-card/50 transition-colors duration-150"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-body-sm font-medium text-foreground">
                    {improvement.area}
                  </div>
                  <Badge variant="outline" className="text-xs text-success border-success/30 bg-success/10">
                    +{improvement.improvement}%
                  </Badge>
                </div>
                <p className="text-caption text-muted-foreground">
                  {improvement.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-3">
          <h4 className="text-body font-medium text-foreground flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Your Achievements
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {data.achievements.map((achievement) => {
              const Icon = ACHIEVEMENT_ICONS[achievement.type]
              const colorClass = ACHIEVEMENT_COLORS[achievement.type]
              
              return (
                <div 
                  key={achievement.id}
                  className="p-3 rounded-lg border border-border bg-card/30 hover:bg-card/50 transition-colors duration-150"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className={cn("w-4 h-4", colorClass)} />
                    </div>
                    <div className="space-y-1">
                      <div className="text-body-sm font-medium text-foreground">
                        {achievement.title}
                      </div>
                      <p className="text-caption text-muted-foreground">
                        {achievement.description}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Encouragement */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-center">
          <div className="space-y-2">
            <h4 className="text-body font-medium text-foreground">
              Keep the feedback coming! 🚀
            </h4>
            <p className="text-body-sm text-muted-foreground max-w-md mx-auto">
              Every piece of feedback helps make the algorithm smarter and more accurate for you and your team.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-8 h-10 text-primary border-primary hover:bg-primary/10 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            Continue Research
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}