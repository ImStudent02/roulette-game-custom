'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Generate unique session ID
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Parse user agent for device info
function getDeviceInfo() {
  if (typeof window === 'undefined') return null;
  
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';
  
  // Browser detection
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  // OS detection
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  return {
    userAgent: ua,
    browser,
    os,
    screenSize: `${window.screen.width}x${window.screen.height}`,
  };
}

interface AnalyticsEvent {
  eventType: string;
  eventData?: Record<string, unknown>;
  page?: string;
}

interface UseAnalyticsOptions {
  username: string;
  enabled?: boolean;
  batchSize?: number;
  flushInterval?: number;
}

export function useAnalytics(options: UseAnalyticsOptions) {
  const { username, enabled = true, batchSize = 10, flushInterval = 5000 } = options;
  
  const sessionIdRef = useRef<string>('');
  const eventQueueRef = useRef<AnalyticsEvent[]>([]);
  const lastFlushRef = useRef<number>(Date.now());
  const isActiveRef = useRef<boolean>(true);
  const [currentPage, setCurrentPage] = useState<string>('');
  
  // Initialize session
  useEffect(() => {
    if (!enabled || !username) return;
    
    // Get or create session ID
    let sessionId = sessionStorage.getItem('analyticsSessionId');
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem('analyticsSessionId', sessionId);
    }
    sessionIdRef.current = sessionId;
    
    // Start session
    const device = getDeviceInfo();
    fetch('/api/analytics/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        sessionId,
        username,
        device,
      }),
    }).catch(() => {});
    
    // Set initial page
    setCurrentPage(window.location.pathname);
    
    // Track visibility changes
    const handleVisibility = () => {
      if (document.hidden) {
        trackEvent({ eventType: 'tab_hidden' });
        isActiveRef.current = false;
      } else {
        trackEvent({ eventType: 'tab_visible' });
        isActiveRef.current = true;
      }
    };
    
    // Track before unload
    const handleUnload = () => {
      flushEvents(true);
      
      // End session
      navigator.sendBeacon('/api/analytics/session', JSON.stringify({
        action: 'end',
        sessionId: sessionIdRef.current,
        endedAt: Date.now(),
      }));
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleUnload);
    
    // Heartbeat every 30s
    const heartbeatInterval = setInterval(() => {
      if (isActiveRef.current) {
        fetch('/api/analytics/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            username,
            page: currentPage,
            isActive: isActiveRef.current,
          }),
        }).catch(() => {});
      }
    }, 30000);
    
    // Flush interval
    const flushTimer = setInterval(() => {
      flushEvents();
    }, flushInterval);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleUnload);
      clearInterval(heartbeatInterval);
      clearInterval(flushTimer);
      flushEvents(true);
    };
  }, [username, enabled, flushInterval, currentPage]);
  
  // Flush events to server
  const flushEvents = useCallback((sync = false) => {
    if (eventQueueRef.current.length === 0) return;
    
    const events = eventQueueRef.current.map(e => ({
      ...e,
      username,
      sessionId: sessionIdRef.current,
      timestamp: Date.now(),
      page: e.page || currentPage,
    }));
    
    eventQueueRef.current = [];
    lastFlushRef.current = Date.now();
    
    if (sync) {
      // Use sendBeacon for sync flush (before unload)
      navigator.sendBeacon('/api/analytics/events', JSON.stringify({ events }));
    } else {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      }).catch(() => {});
    }
  }, [username, currentPage]);
  
  // Track event
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    if (!enabled) return;
    
    eventQueueRef.current.push({
      ...event,
      page: event.page || currentPage,
    });
    
    // Auto flush if batch size reached
    if (eventQueueRef.current.length >= batchSize) {
      flushEvents();
    }
  }, [enabled, currentPage, batchSize, flushEvents]);
  
  // Track page view
  const trackPageView = useCallback((page: string, referrer?: string) => {
    setCurrentPage(page);
    trackEvent({
      eventType: 'page_view',
      eventData: { page, referrer },
      page,
    });
  }, [trackEvent]);
  
  // Convenience methods for common events
  const track = {
    // Page events
    pageView: trackPageView,
    pageExit: (page: string, timeSpentMs: number, scrollDepth: number) => {
      trackEvent({
        eventType: 'page_exit',
        eventData: { page, timeSpentMs, scrollDepth },
        page,
      });
    },
    
    // Section events
    sectionFocus: (section: string) => {
      trackEvent({ eventType: 'section_focus', eventData: { section } });
    },
    sectionBlur: (section: string, durationMs: number) => {
      trackEvent({ eventType: 'section_blur', eventData: { section, durationMs } });
    },
    tabSwitch: (fromTab: string, toTab: string) => {
      trackEvent({ eventType: 'tab_switch', eventData: { fromTab, toTab } });
    },
    
    // Betting events
    chipSelected: (chipValue: number, previousChip?: number) => {
      trackEvent({ eventType: 'bet_chip_selected', eventData: { chipValue, previousChip } });
    },
    betPlaced: (data: { amount: number; type: string; targetNumber?: number; roundNumber: number; msIntoRound: number }) => {
      trackEvent({ eventType: 'bet_placed', eventData: data });
    },
    betRemoved: (data: { amount: number; msBeforeLock: number; wasLastSecond: boolean; roundNumber: number }) => {
      trackEvent({ eventType: 'bet_removed', eventData: data });
    },
    allInClicked: (balance: number, maxBet: number) => {
      trackEvent({ eventType: 'all_in_clicked', eventData: { balance, maxBet } });
    },
    maxBetHit: (attemptedAmount: number, actualMax: number) => {
      trackEvent({ eventType: 'max_bet_hit', eventData: { attemptedAmount, actualMax } });
    },
    roundParticipated: (data: { roundNumber: number; betCount: number; totalWagered: number; currencyMode: string }) => {
      trackEvent({ eventType: 'round_participated', eventData: data });
    },
    roundSkipped: (roundNumber: number, hadBalance: boolean) => {
      trackEvent({ eventType: 'round_skipped', eventData: { roundNumber, hadBalance } });
    },
    roundResult: (data: { won: boolean; amount: number; viewDurationMs: number }) => {
      trackEvent({ eventType: 'round_result_viewed', eventData: data });
    },
    
    // Topup events
    topupPageOpened: (fromPage: string, balance: number) => {
      trackEvent({ eventType: 'topup_page_opened', eventData: { fromPage, balance } });
    },
    packViewed: (packId: string, packPrice: number, viewTimeMs: number) => {
      trackEvent({ eventType: 'pack_viewed', eventData: { packId, packPrice, viewTimeMs } });
    },
    packSelected: (packId: string, packPrice: number, packMangos: number) => {
      trackEvent({ eventType: 'pack_selected', eventData: { packId, packPrice, packMangos } });
    },
    paymentStarted: (packId: string, method: string) => {
      trackEvent({ eventType: 'payment_started', eventData: { packId, method } });
    },
    paymentCompleted: (packId: string, timeTakenMs: number) => {
      trackEvent({ eventType: 'payment_completed', eventData: { packId, timeTakenMs } });
    },
    paymentFailed: (packId: string, error: string) => {
      trackEvent({ eventType: 'payment_failed', eventData: { packId, error } });
    },
    topupBounced: (timeOnPage: number, packsViewed: number) => {
      trackEvent({ eventType: 'topup_bounced', eventData: { timeOnPage, packsViewed } });
    },
    
    // Chat events
    chatOpened: (messageCount: number) => {
      trackEvent({ eventType: 'chat_opened', eventData: { messageCount } });
    },
    chatMessageSent: (charCount: number, hasEmoji: boolean, timeTypingMs: number) => {
      trackEvent({ eventType: 'chat_message_sent', eventData: { charCount, hasEmoji, timeTypingMs } });
    },
    chatScrolled: (direction: 'up' | 'down') => {
      trackEvent({ eventType: 'chat_scrolled', eventData: { direction } });
    },
    
    // Profile events
    profileOpened: (fromPage: string) => {
      trackEvent({ eventType: 'profile_opened', eventData: { fromPage } });
    },
    balanceChecked: (currencyType: string, amount: number) => {
      trackEvent({ eventType: 'balance_checked', eventData: { currencyType, amount } });
    },
    currencySwitched: (from: string, to: string) => {
      trackEvent({ eventType: 'currency_switched', eventData: { from, to } });
    },
    
    // Withdrawal events
    withdrawStarted: (amount: number, method: string) => {
      trackEvent({ eventType: 'withdraw_started', eventData: { amount, method } });
    },
    withdrawCompleted: (amount: number, processingTimeMs: number) => {
      trackEvent({ eventType: 'withdraw_completed', eventData: { amount, processingTimeMs } });
    },
    withdrawCancelled: (amount: number, stage: string) => {
      trackEvent({ eventType: 'withdraw_cancelled', eventData: { amount, stage } });
    },
    
    // Interaction patterns
    hoverElement: (element: string, durationMs: number) => {
      if (durationMs > 500) { // Only track meaningful hovers
        trackEvent({ eventType: 'hover_element', eventData: { element, durationMs } });
      }
    },
    rageClick: (element: string, clickCount: number) => {
      trackEvent({ eventType: 'rage_click', eventData: { element, clickCount } });
    },
    hesitation: (element: string, hoverTimeBeforeClick: number) => {
      if (hoverTimeBeforeClick > 2000) { // Only track significant hesitation
        trackEvent({ eventType: 'hesitation', eventData: { element, hoverTimeBeforeClick } });
      }
    },
    
    // Generic
    custom: (eventType: string, eventData?: Record<string, unknown>) => {
      trackEvent({ eventType, eventData });
    },
  };
  
  return {
    sessionId: sessionIdRef.current,
    currentPage,
    trackEvent,
    track,
    flushEvents,
  };
}
