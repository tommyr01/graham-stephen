/**
 * Implicit Feedback Collector
 * Tracks user behavior and interactions to gather implicit feedback for the learning system
 */

import { supabase } from '@/lib/supabase';

export interface ScrollMetrics {
  totalScrollTime: number; // Total time spent scrolling
  scrollDepth: number; // How far down they scrolled (0-1)
  scrollPauses: ScrollPause[]; // Where they paused while scrolling
  scrollSpeed: number; // Average pixels per second
  backtrackCount: number; // How many times they scrolled back up
}

export interface ScrollPause {
  position: number; // Scroll position (0-1)
  duration: number; // How long they paused (seconds)
  element?: string; // What element they were viewing
}

export interface ClickEvent {
  elementType: string; // 'button', 'link', 'card', 'section', etc.
  elementId?: string; // HTML ID if available
  elementText?: string; // Text content of clicked element
  position: { x: number; y: number }; // Click coordinates
  timestamp: number; // When the click happened
  context?: string; // Additional context about the click
}

export interface SessionBehavior {
  sessionStartTime: number;
  currentUrl: string;
  referrerUrl?: string;
  userAgent: string;
  screenResolution: string;
  timeSpent: number; // Total time in milliseconds
  isActive: boolean; // Whether user is currently active
  tabVisible: boolean; // Whether tab is currently visible
}

export interface ImplicitFeedbackData {
  sessionId: string;
  userId: string;
  profileUrl?: string; // LinkedIn profile being researched
  behavior: SessionBehavior;
  scrollMetrics: ScrollMetrics;
  clickEvents: ClickEvent[];
  timeOnSections: Record<string, number>; // Time spent on different profile sections
  copyActions: string[]; // Text that was copied
  searchQueries: string[]; // Searches made during session
  formInteractions: Record<string, any>; // Form field interactions
  exitIntent?: boolean; // Whether user showed intent to leave
  completedAction?: string; // Final action taken ('contact', 'save', 'skip', etc.)
}

class ImplicitFeedbackCollector {
  private sessionData: Partial<ImplicitFeedbackData> = {};
  private sessionStartTime: number = Date.now();
  private lastActivityTime: number = Date.now();
  private scrollData: Partial<ScrollMetrics> = { scrollPauses: [] };
  private clickEvents: ClickEvent[] = [];
  private timeTrackers: Record<string, number> = {};
  private isInitialized: boolean = false;
  private heartbeatInterval?: NodeJS.Timeout;
  
  constructor() {
    this.initializeSession();
  }

  /**
   * Initialize the feedback collection session
   */
  private initializeSession(): void {
    if (typeof window === 'undefined') return; // Skip on server side
    
    this.sessionData = {
      sessionId: this.generateSessionId(),
      behavior: {
        sessionStartTime: this.sessionStartTime,
        currentUrl: window.location.href,
        referrerUrl: document.referrer,
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        timeSpent: 0,
        isActive: true,
        tabVisible: !document.hidden
      },
      scrollMetrics: { ...this.scrollData, totalScrollTime: 0, scrollDepth: 0, scrollSpeed: 0, backtrackCount: 0 },
      clickEvents: [],
      timeOnSections: {},
      copyActions: [],
      searchQueries: [],
      formInteractions: {}
    };

    this.setupEventListeners();
    this.startHeartbeat();
    this.isInitialized = true;
  }

