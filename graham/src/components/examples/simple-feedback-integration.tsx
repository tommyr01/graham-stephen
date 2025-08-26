/**
 * Simple Feedback Integration Example
 * Shows how to integrate feedback components into existing research workflows
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Building } from 'lucide-react';

// Import the progressive feedback system - this is the main component you'll use
import { ProgressiveFeedbackSystem } from '@/components/feedback';

// Example profile research component with feedback integration
export function ProfileResearchWithFeedback({ 
  profileData,
  userId 
}: {
  profileData: {
    name: string;
    title: string;
    company: string;
    location: string;
    linkedinUrl: string;
    email?: string;
    phone?: string;
    industry: string;
    experience: string;
  };
  userId: string;
}) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [hasContacted, setHasContacted] = useState(false);
  const [userExpertise, setUserExpertise] = useState<any>(null);

  const handleContact = () => {
    setHasContacted(true);
    // Your existing contact logic here
    console.log('Contacting:', profileData.name);
  };

  const handleFeedbackCollected = (feedback: any) => {
    console.log('Feedback received:', feedback);
    // Optional: Handle feedback in your application
    // For example, update UI, trigger analytics, etc.
  };

  const handleExpertiseUpdate = (expertise: any) => {
    setUserExpertise(expertise);
    console.log('User expertise updated:', expertise);
    // Optional: Adapt your UI based on expertise level
    // For example, show/hide advanced features
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Existing Profile Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{profileData.name}</h2>
                <p className="text-gray-600">{profileData.title}</p>
              </div>
            </div>
            {userExpertise && (
              <Badge variant="outline">
                {userExpertise.level} user
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{profileData.company}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{profileData.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {profileData.industry}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {profileData.experience} experience
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              {profileData.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{profileData.email}</span>
                </div>
              )}
              {profileData.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{profileData.phone}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              onClick={handleContact}
              className="flex-1"
              disabled={hasContacted}
            >
              {hasContacted ? '✓ Contacted' : 'Contact Now'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowFeedback(!showFeedback)}
            >
              {showFeedback ? 'Hide Feedback' : 'Rate Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progressive Feedback System Integration */}
      {showFeedback && (
        <Card>
          <CardHeader>
            <CardTitle>Share Your Feedback</CardTitle>
            <p className="text-sm text-gray-600">
              Help us improve recommendations by sharing your thoughts on this profile.
            </p>
          </CardHeader>
          <CardContent>
            <ProgressiveFeedbackSystem
              userId={userId}
              profileUrl={profileData.linkedinUrl}
              profileData={{
                name: profileData.name,
                title: profileData.title,
                company: profileData.company,
                location: profileData.location,
                industry: profileData.industry,
                experience: profileData.experience
              }}
              researchContext={{
                targetRole: 'Product Manager', // You would get this from your app state
                targetIndustry: 'Technology',
                targetCompanySize: 'medium',
                researchGoal: 'Find product management leads for partnerships'
              }}
              onFeedbackCollected={handleFeedbackCollected}
              onExpertiseUpdate={handleExpertiseUpdate}
            />
          </CardContent>
        </Card>
      )}

      {/* Show different UI based on expertise level */}
      {userExpertise && userExpertise.level === 'expert' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold text-blue-800">Expert Mode Unlocked</h3>
              <p className="text-sm text-blue-600 mt-1">
                You now have access to advanced features and detailed analytics.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Example usage in your main application
export function ExampleUsage() {
  const exampleProfile = {
    name: "Alex Rodriguez",
    title: "Senior Software Engineer",
    company: "StartupCorp",
    location: "Austin, TX",
    linkedinUrl: "https://linkedin.com/in/alex-rodriguez-example",
    email: "alex@startupcorp.com",
    industry: "Technology",
    experience: "5+ years"
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profile Research</h1>
      <ProfileResearchWithFeedback 
        profileData={exampleProfile}
        userId="demo_user_123" // Replace with actual user ID from your auth system
      />
    </div>
  );
}

/**
 * Quick Integration Steps:
 * 
 * 1. Install dependencies (if not already installed):
 *    npm install @radix-ui/react-select @radix-ui/react-tabs
 * 
 * 2. Import the progressive feedback system:
 *    import { ProgressiveFeedbackSystem } from '@/components/feedback';
 * 
 * 3. Add to your profile research component:
 *    <ProgressiveFeedbackSystem
 *      userId={currentUserId}
 *      profileUrl={profileUrl}
 *      profileData={profileData}
 *      onFeedbackCollected={handleFeedback}
 *    />
 * 
 * 4. The system will automatically:
 *    - Detect user expertise level
 *    - Show appropriate feedback components
 *    - Save feedback to your database
 *    - Adapt to user behavior over time
 * 
 * 5. Optional: Handle feedback in your application:
 *    - Update UI based on expertise level
 *    - Trigger analytics events
 *    - Show success messages
 *    - Integrate with your existing workflows
 */