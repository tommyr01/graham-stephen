/**
 * Feedback System Demo - Complete example of the intelligent learning system
 * Demonstrates integration of all feedback components with real usage patterns
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, User, TrendingUp, MessageSquare } from 'lucide-react';

// Import all feedback components
import { 
  SmartFeedbackWidget,
  RelevanceRatingComponent,
  OutcomeTrackingForms,
  ProgressiveFeedbackSystem,
  QuickActionFeedback,
  QuickFeedbackTrigger
} from '@/components/feedback';

interface FeedbackSystemDemoProps {
  userId: string;
  initialProfile?: {
    name: string;
    title: string;
    company: string;
    linkedinUrl: string;
    industry: string;
    location: string;
  };
}

const DEMO_PROFILE = {
  name: "Sarah Chen",
  title: "Senior Product Manager",
  company: "TechCorp Inc",
  linkedinUrl: "https://linkedin.com/in/sarah-chen-demo",
  industry: "Technology",
  location: "San Francisco, CA"
};

const DEMO_RESEARCH_CONTEXT = {
  targetRole: "Product Manager",
  targetIndustry: "Technology",
  targetCompanySize: "medium",
  researchGoal: "Find product management leads for B2B SaaS partnerships"
};

export function FeedbackSystemDemo({ 
  userId, 
  initialProfile = DEMO_PROFILE 
}: FeedbackSystemDemoProps) {
  const [activeTab, setActiveTab] = useState('progressive');
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [currentExpertise, setCurrentExpertise] = useState<any>(null);
  const [demoState, setDemoState] = useState({
    hasResearched: false,
    hasContacted: false,
    showOutcomeTracking: false,
    showSmartWidget: false
  });

  const handleFeedbackSubmitted = (feedback: any) => {
    console.log('Feedback submitted:', feedback);
    setFeedbackHistory(prev => [{
      id: Date.now(),
      timestamp: new Date(),
      ...feedback
    }, ...prev.slice(0, 9)]); // Keep last 10 items
  };

  const handleExpertiseUpdate = (expertise: any) => {
    setCurrentExpertise(expertise);
    console.log('Expertise updated:', expertise);
  };

  const simulateResearchAction = () => {
    setDemoState(prev => ({ ...prev, hasResearched: true }));
    setTimeout(() => {
      setDemoState(prev => ({ ...prev, showSmartWidget: true }));
    }, 2000);
  };

  const simulateContactAction = () => {
    setDemoState(prev => ({ 
      ...prev, 
      hasContacted: true, 
      showOutcomeTracking: true 
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Demo Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Intelligent Feedback System Demo
        </h1>
        <p className="text-lg text-gray-600">
          Experience how our adaptive feedback components learn from user behavior
        </p>
        {currentExpertise && (
          <Badge variant="outline" className="mt-2">
            Current Level: {currentExpertise.level} (Score: {currentExpertise.score}/100)
          </Badge>
        )}
      </div>

      {/* Demo Profile Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Demo Profile: {initialProfile.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><strong>Title:</strong> {initialProfile.title}</div>
            <div><strong>Company:</strong> {initialProfile.company}</div>
            <div><strong>Industry:</strong> {initialProfile.industry}</div>
            <div><strong>Location:</strong> {initialProfile.location}</div>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <Button 
              onClick={simulateResearchAction}
              variant={demoState.hasResearched ? "secondary" : "default"}
              size="sm"
            >
              {demoState.hasResearched ? "✓ Researched" : "Start Research"}
            </Button>
            <Button 
              onClick={simulateContactAction}
              variant={demoState.hasContacted ? "secondary" : "outline"}
              size="sm"
              disabled={!demoState.hasResearched}
            >
              {demoState.hasContacted ? "✓ Contacted" : "Contact Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Components Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="progressive">Progressive System</TabsTrigger>
          <TabsTrigger value="relevance">Relevance Rating</TabsTrigger>
          <TabsTrigger value="quick">Quick Actions</TabsTrigger>
          <TabsTrigger value="outcome">Outcome Tracking</TabsTrigger>
          <TabsTrigger value="smart">Smart Widget</TabsTrigger>
        </TabsList>

        {/* Progressive Feedback System */}
        <TabsContent value="progressive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span>Progressive Feedback System</span>
              </CardTitle>
              <p className="text-sm text-gray-600">
                Adapts complexity and frequency based on your expertise level and behavior patterns.
              </p>
            </CardHeader>
            <CardContent>
              <ProgressiveFeedbackSystem
                userId={userId}
                profileUrl={initialProfile.linkedinUrl}
                profileData={initialProfile}
                researchContext={DEMO_RESEARCH_CONTEXT}
                onFeedbackCollected={handleFeedbackSubmitted}
                onExpertiseUpdate={handleExpertiseUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relevance Rating Component */}
        <TabsContent value="relevance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relevance Rating Component</CardTitle>
              <p className="text-sm text-gray-600">
                Detailed 1-10 scale rating with contextual explanations and factor breakdown.
              </p>
            </CardHeader>
            <CardContent>
              <RelevanceRatingComponent
                userId={userId}
                profileUrl={initialProfile.linkedinUrl}
                profileData={initialProfile}
                researchContext={DEMO_RESEARCH_CONTEXT}
                onRatingSubmitted={handleFeedbackSubmitted}
                showExplanations={true}
                allowReasons={true}
                compactMode={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Action Feedback */}
        <TabsContent value="quick" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Standard Quick Actions</CardTitle>
                <p className="text-sm text-gray-600">
                  One-click feedback for common research outcomes.
                </p>
              </CardHeader>
              <CardContent>
                <QuickActionFeedback
                  userId={userId}
                  profileUrl={initialProfile.linkedinUrl}
                  actionContext={{
                    action: 'profile_research',
                    profileName: initialProfile.name
                  }}
                  feedbackTrigger="manual"
                  showReasons={false}
                  compactMode={false}
                  onFeedbackSubmitted={handleFeedbackSubmitted}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expert Mode Actions</CardTitle>
                <p className="text-sm text-gray-600">
                  Advanced feedback options with contextual follow-ups.
                </p>
              </CardHeader>
              <CardContent>
                <QuickActionFeedback
                  userId={userId}
                  profileUrl={initialProfile.linkedinUrl}
                  actionContext={{
                    action: 'expert_analysis',
                    profileName: initialProfile.name
                  }}
                  feedbackTrigger="manual"
                  showReasons={true}
                  compactMode={false}
                  expertMode={true}
                  onFeedbackSubmitted={handleFeedbackSubmitted}
                />
              </CardContent>
            </Card>
          </div>

          {/* Quick Feedback Trigger Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Triggered Quick Feedback</CardTitle>
              <p className="text-sm text-gray-600">
                Feedback automatically triggered by user actions.
              </p>
            </CardHeader>
            <CardContent>
              <QuickFeedbackTrigger
                userId={userId}
                profileUrl={initialProfile.linkedinUrl}
                triggerAction="click"
                feedbackProps={{
                  compactMode: true,
                  showReasons: false
                }}
              >
                <Button variant="outline">Click me to trigger feedback</Button>
              </QuickFeedbackTrigger>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outcome Tracking */}
        <TabsContent value="outcome" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outcome Tracking Forms</CardTitle>
              <p className="text-sm text-gray-600">
                Track contact results and success metrics to improve recommendations.
              </p>
              {!demoState.hasContacted && (
                <Badge variant="outline" className="w-fit">
                  Click "Contact Profile" above to enable
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {demoState.showOutcomeTracking ? (
                <OutcomeTrackingForms
                  userId={userId}
                  profileUrl={initialProfile.linkedinUrl}
                  profileData={initialProfile}
                  initialRelevanceRating={8}
                  researchSessionId={`session_${Date.now()}`}
                  onOutcomeRecorded={handleFeedbackSubmitted}
                  allowMultipleUpdates={true}
                  compactMode={false}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Complete the research action above to track outcomes
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smart Widget */}
        <TabsContent value="smart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Smart Feedback Widget</CardTitle>
              <p className="text-sm text-gray-600">
                Contextual floating widget that adapts to user behavior and timing.
              </p>
              {!demoState.hasResearched && (
                <Badge variant="outline" className="w-fit">
                  Start research to see the widget
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">
                The smart widget appears in the bottom-right corner after certain triggers:
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Exit intent detection</li>
                  <li>Time threshold (90 seconds)</li>
                  <li>Scroll depth milestones</li>
                  <li>Action completion</li>
                </ul>
              </div>
              
              {demoState.showSmartWidget && (
                <div className="relative">
                  <p className="text-sm text-green-600 mb-4">
                    ✓ Smart widget is now active (check bottom-right corner)
                  </p>
                  <SmartFeedbackWidget
                    userId={userId}
                    profileUrl={initialProfile.linkedinUrl}
                    contextData={{ profileName: initialProfile.name }}
                    onFeedbackSubmitted={handleFeedbackSubmitted}
                    minimizedByDefault={false}
                    triggerOnEvents={['time_threshold', 'exit_intent']}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feedback History */}
      {feedbackHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <span>Recent Feedback ({feedbackHistory.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {feedbackHistory.map((feedback) => (
                <div key={feedback.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {feedback.interaction_type || 'feedback'}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {feedback.timestamp?.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1">
                      {JSON.stringify(feedback).substring(0, 100)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}