  /**
   * Set up event listeners for implicit feedback collection
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Scroll tracking
    let lastScrollPosition = 0;
    let scrollStartTime = Date.now();
    let isScrolling = false;

    window.addEventListener('scroll', () => {
      if (!isScrolling) {
        scrollStartTime = Date.now();
        isScrolling = true;
      }

      const currentPosition = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = documentHeight > 0 ? currentPosition / documentHeight : 0;

      // Track scroll direction changes (backtracking)
      if (currentPosition < lastScrollPosition && this.scrollData.scrollPauses) {
        this.scrollData.backtrackCount = (this.scrollData.backtrackCount || 0) + 1;
      }

      lastScrollPosition = currentPosition;
      this.scrollData.scrollDepth = Math.max(this.scrollData.scrollDepth || 0, scrollDepth);
    });

    // Scroll end detection
    let scrollTimer: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const scrollEndTime = Date.now();
        const scrollDuration = (scrollEndTime - scrollStartTime) / 1000;
        
        this.scrollData.totalScrollTime = (this.scrollData.totalScrollTime || 0) + scrollDuration;
        
        // Record scroll pause
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const currentPosition = documentHeight > 0 ? window.scrollY / documentHeight : 0;
        
        if (this.scrollData.scrollPauses) {
          this.scrollData.scrollPauses.push({
            position: currentPosition,
            duration: scrollDuration,
            element: this.getElementAtScrollPosition()
          });
        }
        
        isScrolling = false;
      }, 150);
    });

    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const clickEvent: ClickEvent = {
        elementType: target.tagName.toLowerCase(),
        elementId: target.id || undefined,
        elementText: target.textContent?.trim().substring(0, 100) || undefined,
        position: { x: event.clientX, y: event.clientY },
        timestamp: Date.now(),
        context: this.getClickContext(target)
      };
      
      this.clickEvents.push(clickEvent);
    });

    // Copy action tracking
    document.addEventListener('copy', () => {
      const selectedText = window.getSelection()?.toString().trim();
      if (selectedText && this.sessionData.copyActions) {
        this.sessionData.copyActions.push(selectedText.substring(0, 200)); // Limit length
      }
    });

    // Visibility change tracking
    document.addEventListener('visibilitychange', () => {
      if (this.sessionData.behavior) {
        this.sessionData.behavior.tabVisible = !document.hidden;
      }
    });

    // Mouse movement tracking (activity detection)
    let inactivityTimer: NodeJS.Timeout;
    document.addEventListener('mousemove', () => {
      this.lastActivityTime = Date.now();
      if (this.sessionData.behavior) {
        this.sessionData.behavior.isActive = true;
      }
      
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        if (this.sessionData.behavior) {
          this.sessionData.behavior.isActive = false;
        }
      }, 30000); // 30 seconds of inactivity
    });

    // Exit intent detection
    document.addEventListener('mouseleave', (event) => {
      if (event.clientY <= 0) {
        this.sessionData.exitIntent = true;
      }
    });

    // Page unload tracking
    window.addEventListener('beforeunload', () => {
      this.finalizeSession();
    });
  }

  /**
   * Start heartbeat to periodically update session data
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.updateSessionTime();
      this.saveSessionData();
    }, 10000); // Every 10 seconds
  }

  /**
   * Update the total time spent in session
   */
  private updateSessionTime(): void {
    if (this.sessionData.behavior) {
      this.sessionData.behavior.timeSpent = Date.now() - this.sessionStartTime;
    }
  }

  /**
   * Track time spent on specific sections of the page
   */
  public startSectionTracking(sectionId: string): void {
    this.timeTrackers[sectionId] = Date.now();
  }

  /**
   * Stop tracking time on a section
   */
  public stopSectionTracking(sectionId: string): void {
    const startTime = this.timeTrackers[sectionId];
    if (startTime && this.sessionData.timeOnSections) {
      const timeSpent = Date.now() - startTime;
      this.sessionData.timeOnSections[sectionId] = 
        (this.sessionData.timeOnSections[sectionId] || 0) + timeSpent;
    }
    delete this.timeTrackers[sectionId];
  }

  /**
   * Track search queries made during the session
   */
  public trackSearchQuery(query: string): void {
    if (query.trim() && this.sessionData.searchQueries) {
      this.sessionData.searchQueries.push(query.trim());
    }
  }

  /**
   * Track form interactions
   */
  public trackFormInteraction(formId: string, fieldName: string, value: any): void {
    if (this.sessionData.formInteractions) {
      if (!this.sessionData.formInteractions[formId]) {
        this.sessionData.formInteractions[formId] = {};
      }
      this.sessionData.formInteractions[formId][fieldName] = {
        value: typeof value === 'string' ? value.substring(0, 100) : value, // Limit string length
        timestamp: Date.now()
      };
    }
  }

  /**
   * Set the LinkedIn profile URL being researched
   */
  public setProfileUrl(url: string): void {
    this.sessionData.profileUrl = url;
  }

  /**
   * Set the user ID for this session
   */
  public setUserId(userId: string): void {
    this.sessionData.userId = userId;
  }

  /**
   * Record the final action taken in the session
   */
  public recordCompletedAction(action: string, details?: Record<string, any>): void {
    this.sessionData.completedAction = action;
    if (details) {
      this.sessionData.formInteractions = { 
        ...this.sessionData.formInteractions, 
        completedAction: details 
      };
    }
    this.finalizeSession();
  }

