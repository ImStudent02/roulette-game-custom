import { NextResponse } from 'next/server';
import { logEvents, AnalyticsEvent } from '@/lib/analytics';

/**
 * POST /api/analytics/events
 * Batch log analytics events
 */
export async function POST(request: Request) {
  try {
    const { events } = await request.json();
    
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 });
    }
    
    // Validate events
    const validEvents: AnalyticsEvent[] = events
      .filter((e: AnalyticsEvent) => e.username && e.sessionId && e.eventType)
      .map((e: AnalyticsEvent) => ({
        username: e.username,
        sessionId: e.sessionId,
        eventType: e.eventType,
        eventData: e.eventData || {},
        timestamp: e.timestamp || Date.now(),
        page: e.page || '',
        device: e.device,
      }));
    
    if (validEvents.length === 0) {
      return NextResponse.json({ error: 'No valid events' }, { status: 400 });
    }
    
    await logEvents(validEvents);
    
    return NextResponse.json({ success: true, logged: validEvents.length });
  } catch (error) {
    // console.error('[Analytics API] Events error:', error);
    return NextResponse.json({ error: 'Failed to log events' }, { status: 500 });
  }
}
