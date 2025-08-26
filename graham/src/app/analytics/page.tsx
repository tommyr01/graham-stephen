"use client";

/**
 * Analytics Dashboard Page - Comprehensive intelligent learning system monitoring
 * 
 * This page provides a comprehensive view of the autonomous agents system,
 * pattern discovery analytics, user intelligence metrics, and system performance.
 */

import React from 'react';
import IntelligentAnalyticsDashboard from '@/components/analytics/intelligent-analytics-dashboard';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Intelligent Learning Analytics
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Real-time monitoring and insights from the autonomous AI agents system
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center px-3 py-2 bg-green-100 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-green-800">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto">
        <IntelligentAnalyticsDashboard 
          className="bg-gray-50" 
          refreshInterval={30}
          autoRefresh={true}
        />
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              Powered by Autonomous AI Agents System
            </div>
            <div>
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}