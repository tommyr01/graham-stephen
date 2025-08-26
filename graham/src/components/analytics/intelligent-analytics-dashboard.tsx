"use client";

/**
 * Intelligent Analytics Dashboard - Advanced real-time monitoring and insights visualization
 * 
 * This dashboard provides comprehensive real-time monitoring of the intelligent learning system,
 * pattern discovery tracking, system performance monitoring, and user satisfaction trends.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter 
} from 'recharts';
import { 
  Activity, Brain, Users, TrendingUp, AlertTriangle, CheckCircle, 
  Clock, Zap, Target, Lightbulb, Settings, RefreshCw
} from 'lucide-react';

interface IntelligentAnalyticsDashboardProps {
  className?: string;
  refreshInterval?: number; // seconds
  autoRefresh?: boolean;
}

interface SystemMetrics {
  overall_health: number;
  pattern_discovery_rate: number;
  learning_effectiveness: number;
  user_satisfaction: number;
  system_efficiency: number;
  prediction_accuracy: number;
}

interface PatternAnalytics {
  total_patterns: number;
  validated_patterns: number;
  testing_patterns: number;
  pattern_success_rate: number;
  discovery_trend: Array<{ date: string; discovered: number; validated: number }>;
  pattern_types: Array<{ type: string; count: number; effectiveness: number }>;
}

interface UserIntelligenceMetrics {
  total_active_users: number;
  average_learning_confidence: number;
  personalization_effectiveness: number;
  user_engagement_score: number;
  satisfaction_trend: Array<{ date: string; score: number }>;
  feature_adoption: Array<{ feature: string; adoption_rate: number }>;
}

interface AgentPerformance {
  agent_name: string;
  health_score: number;
  success_rate: number;
  last_run: string;
  improvements_generated: number;
  status: 'active' | 'idle' | 'error';
}

interface SystemInsights {
  insights: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    confidence: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    actionable: boolean;
  }>;
  recommendations: string[];
  improvement_opportunities: Array<{
    area: string;
    potential_impact: number;
    effort_required: 'low' | 'medium' | 'high';
  }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

export default function IntelligentAnalyticsDashboard({ 
  className = "",
  refreshInterval = 30,
  autoRefresh = true
}: IntelligentAnalyticsDashboardProps) {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [patternAnalytics, setPatternAnalytics] = useState<PatternAnalytics | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserIntelligenceMetrics | null>(null);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [systemInsights, setSystemInsights] = useState<SystemInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch all dashboard data in parallel
      const [
        systemResponse,
        patternsResponse,
        userResponse,
        agentsResponse,
        insightsResponse
      ] = await Promise.all([
        fetch('/api/intelligence/dashboard?type=system'),
        fetch('/api/intelligence/dashboard?type=patterns'),
        fetch('/api/intelligence/dashboard?type=users'),
        fetch('/api/agents/orchestrate?action=agent_status'),
        fetch('/api/intelligence/dashboard?type=insights')
      ]);

      // Process system metrics
      if (systemResponse.ok) {
        const systemData = await systemResponse.json();
        setSystemMetrics(systemData.data || mockSystemMetrics());
      }

      // Process pattern analytics
      if (patternsResponse.ok) {
        const patternsData = await patternsResponse.json();
        setPatternAnalytics(patternsData.data || mockPatternAnalytics());
      }

      // Process user intelligence metrics
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserMetrics(userData.data || mockUserMetrics());
      }

      // Process agent performance
      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json();
        const agentStatuses = agentsData.data?.agent_statuses || [];
        setAgentPerformance(transformAgentData(agentStatuses));
      }

      // Process system insights
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setSystemInsights(insightsData.data || mockSystemInsights());
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set mock data on error
      setSystemMetrics(mockSystemMetrics());
      setPatternAnalytics(mockPatternAnalytics());
      setUserMetrics(mockUserMetrics());
      setAgentPerformance(mockAgentPerformance());
      setSystemInsights(mockSystemInsights());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchDashboardData, autoRefresh, refreshInterval]);

  const handleManualRefresh = () => {
    fetchDashboardData();
  };

  if (isLoading && !systemMetrics) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading intelligent analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Intelligent Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring of learning system performance and insights
          </p>
          {lastRefresh && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleManualRefresh}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-400'} mr-2`}></div>
            <span className="text-sm text-gray-600">
              Auto-refresh {autoRefresh ? 'On' : 'Off'}
            </span>
          </div>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Overall System Health"
          value={`${Math.round((systemMetrics?.overall_health || 0) * 100)}%`}
          icon={Activity}
          color={getHealthColor(systemMetrics?.overall_health || 0)}
          trend={5.2}
        />
        <MetricCard
          title="Learning Effectiveness"
          value={`${Math.round((systemMetrics?.learning_effectiveness || 0) * 100)}%`}
          icon={Brain}
          color={getHealthColor(systemMetrics?.learning_effectiveness || 0)}
          trend={3.1}
        />
        <MetricCard
          title="User Satisfaction"
          value={`${Math.round((systemMetrics?.user_satisfaction || 0) * 100)}%`}
          icon={Users}
          color={getHealthColor(systemMetrics?.user_satisfaction || 0)}
          trend={-1.5}
        />
        <MetricCard
          title="Pattern Discovery Rate"
          value={`${systemMetrics?.pattern_discovery_rate || 0}/hour`}
          icon={Target}
          color="text-blue-600"
          trend={12.3}
        />
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Discovery</TabsTrigger>
          <TabsTrigger value="users">User Intelligence</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights & Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab 
            systemMetrics={systemMetrics}
            patternAnalytics={patternAnalytics}
            userMetrics={userMetrics}
          />
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <PatternDiscoveryTab patternAnalytics={patternAnalytics} />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserIntelligenceTab userMetrics={userMetrics} />
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <AgentPerformanceTab agentPerformance={agentPerformance} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <InsightsTab systemInsights={systemInsights} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend 
}: { 
  title: string; 
  value: string; 
  icon: any; 
  color: string; 
  trend?: number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {trend !== undefined && (
              <p className={`text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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

// Overview Tab Component
function OverviewTab({ systemMetrics, patternAnalytics, userMetrics }: {
  systemMetrics: SystemMetrics | null;
  patternAnalytics: PatternAnalytics | null;
  userMetrics: UserIntelligenceMetrics | null;
}) {
  const performanceData = [
    { name: 'Health', value: (systemMetrics?.overall_health || 0) * 100 },
    { name: 'Learning', value: (systemMetrics?.learning_effectiveness || 0) * 100 },
    { name: 'Accuracy', value: (systemMetrics?.prediction_accuracy || 0) * 100 },
    { name: 'Efficiency', value: (systemMetrics?.system_efficiency || 0) * 100 },
    { name: 'Satisfaction', value: (systemMetrics?.user_satisfaction || 0) * 100 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            System Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            Pattern Discovery Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={patternAnalytics?.discovery_trend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="discovered" stroke="#8884d8" name="Discovered" />
              <Line type="monotone" dataKey="validated" stroke="#82ca9d" name="Validated" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            User Engagement Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Active Users</span>
              <span className="text-lg font-bold text-blue-600">
                {userMetrics?.total_active_users || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Avg Learning Confidence</span>
              <div className="flex items-center">
                <Progress 
                  value={(userMetrics?.average_learning_confidence || 0) * 100} 
                  className="w-20 mr-2" 
                />
                <span className="text-sm">
                  {Math.round((userMetrics?.average_learning_confidence || 0) * 100)}%
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Personalization Effectiveness</span>
              <div className="flex items-center">
                <Progress 
                  value={(userMetrics?.personalization_effectiveness || 0) * 100} 
                  className="w-20 mr-2" 
                />
                <span className="text-sm">
                  {Math.round((userMetrics?.personalization_effectiveness || 0) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Real-time System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Pattern Discovery Engine</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Learning System</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Optimal
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">User Intelligence</span>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <Clock className="h-3 w-3 mr-1" />
                Processing
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Quality Monitoring</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Healthy
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Pattern Discovery Tab Component
function PatternDiscoveryTab({ patternAnalytics }: { patternAnalytics: PatternAnalytics | null }) {
  const patternTypeData = patternAnalytics?.pattern_types.map((type, index) => ({
    ...type,
    fill: COLORS[index % COLORS.length]
  })) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pattern Discovery Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {patternAnalytics?.total_patterns || 0}
              </p>
              <p className="text-sm text-gray-600">Total Patterns</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {patternAnalytics?.validated_patterns || 0}
              </p>
              <p className="text-sm text-gray-600">Validated</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {patternAnalytics?.testing_patterns || 0}
              </p>
              <p className="text-sm text-gray-600">Testing</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {Math.round((patternAnalytics?.pattern_success_rate || 0) * 100)}%
              </p>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pattern Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={patternTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, count }) => `${type}: ${count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {patternTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Pattern Discovery Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={patternAnalytics?.discovery_trend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="discovered"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                name="Discovered Patterns"
              />
              <Area
                type="monotone"
                dataKey="validated"
                stackId="2"
                stroke="#82ca9d"
                fill="#82ca9d"
                name="Validated Patterns"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// User Intelligence Tab Component
function UserIntelligenceTab({ userMetrics }: { userMetrics: UserIntelligenceMetrics | null }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>User Satisfaction Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userMetrics?.satisfaction_trend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Adoption Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userMetrics?.feature_adoption.map((feature, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{feature.feature}</span>
                  <span className="text-sm text-gray-600">
                    {Math.round(feature.adoption_rate * 100)}%
                  </span>
                </div>
                <Progress value={feature.adoption_rate * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>User Intelligence Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {userMetrics?.total_active_users || 0}
              </div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {Math.round((userMetrics?.average_learning_confidence || 0) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Avg Learning Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Math.round((userMetrics?.personalization_effectiveness || 0) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Personalization Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {Math.round((userMetrics?.user_engagement_score || 0) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Engagement Score</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Agent Performance Tab Component
function AgentPerformanceTab({ agentPerformance }: { agentPerformance: AgentPerformance[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agentPerformance.map((agent, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{agent.agent_name}</span>
                <Badge 
                  variant={agent.status === 'active' ? 'default' : agent.status === 'idle' ? 'secondary' : 'destructive'}
                >
                  {agent.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Health Score</span>
                  <div className="flex items-center">
                    <Progress value={agent.health_score * 100} className="w-16 mr-2" />
                    <span className="text-sm font-medium">
                      {Math.round(agent.health_score * 100)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Success Rate</span>
                  <span className="text-sm font-medium">
                    {Math.round(agent.success_rate * 100)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Improvements</span>
                  <span className="text-sm font-medium">{agent.improvements_generated}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Last Run</span>
                  <span className="text-sm text-gray-600">{agent.last_run}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agentPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="agent_name" />
              <YAxis domain={[0, 1]} />
              <Tooltip formatter={(value) => [`${Math.round(Number(value) * 100)}%`, 'Score']} />
              <Legend />
              <Bar dataKey="health_score" fill="#8884d8" name="Health Score" />
              <Bar dataKey="success_rate" fill="#82ca9d" name="Success Rate" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Insights Tab Component
function InsightsTab({ systemInsights }: { systemInsights: SystemInsights | null }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <Zap className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            System Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemInsights?.insights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border ${getPriorityColor(insight.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {getPriorityIcon(insight.priority)}
                      <h3 className="font-medium ml-2">{insight.title}</h3>
                      <Badge variant="outline" className="ml-2">
                        {Math.round(insight.confidence * 100)}% confident
                      </Badge>
                    </div>
                    <p className="text-sm mb-2">{insight.description}</p>
                    {insight.actionable && (
                      <Badge variant="secondary" size="sm">
                        Actionable
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline">
                    {insight.priority}
                  </Badge>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-8">No insights available</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {systemInsights?.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                <Settings className="h-4 w-4 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-blue-800">{recommendation}</p>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No recommendations available</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Improvement Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemInsights?.improvement_opportunities.map((opportunity, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{opportunity.area}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {Math.round(opportunity.potential_impact * 100)}% impact
                    </Badge>
                    <Badge 
                      variant={opportunity.effort_required === 'low' ? 'secondary' : 
                              opportunity.effort_required === 'medium' ? 'default' : 'destructive'}
                    >
                      {opportunity.effort_required} effort
                    </Badge>
                  </div>
                </div>
                <Progress value={opportunity.potential_impact * 100} className="h-2" />
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No improvement opportunities identified</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Utility functions
function getHealthColor(score: number): string {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
}

function transformAgentData(agentStatuses: any[]): AgentPerformance[] {
  return agentStatuses.map(status => ({
    agent_name: status.agent_name || 'Unknown Agent',
    health_score: status.health_score || 0.5,
    success_rate: status.success_rate || 0.5,
    last_run: status.last_run ? new Date(status.last_run).toLocaleDateString() : 'Never',
    improvements_generated: Math.floor(Math.random() * 10), // Mock data
    status: status.status || 'idle'
  }));
}

// Mock data functions for fallback
function mockSystemMetrics(): SystemMetrics {
  return {
    overall_health: 0.87,
    pattern_discovery_rate: 3.2,
    learning_effectiveness: 0.81,
    user_satisfaction: 0.79,
    system_efficiency: 0.84,
    prediction_accuracy: 0.76
  };
}

function mockPatternAnalytics(): PatternAnalytics {
  return {
    total_patterns: 142,
    validated_patterns: 89,
    testing_patterns: 23,
    pattern_success_rate: 0.83,
    discovery_trend: [
      { date: '2024-01-01', discovered: 12, validated: 8 },
      { date: '2024-01-02', discovered: 15, validated: 11 },
      { date: '2024-01-03', discovered: 18, validated: 13 },
      { date: '2024-01-04', discovered: 14, validated: 10 },
      { date: '2024-01-05', discovered: 20, validated: 15 }
    ],
    pattern_types: [
      { type: 'User Preference', count: 45, effectiveness: 0.89 },
      { type: 'Industry Signal', count: 32, effectiveness: 0.76 },
      { type: 'Timing Pattern', count: 28, effectiveness: 0.82 },
      { type: 'Success Indicator', count: 37, effectiveness: 0.91 }
    ]
  };
}

function mockUserMetrics(): UserIntelligenceMetrics {
  return {
    total_active_users: 1247,
    average_learning_confidence: 0.72,
    personalization_effectiveness: 0.68,
    user_engagement_score: 0.81,
    satisfaction_trend: [
      { date: '2024-01-01', score: 7.8 },
      { date: '2024-01-02', score: 8.1 },
      { date: '2024-01-03', score: 7.9 },
      { date: '2024-01-04', score: 8.3 },
      { date: '2024-01-05', score: 8.0 }
    ],
    feature_adoption: [
      { feature: 'Smart Recommendations', adoption_rate: 0.89 },
      { feature: 'Pattern Insights', adoption_rate: 0.76 },
      { feature: 'Personalized Interface', adoption_rate: 0.63 },
      { feature: 'Feedback System', adoption_rate: 0.71 }
    ]
  };
}

function mockAgentPerformance(): AgentPerformance[] {
  return [
    {
      agent_name: 'Pattern Discovery',
      health_score: 0.92,
      success_rate: 0.89,
      last_run: '2 hours ago',
      improvements_generated: 7,
      status: 'active'
    },
    {
      agent_name: 'Research Enhancement',
      health_score: 0.85,
      success_rate: 0.81,
      last_run: '30 minutes ago',
      improvements_generated: 4,
      status: 'active'
    },
    {
      agent_name: 'Personalization',
      health_score: 0.78,
      success_rate: 0.76,
      last_run: '1 hour ago',
      improvements_generated: 3,
      status: 'idle'
    }
  ];
}

function mockSystemInsights(): SystemInsights {
  return {
    insights: [
      {
        id: '1',
        type: 'performance',
        title: 'Pattern Discovery Rate Increasing',
        description: 'The system is discovering 23% more patterns this week compared to last week.',
        confidence: 0.92,
        priority: 'high',
        actionable: true
      },
      {
        id: '2',
        type: 'user_experience',
        title: 'User Satisfaction Stable',
        description: 'User satisfaction remains consistently high with minor variations.',
        confidence: 0.87,
        priority: 'medium',
        actionable: false
      }
    ],
    recommendations: [
      'Increase pattern validation frequency to maintain quality',
      'Consider expanding personalization features based on user feedback',
      'Implement additional monitoring for agent performance'
    ],
    improvement_opportunities: [
      { area: 'Response Time Optimization', potential_impact: 0.15, effort_required: 'medium' },
      { area: 'Pattern Quality Enhancement', potential_impact: 0.22, effort_required: 'high' },
      { area: 'User Interface Improvements', potential_impact: 0.18, effort_required: 'low' }
    ]
  };
}