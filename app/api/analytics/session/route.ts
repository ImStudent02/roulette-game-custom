import { NextResponse } from 'next/server';
import { startSession, endSession, updateSessionSummary } from '@/lib/analytics';

/**
 * POST /api/analytics/session
 * Start or end a session
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, sessionId, username, device, endedAt } = body;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }
    
    if (action === 'start') {
      if (!username) {
        return NextResponse.json({ error: 'Username required' }, { status: 400 });
      }
      
      await startSession({
        sessionId,
        username,
        startedAt: Date.now(),
        lastActiveAt: Date.now(),
        device: device || {
          userAgent: '',
          screenSize: '',
          browser: 'Unknown',
          os: 'Unknown',
        },
      });
      
      return NextResponse.json({ success: true, action: 'started' });
    }
    
    if (action === 'end') {
      await endSession(sessionId, endedAt || Date.now());
      return NextResponse.json({ success: true, action: 'ended' });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    // console.error('[Analytics API] Session error:', error);
    return NextResponse.json({ error: 'Failed to process session' }, { status: 500 });
  }
}

/**
 * PATCH /api/analytics/session
 * Update session summary
 */
export async function PATCH(request: Request) {
  try {
    const { sessionId, updates } = await request.json();
    
    if (!sessionId || !updates) {
      return NextResponse.json({ error: 'Session ID and updates required' }, { status: 400 });
    }
    
    await updateSessionSummary(sessionId, updates);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // console.error('[Analytics API] Session update error:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
