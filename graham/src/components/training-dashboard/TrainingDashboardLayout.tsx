"use client";

/**
 * Training Dashboard Layout - Main container and navigation for AI training interface
 * 
 * This component provides the overall layout structure for the training dashboard,
 * including navigation, real-time updates, and responsive design patterns.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, Target, Mic, Upload, User, BarChart3, 
  Activity, Clock, CheckCircle, AlertCircle, 
  TrendingUp, Users, Lightbulb, RefreshCw,
  Volume2, FileUp, Settings, Bell
} from 'lucide-react';

interface TrainingDashboardLayoutProps {
  userId: string;
  teamId?: string;
  className?: string;
}

interface DashboardData {
  systemHealth: {
    overallScore: number;
    accuracyTrend: number;
    patternDiscoveryRate: number;
    userSatisfactionScore: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'pattern_discovery' | 'training_completion' | 'validation' | 'milestone';
    title: string;
    description: string;
    timestamp: string;
    impact?: number;
  }>;
  pendingActions: {
    patternsToValidate: number;
    trainingOpportunities: number;
    updatesPending: number;
  };
  quickStats: {
    accuracyImprovement: number;
    trainingContributions: number;
    patternsValidated: number;
  };
}

export default function TrainingDashboardLayout({
  userId,
  teamId,
  className = ""
}: TrainingDashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: string }>>([]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/training/dashboard?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        // Set mock data for development
        setDashboardData(getMockDashboardData());
      }
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(getMockDashboardData());
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [userId]);

  // Manual refresh
  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (isLoading && !dashboardData) {
    return (
      <div className={`min-h-screen bg-gray-900 text-gray-100 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          <span className="ml-2 text-gray-400">Loading training dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-900 text-gray-100 ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-teal-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-100">Training Dashboard</h1>
                <p className="text-sm text-gray-400">
                  Help your AI learn and improve recommendation accuracy
                </p>
              </div>
            </div>
            {lastRefresh && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Notifications */}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="relative border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs px-1">
                  {notifications.length}
                </Badge>
              </Button>
            )}
            
            {/* Refresh Button */}
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            {/* Auto-refresh indicator */}
            <div className="flex items-center text-sm text-gray-400">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
              Auto-refresh on
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* System Health Overview */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              title="System Health"
              value={`${Math.round(dashboardData.systemHealth.overallScore * 100)}%`}
              icon={Activity}
              trend={dashboardData.systemHealth.accuracyTrend}
              color="text-teal-400"
            />
            <MetricCard
              title="Accuracy Improvement"
              value={`+${dashboardData.quickStats.accuracyImprovement}%`}
              icon={TrendingUp}
              trend={5.2}
              color="text-green-400"
            />
            <MetricCard
              title="Training Contributions"
              value={dashboardData.quickStats.trainingContributions.toString()}
              icon={Target}
              trend={12.1}
              color="text-blue-400"
            />
            <MetricCard
              title="Patterns Validated"
              value={dashboardData.quickStats.patternsValidated.toString()}
              icon={CheckCircle}
              trend={8.7}
              color="text-purple-400"
            />
          </div>
        )}

        {/* Quick Actions Bar */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <QuickActionCard
              icon={Mic}
              title="Voice Training"
              description="Natural conversation training"
              estimatedTime="5-15 min"
              estimatedImpact="12%"
              onClick={() => setActiveTab('voice-training')}
              className="bg-gradient-to-br from-purple-600/20 to-purple-500/10 border-purple-500/30 hover:border-purple-400"
            />
            <QuickActionCard
              icon={CheckCircle}
              title="Validate Patterns"
              description={`${dashboardData.pendingActions.patternsToValidate} patterns pending`}
              estimatedTime="2-5 min"
              estimatedImpact="8%"
              onClick={() => setActiveTab('patterns')}
              className="bg-gradient-to-br from-teal-600/20 to-teal-500/10 border-teal-500/30 hover:border-teal-400"
              badge={dashboardData.pendingActions.patternsToValidate > 0 ? dashboardData.pendingActions.patternsToValidate : undefined}
            />
            <QuickActionCard
              icon={Upload}
              title="Upload Examples"
              description="Bulk training examples"
              estimatedTime="10-30 min"
              estimatedImpact="25%"
              onClick={() => setActiveTab('bulk-training')}
              className="bg-gradient-to-br from-blue-600/20 to-blue-500/10 border-blue-500/30 hover:border-blue-400"
            />
            <QuickActionCard
              icon={BarChart3}
              title="View Progress"
              description="AI learning analytics"
              estimatedTime="5-10 min"
              estimatedImpact="Insight"
              onClick={() => setActiveTab('analytics')}
              className="bg-gradient-to-br from-green-600/20 to-green-500/10 border-green-500/30 hover:border-green-400"
            />
          </div>
        )}

        {/* Detailed Training Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-gray-800 border border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="patterns" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <Lightbulb className="h-4 w-4 mr-2" />
              Patterns
            </TabsTrigger>
            <TabsTrigger value="voice-training" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <Mic className="h-4 w-4 mr-2" />
              Voice Training
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <User className="h-4 w-4 mr-2" />
              My Profile
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewContent dashboardData={dashboardData} />
          </TabsContent>

          <TabsContent value="progress" className="mt-6">
            <ProgressContent userId={userId} />
          </TabsContent>

          <TabsContent value="patterns" className="mt-6">
            <PatternsContent userId={userId} />
          </TabsContent>

          <TabsContent value="voice-training" className="mt-6">
            <VoiceTrainingContent userId={userId} />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <ProfileContent userId={userId} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsContent userId={userId} teamId={teamId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color 
}: { 
  title: string; 
  value: string; 
  icon: any; 
  trend?: number; 
  color: string;
}) {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {trend !== undefined && (
              <p className={`text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}% from last period
              </p>
            )}
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Action Card Component
function QuickActionCard({
  icon: Icon,
  title,
  description,
  estimatedTime,
  estimatedImpact,
  onClick,
  className = "",
  badge
}: {
  icon: any;
  title: string;
  description: string;
  estimatedTime: string;
  estimatedImpact: string;
  onClick: () => void;
  className?: string;
  badge?: number;
}) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:scale-102 hover:shadow-lg bg-gray-800 border-gray-700 ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="p-3 bg-gray-700 rounded-lg">
              <Icon className="h-6 w-6 text-white" />
            </div>
            {badge && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 min-w-[1.5rem] h-6 flex items-center justify-center">
                {badge}
              </Badge>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-100 mb-2">{title}</h3>
            <p className="text-sm text-gray-400 mb-3">{description}</p>
            <div className="flex gap-4 text-xs text-teal-400">
              <span>⏱ {estimatedTime}</span>
              <span>📈 {estimatedImpact}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Placeholder Content Components
function OverviewContent({ dashboardData }: { dashboardData: DashboardData | null }) {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Recent Learning Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData?.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 py-3 border-b border-gray-700 last:border-0">
              <div className="p-2 bg-teal-600 rounded-full">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-100">{activity.title}</h4>
                <p className="text-sm text-gray-400">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
              </div>
              {activity.impact && (
                <Badge className="bg-green-600 text-white">
                  +{activity.impact}% impact
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ProgressContent({ userId }: { userId: string }) {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">AI Learning Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Overall Accuracy</span>
                <span>87%</span>
              </div>
              <Progress value={87} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Pattern Learning</span>
                <span>92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Personal Customisation</span>
                <span>78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PatternsContent({ userId }: { userId: string }) {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Pattern Validation Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Pattern validation interface will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function VoiceTrainingContent({ userId }: { userId: string }) {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Voice Training Interface
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Enhanced voice training interface will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileContent({ userId }: { userId: string }) {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Personal Intelligence Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Personal AI profile and customisation will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsContent({ userId, teamId }: { userId: string; teamId?: string }) {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Training Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Comprehensive training analytics will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Mock data for development
function getMockDashboardData(): DashboardData {
  return {
    systemHealth: {
      overallScore: 0.87,
      accuracyTrend: 5.2,
      patternDiscoveryRate: 3.4,
      userSatisfactionScore: 0.82
    },
    recentActivity: [
      {
        id: '1',
        type: 'pattern_discovery',
        title: 'New Pattern Discovered',
        description: 'AI learned that you prefer prospects with 5+ years SaaS experience',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        impact: 12
      },
      {
        id: '2',
        type: 'training_completion',
        title: 'Voice Training Completed',
        description: 'Processed 8 training examples with 94% confidence',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        impact: 8
      },
      {
        id: '3',
        type: 'milestone',
        title: 'Accuracy Milestone Reached',
        description: 'Your personal AI accuracy reached 90% for the first time',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    pendingActions: {
      patternsToValidate: 3,
      trainingOpportunities: 2,
      updatesPending: 1
    },
    quickStats: {
      accuracyImprovement: 15,
      trainingContributions: 47,
      patternsValidated: 23
    }
  };
}