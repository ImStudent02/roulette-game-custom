import { NextResponse } from 'next/server';
import { connectAnalyticsDb } from '@/lib/analytics';

/**
 * POST /api/analytics/heartbeat
 * Update session last active time
 */
export async function POST(request: Request) {
  try {
    const { sessionId, page, isActive } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }
    
    const db = await connectAnalyticsDb();
    const sessions = db.collection('user_sessions');
    
    await sessions.updateOne(
      { sessionId },
      {
        $set: {
          lastActiveAt: Date.now(),
          'currentActivity.page': page,
          'currentActivity.isActive': isActive,
        },
      }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // console.error('[Analytics API] Heartbeat error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
