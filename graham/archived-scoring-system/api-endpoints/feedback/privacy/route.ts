import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth';
import { 
  createOrUpdateDataPrivacyControls,
  getDataPrivacyControls,
  getEnhancedFeedbackByUser 
} from '@/lib/feedback-database';
import { DataPrivacyControls, APIError } from '@/lib/types';

// Validation schema for privacy controls
const privacyControlsSchema = z.object({
  learningConsentGiven: z.boolean().optional(),
  teamSharingEnabled: z.boolean().optional(),
  outcomeTrackingEnabled: z.boolean().optional(),
  dataRetentionPreference: z.number().min(30).max(2555).optional(), // 30 days to ~7 years
  anonymizeInTeamLearning: z.boolean().optional(),
  excludeFromGlobalLearning: z.boolean().optional(),
  feedbackVisibility: z.enum(['private', 'team', 'organization']).optional(),
  gdprComplianceVerified: z.boolean().optional(),
});

const dataRequestSchema = z.object({
  requestType: z.enum(['export', 'deletion']),
  reason: z.string().max(500).optional(),
  confirmDeletion: z.boolean().optional(),
});

/**
 * GET /api/feedback/privacy
 * Retrieves user's data privacy controls
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(request);
    
    // Get privacy controls
    const privacyControls = await getDataPrivacyControls(payload.userId);
    
    // If no privacy controls exist, create default ones
    if (!privacyControls) {
      const defaultControls = await createOrUpdateDataPrivacyControls(payload.userId, {
        learningConsentGiven: true,
        teamSharingEnabled: true,
        outcomeTrackingEnabled: true,
        dataRetentionPreference: 365,
        anonymizeInTeamLearning: false,
        excludeFromGlobalLearning: false,
        feedbackVisibility: 'team',
        gdprComplianceVerified: false,
      });
      
      return NextResponse.json({
        privacyControls: defaultControls,
        isDefault: true,
      }, { status: 200 });
    }

    // Get additional context about user's data
    const feedbackCount = await getEnhancedFeedbackByUser(payload.userId, { limit: 1000 });
    const dataContext = {
      totalFeedbackRecords: feedbackCount.length,
      feedbackTypes: [...new Set(feedbackCount.map(fb => fb.feedbackType))],
      oldestFeedback: feedbackCount.length > 0 
        ? Math.min(...feedbackCount.map(fb => new Date(fb.submittedAt).getTime()))
        : null,
      newestFeedback: feedbackCount.length > 0 
        ? Math.max(...feedbackCount.map(fb => new Date(fb.submittedAt).getTime()))
        : null,
    };

    return NextResponse.json({
      privacyControls,
      dataContext: {
        totalFeedbackRecords: dataContext.totalFeedbackRecords,
        feedbackTypes: dataContext.feedbackTypes,
        oldestFeedback: dataContext.oldestFeedback ? new Date(dataContext.oldestFeedback).toISOString() : null,
        newestFeedback: dataContext.newestFeedback ? new Date(dataContext.newestFeedback).toISOString() : null,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Get privacy controls error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('token') || error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: error.message, statusCode: 401 } as APIError,
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'An error occurred while retrieving privacy controls', 
        statusCode: 500 
      } as APIError,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/feedback/privacy
 * Updates user's data privacy controls
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(request);
    
    const body = await request.json();
    
    // Validate input
    const validation = privacyControlsSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json(
        { error: 'Validation Error', message: errors.join(', '), statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Check for critical privacy changes that need special handling
    if (updates.learningConsentGiven === false) {
      // If user is withdrawing learning consent, we need to handle this specially
      console.log(`User ${payload.userId} withdrawing learning consent`);
    }

    if (updates.excludeFromGlobalLearning === true) {
      // User is opting out of global learning
      console.log(`User ${payload.userId} opting out of global learning`);
    }

    // Update privacy controls
    const updatedControls = await createOrUpdateDataPrivacyControls(payload.userId, {
      ...updates,
      privacyPolicyVersion: '2025-01-14', // Current privacy policy version
    });

    // If data retention preference is reduced, schedule cleanup
    if (updates.dataRetentionPreference) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - updates.dataRetentionPreference);
      
      // In a real implementation, this would trigger a background job
      console.log(`Scheduled data cleanup for user ${payload.userId} before ${cutoffDate.toISOString()}`);
    }

    return NextResponse.json({
      message: 'Privacy controls updated successfully',
      privacyControls: updatedControls,
      appliedChanges: Object.keys(updates),
    }, { status: 200 });

  } catch (error) {
    console.error('Update privacy controls error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('token') || error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: error.message, statusCode: 401 } as APIError,
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'An error occurred while updating privacy controls', 
        statusCode: 500 
      } as APIError,
      { status: 500 }
    );
  }
}

/**
 * POST /api/feedback/privacy
 * Handles data export and deletion requests
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(request);
    
    const body = await request.json();
    
    // Validate input
    const validation = dataRequestSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json(
        { error: 'Validation Error', message: errors.join(', '), statusCode: 400 } as APIError,
        { status: 400 }
      );
    }

    const { requestType, reason, confirmDeletion } = validation.data;

    if (requestType === 'export') {
      // Handle data export request
      const privacyControls = await getDataPrivacyControls(payload.userId);
      
      // Update privacy controls to mark export request
      if (privacyControls) {
        const { updateDataPrivacyControls } = await import('@/lib/feedback-database');
        await updateDataPrivacyControls(privacyControls.id, {
          dataExportRequested: true,
        });
      }

      // Get all user data for export
      const feedbackData = await getEnhancedFeedbackByUser(payload.userId, { limit: 10000 });
      
      const { getUserPreferenceProfile } = await import('@/lib/feedback-database');
      const userPreferences = await getUserPreferenceProfile(payload.userId);

      // Prepare export data
      const exportData = {
        exportTimestamp: new Date().toISOString(),
        userId: payload.userId,
        privacyControls,
        feedbackData: feedbackData.map(fb => ({
          ...fb,
          // Remove sensitive fields like IP addresses
          sourceIp: undefined,
          deviceInfo: undefined,
        })),
        userPreferences,
        exportReason: reason,
      };

      // In a real implementation, this would be processed asynchronously
      // and the user would receive a download link via email
      
      // Mark export as completed
      if (privacyControls) {
        const { updateDataPrivacyControls } = await import('@/lib/feedback-database');
        await updateDataPrivacyControls(privacyControls.id, {
          dataExportCompletedAt: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        message: 'Data export completed successfully',
        exportSize: JSON.stringify(exportData).length,
        recordCount: feedbackData.length,
        exportData, // In production, this would be a download link
      }, { status: 200 });

    } else if (requestType === 'deletion') {
      // Handle data deletion request
      if (!confirmDeletion) {
        return NextResponse.json(
          { error: 'Confirmation Required', message: 'confirmDeletion must be true for deletion requests', statusCode: 400 } as APIError,
          { status: 400 }
        );
      }

      const privacyControls = await getDataPrivacyControls(payload.userId);
      
      // Schedule data deletion (in production, this would be a background job with delays for safety)
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 7); // 7-day grace period

      if (privacyControls) {
        const { updateDataPrivacyControls } = await import('@/lib/feedback-database');
        await updateDataPrivacyControls(privacyControls.id, {
          dataDeletionRequested: true,
          dataDeletionScheduledAt: deletionDate.toISOString(),
        });
      }

      // Log the deletion request for audit purposes
      console.log(`Data deletion requested by user ${payload.userId}, scheduled for ${deletionDate.toISOString()}, reason: ${reason || 'not provided'}`);

      return NextResponse.json({
        message: 'Data deletion request submitted successfully',
        scheduledDeletionDate: deletionDate.toISOString(),
        gracePeriodDays: 7,
        note: 'You can cancel this request within the grace period by contacting support',
      }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Invalid Request Type', message: 'Unsupported request type', statusCode: 400 } as APIError,
      { status: 400 }
    );

  } catch (error) {
    console.error('Data request error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('token') || error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: error.message, statusCode: 401 } as APIError,
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'An error occurred while processing data request', 
        statusCode: 500 
      } as APIError,
      { status: 500 }
    );
  }
}