  /**
   * Get the current implicit feedback data
   */
  public getCurrentData(): ImplicitFeedbackData | null {
    if (!this.isInitialized || !this.sessionData.sessionId || !this.sessionData.userId) {
      return null;
    }

    this.updateSessionTime();
    
    return {
      sessionId: this.sessionData.sessionId,
      userId: this.sessionData.userId,
      profileUrl: this.sessionData.profileUrl,
      behavior: this.sessionData.behavior!,
      scrollMetrics: {
        ...this.scrollData,
        totalScrollTime: this.scrollData.totalScrollTime || 0,
        scrollDepth: this.scrollData.scrollDepth || 0,
        scrollSpeed: this.calculateScrollSpeed(),
        backtrackCount: this.scrollData.backtrackCount || 0,
        scrollPauses: this.scrollData.scrollPauses || []
      },
      clickEvents: this.clickEvents,
      timeOnSections: this.sessionData.timeOnSections || {},
      copyActions: this.sessionData.copyActions || [],
      searchQueries: this.sessionData.searchQueries || [],
      formInteractions: this.sessionData.formInteractions || {},
      exitIntent: this.sessionData.exitIntent,
      completedAction: this.sessionData.completedAction
    };
  }

  /**
   * Save the current session data to the database
   */
  public async saveSessionData(): Promise<void> {
    const data = this.getCurrentData();
    if (!data) return;

    try {
      // Save to feedback_interactions table as implicit_behavior
      const { error } = await supabase
        .from('feedback_interactions')
        .insert({
          user_id: data.userId,
          interaction_type: 'implicit_behavior',
          feedback_data: {
            behavior: data.behavior,
            scrollMetrics: data.scrollMetrics,
            clickEvents: data.clickEvents.slice(-50), // Keep last 50 clicks to avoid huge payloads
            timeOnSections: data.timeOnSections,
            copyActions: data.copyActions,
            searchQueries: data.searchQueries,
            formInteractions: data.formInteractions
          },
          context_data: {
            profileUrl: data.profileUrl,
            sessionId: data.sessionId,
            exitIntent: data.exitIntent,
            completedAction: data.completedAction
          },
          collection_method: 'automatic',
          ui_component: 'implicit_feedback_collector'
        });

      if (error) {
        console.error('Failed to save implicit feedback:', error);
      }
    } catch (error) {
      console.error('Error saving implicit feedback:', error);
    }
  }

  /**
   * Finalize the session and save all data
   */
  private async finalizeSession(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Stop all section tracking
    Object.keys(this.timeTrackers).forEach(sectionId => {
      this.stopSectionTracking(sectionId);
    });

    await this.saveSessionData();
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Calculate scroll speed
   */
  private calculateScrollSpeed(): number {
    const totalTime = this.scrollData.totalScrollTime || 0;
    if (totalTime === 0) return 0;
    
    const totalDistance = (this.scrollData.scrollDepth || 0) * 
      (document.documentElement.scrollHeight - window.innerHeight);
    
    return totalDistance / totalTime; // pixels per second
  }

  /**
   * Get the element currently visible at scroll position
   */
  private getElementAtScrollPosition(): string | undefined {
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const centerY = scrollY + viewportHeight / 2;
    
    const element = document.elementFromPoint(window.innerWidth / 2, viewportHeight / 2);
    if (element) {
      return element.tagName.toLowerCase() + 
        (element.className ? `.${element.className.split(' ')[0]}` : '') +
        (element.id ? `#${element.id}` : '');
    }
    return undefined;
  }

  /**
   * Get context about what was clicked
   */
  private getClickContext(element: HTMLElement): string | undefined {
    // Look for parent components to understand context
    let current = element;
    while (current && current !== document.body) {
      if (current.dataset.component) {
        return current.dataset.component;
      }
      if (current.className.includes('profile-section')) {
        return 'profile-section';
      }
      if (current.className.includes('commenter-card')) {
        return 'commenter-card';
      }
      if (current.className.includes('research-section')) {
        return 'research-section';
      }
      current = current.parentElement!;
    }
    return undefined;
  }
}

// Create a singleton instance
export const implicitFeedbackCollector = new ImplicitFeedbackCollector();

// Export the class for testing
export { ImplicitFeedbackCollector };