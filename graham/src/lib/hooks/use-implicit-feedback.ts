/**
 * useImplicitFeedback Hook
 * React hook for easily integrating implicit feedback collection into components
 */

import { useEffect, useCallback, useRef } from 'react';
import { implicitFeedbackCollector } from '@/lib/services/implicit-feedback-collector';

interface UseImplicitFeedbackOptions {
  profileUrl?: string; // LinkedIn profile being researched
  userId?: string; // Current user ID
  componentName?: string; // Name of the component for context
  trackSections?: boolean; // Whether to track time on sections automatically
  autoSave?: boolean; // Whether to auto-save data periodically
}

interface SectionTracker {
  start: (sectionId: string) => void;
  stop: (sectionId: string) => void;
  track: (sectionId: string) => () => void; // Returns cleanup function
}

interface ImplicitFeedbackActions {
  trackSearch: (query: string) => void;
  trackFormInteraction: (formId: string, fieldName: string, value: any) => void;
  recordAction: (action: string, details?: Record<string, any>) => void;
  saveNow: () => Promise<void>;
  sectionTracker: SectionTracker;
}

export const useImplicitFeedback = (
  options: UseImplicitFeedbackOptions = {}
): ImplicitFeedbackActions => {
  const {
    profileUrl,
    userId,
    componentName,
    trackSections = true,
    autoSave = true
  } = options;

  const trackedSections = useRef<Set<string>>(new Set());

  // Initialize feedback collection when options change
  useEffect(() => {
    if (profileUrl) {
      implicitFeedbackCollector.setProfileUrl(profileUrl);
    }
    
    if (userId) {
      implicitFeedbackCollector.setUserId(userId);
    }
  }, [profileUrl, userId]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave) return;

    const saveInterval = setInterval(() => {
      implicitFeedbackCollector.saveSessionData();
    }, 30000); // Save every 30 seconds

    return () => clearInterval(saveInterval);
  }, [autoSave]);

  // Section tracking utilities
  const sectionTracker: SectionTracker = {
    start: useCallback((sectionId: string) => {
      if (!trackSections) return;
      
      const fullSectionId = componentName ? `${componentName}.${sectionId}` : sectionId;
      implicitFeedbackCollector.startSectionTracking(fullSectionId);
      trackedSections.current.add(fullSectionId);
    }, [componentName, trackSections]),

    stop: useCallback((sectionId: string) => {
      if (!trackSections) return;
      
      const fullSectionId = componentName ? `${componentName}.${sectionId}` : sectionId;
      implicitFeedbackCollector.stopSectionTracking(fullSectionId);
      trackedSections.current.delete(fullSectionId);
    }, [componentName, trackSections]),

    track: useCallback((sectionId: string) => {
      if (!trackSections) return () => {};
      
      const fullSectionId = componentName ? `${componentName}.${sectionId}` : sectionId;
      implicitFeedbackCollector.startSectionTracking(fullSectionId);
      trackedSections.current.add(fullSectionId);
      
      // Return cleanup function
      return () => {
        implicitFeedbackCollector.stopSectionTracking(fullSectionId);
        trackedSections.current.delete(fullSectionId);
      };
    }, [componentName, trackSections])
  };

  // Other tracking functions
  const trackSearch = useCallback((query: string) => {
    implicitFeedbackCollector.trackSearchQuery(query);
  }, []);

  const trackFormInteraction = useCallback((formId: string, fieldName: string, value: any) => {
    const fullFormId = componentName ? `${componentName}.${formId}` : formId;
    implicitFeedbackCollector.trackFormInteraction(fullFormId, fieldName, value);
  }, [componentName]);

  const recordAction = useCallback((action: string, details?: Record<string, any>) => {
    implicitFeedbackCollector.recordCompletedAction(action, details);
  }, []);

  const saveNow = useCallback(async () => {
    await implicitFeedbackCollector.saveSessionData();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop tracking all sections that are still active
      trackedSections.current.forEach(sectionId => {
        implicitFeedbackCollector.stopSectionTracking(sectionId);
      });
      trackedSections.current.clear();
    };
  }, []);

  return {
    trackSearch,
    trackFormInteraction,
    recordAction,
    saveNow,
    sectionTracker
  };
};

/**
 * useAutoSectionTracking Hook
 * Automatically tracks time spent on a component/section
 */
export const useAutoSectionTracking = (
  sectionId: string,
  options: { componentName?: string; enabled?: boolean } = {}
) => {
  const { componentName, enabled = true } = options;
  const { sectionTracker } = useImplicitFeedback({ componentName, trackSections: enabled });

  useEffect(() => {
    if (!enabled) return;
    
    return sectionTracker.track(sectionId);
  }, [sectionId, enabled, sectionTracker]);
};

/**
 * useElementVisibilityTracking Hook  
 * Tracks when specific elements come into view
 */
export const useElementVisibilityTracking = (
  elementRef: React.RefObject<HTMLElement>,
  sectionId: string,
  options: { threshold?: number; componentName?: string } = {}
) => {
  const { threshold = 0.5, componentName } = options;
  const { sectionTracker } = useImplicitFeedback({ componentName });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            sectionTracker.start(sectionId);
          } else {
            sectionTracker.stop(sectionId);
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      sectionTracker.stop(sectionId); // Ensure we stop tracking
    };
  }, [elementRef, sectionId, threshold, sectionTracker]);
};

/**
 * useScrollDepthTracking Hook
 * Tracks how far user scrolls through content
 */
export const useScrollDepthTracking = (
  contentRef: React.RefObject<HTMLElement>,
  milestones: number[] = [25, 50, 75, 90, 100],
  onMilestone?: (milestone: number) => void
) => {
  const milestonesReached = useRef<Set<number>>(new Set());

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const elementTop = element.offsetTop;
      const elementHeight = element.offsetHeight;
      const windowHeight = window.innerHeight;
      
      // Calculate scroll depth within the element
      const scrolledIntoElement = Math.max(0, scrollTop + windowHeight - elementTop);
      const scrollableHeight = elementHeight + windowHeight;
      const scrollDepth = Math.min(100, (scrolledIntoElement / scrollableHeight) * 100);

      // Check milestones
      milestones.forEach(milestone => {
        if (scrollDepth >= milestone && !milestonesReached.current.has(milestone)) {
          milestonesReached.current.add(milestone);
          onMilestone?.(milestone);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [contentRef, milestones, onMilestone]);

  return milestonesReached.current;
};

export default useImplicitFeedback;