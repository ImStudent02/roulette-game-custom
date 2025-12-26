import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getAllUsersWithStats, 
  getUserStats, 
  getUserSessions, 
  getUserEvents 
} from '@/lib/analytics';

// Verify admin session
async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('adminSession')?.value;
  return adminSession === 'authenticated';
}

/**
 * GET /api/admin/user-analytics
 * Get all users with analytics summary
 * Query params: limit, skip, sortBy, sortOrder, search
 */
export async function GET(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const sortBy = searchParams.get('sortBy') || 'lastSeenAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const search = searchParams.get('search') || '';
    const username = searchParams.get('username');
    
    // If username provided, get detailed user data
    if (username) {
      const [stats, sessions, events] = await Promise.all([
        getUserStats(username),
        getUserSessions(username, 20),
        getUserEvents(username, { limit: 100 }),
      ]);
      
      if (!stats) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      return NextResponse.json({
        user: stats,
        sessions,
        recentEvents: events,
      });
    }
    
    // Get paginated list of all users
    const { users, total } = await getAllUsersWithStats({
      limit,
      skip,
      sortBy,
      sortOrder,
      search,
    });
    
    return NextResponse.json({
      users,
      total,
      limit,
      skip,
      hasMore: skip + users.length < total,
    });
  } catch (error) {
    console.error('[Admin Analytics API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
