/**
 * Analytics Database Connection
 * Separate database for user analytics (R_ANALYTICS_DB)
 */

import { MongoClient, Db, Collection, Filter, Document } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const ANALYTICS_DB_NAME = 'R_ANALYTICS_DB';

let client: MongoClient | null = null;
let db: Db | null = null;

// Connect to analytics database
export async function connectAnalyticsDb(): Promise<Db> {
  if (db) return db;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(ANALYTICS_DB_NAME);
    
    // Create indexes for performance
    await createIndexes(db);
    
    return db;
  } catch (error) {
    console.error('[AnalyticsDB] Connection error:', error);
    throw error;
  }
}

// Create indexes for efficient querying
async function createIndexes(database: Db) {
  try {
    // user_events indexes
    const events = database.collection('user_events');
    await events.createIndex({ username: 1, timestamp: -1 });
    await events.createIndex({ sessionId: 1 });
    await events.createIndex({ eventType: 1, timestamp: -1 });
    await events.createIndex({ timestamp: -1 });
    
    // user_sessions indexes
    const sessions = database.collection('user_sessions');
    await sessions.createIndex({ username: 1, startedAt: -1 });
    await sessions.createIndex({ sessionId: 1 }, { unique: true });
    
    // user_stats index (username is _id)
  } catch (error) {
    // Indexes may already exist
  }
}

// ============================================
// Event Types
// ============================================

export interface AnalyticsEvent {
  username: string;
  sessionId: string;
  eventType: string;
  eventData: Record<string, unknown>;
  timestamp: number;
  page: string;
  device?: {
    userAgent?: string;
    screenSize?: string;
    browser?: string;
    os?: string;
  };
}

export interface UserSession {
  sessionId: string;
  username: string;
  startedAt: number;
  endedAt: number | null;
  lastActiveAt: number;
  device: {
    userAgent: string;
    screenSize: string;
    browser: string;
    os: string;
  };
  summary: {
    totalDuration: number;
    pagesVisited: string[];
    betsPlaced: number;
    betsRemoved: number;
    roundsPlayed: number;
    roundsSkipped: number;
    chatMessages: number;
    topupAttempts: number;
    topupCompleted: number;
  };
}

export interface UserStats {
  _id: string; // username
  
  // Lifetime counts
  totalSessions: number;
  totalTimeSpent: number;
  totalBetsPlaced: number;
  totalBetsRemoved: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  
  // Patterns
  avgSessionDuration: number;
  avgBetsPerSession: number;
  avgBetSize: number;
  betRemovalRate: number;
  lastSecondRemovalRate: number;
  
  // Risk indicators
  maxSingleBet: number;
  maxLossStreak: number;
  maxWinStreak: number;
  currentLossStreak: number;
  currentWinStreak: number;
  
  // Engagement
  firstSeenAt: number;
  lastSeenAt: number;
  favoriteTimeOfDay: string;
  avgRoundsPerSession: number;
  skipRate: number;
  chatEngagement: number;
  topupConversionRate: number;
}

// ============================================
// Core Functions
// ============================================

/**
 * Log an analytics event
 */
export async function logEvent(event: AnalyticsEvent): Promise<boolean> {
  try {
    const database = await connectAnalyticsDb();
    const collection = database.collection('user_events');
    
    await collection.insertOne({
      ...event,
      _createdAt: new Date(),
    });
    
    return true;
  } catch (error) {
    // console.error('[Analytics] Log event error:', error);
    return false;
  }
}

/**
 * Log multiple events at once (batch)
 */
export async function logEvents(events: AnalyticsEvent[]): Promise<boolean> {
  if (events.length === 0) return true;
  
  try {
    const database = await connectAnalyticsDb();
    const collection = database.collection('user_events');
    
    await collection.insertMany(
      events.map(e => ({ ...e, _createdAt: new Date() }))
    );
    
    return true;
  } catch (error) {
    // console.error('[Analytics] Batch log error:', error);
    return false;
  }
}

/**
 * Start a new session
 */
export async function startSession(session: Omit<UserSession, 'endedAt' | 'summary'>): Promise<boolean> {
  try {
    const database = await connectAnalyticsDb();
    const sessions = database.collection('user_sessions');
    
    await sessions.insertOne({
      ...session,
      endedAt: null,
      summary: {
        totalDuration: 0,
        pagesVisited: [],
        betsPlaced: 0,
        betsRemoved: 0,
        roundsPlayed: 0,
        roundsSkipped: 0,
        chatMessages: 0,
        topupAttempts: 0,
        topupCompleted: 0,
      },
    });
    
    // Update user stats
    await updateUserStats(session.username, {
      $inc: { totalSessions: 1 },
      $set: { lastSeenAt: session.startedAt },
      $setOnInsert: { firstSeenAt: session.startedAt },
    });
    
    return true;
  } catch (error: any) {
    // Ignore duplicate session errors (happens in dev/strict mode or race conditions)
    if (error.code === 11000) {
      return true;
    }
    // Only log other errors
    // console.error('[Analytics] Start session error:', error); 
    return false;
  }
}

/**
 * End a session
 */
export async function endSession(sessionId: string, endedAt: number): Promise<boolean> {
  try {
    const database = await connectAnalyticsDb();
    const sessions = database.collection('user_sessions');
    
    const session = await sessions.findOne({ sessionId });
    if (!session) return false;
    
    const duration = endedAt - session.startedAt;
    
    await sessions.updateOne(
      { sessionId },
      {
        $set: {
          endedAt,
          'summary.totalDuration': duration,
        },
      }
    );
    
    // Update user's total time
    await updateUserStats(session.username, {
      $inc: { totalTimeSpent: duration },
    });
    
    return true;
  } catch (error) {
    // console.error('[Analytics] End session error:', error);
    return false;
  }
}

/**
 * Update session summary (increment counters)
 */
export async function updateSessionSummary(
  sessionId: string,
  updates: Partial<UserSession['summary']>
): Promise<boolean> {
  try {
    const database = await connectAnalyticsDb();
    const sessions = database.collection('user_sessions');
    
    const $inc: Record<string, number> = {};
    const $addToSet: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'pagesVisited' && Array.isArray(value)) {
        $addToSet[`summary.${key}`] = { $each: value };
      } else if (typeof value === 'number') {
        $inc[`summary.${key}`] = value;
      }
    }
    
    const updateOps: Record<string, unknown> = {};
    if (Object.keys($inc).length > 0) updateOps.$inc = $inc;
    if (Object.keys($addToSet).length > 0) updateOps.$addToSet = $addToSet;
    updateOps.$set = { lastActiveAt: Date.now() };
    
    await sessions.updateOne({ sessionId }, updateOps);
    
    return true;
  } catch (error) {
    // console.error('[Analytics] Update session error:', error);
    return false;
  }
}

/**
 * Update user lifetime stats
 */
export async function updateUserStats(
  username: string,
  updates: Record<string, unknown>
): Promise<boolean> {
  try {
    const database = await connectAnalyticsDb();
    const stats = database.collection('user_stats');
    
    await stats.updateOne(
      { _id: username } as unknown as Filter<Document>,
      updates,
      { upsert: true }
    );
    
    return true;
  } catch (error) {
    // console.error('[Analytics] Update user stats error:', error);
    return false;
  }
}

/**
 * Get user events (for admin)
 */
export async function getUserEvents(
  username: string,
  options: {
    limit?: number;
    skip?: number;
    eventTypes?: string[];
    startTime?: number;
    endTime?: number;
  } = {}
): Promise<AnalyticsEvent[]> {
  try {
    const database = await connectAnalyticsDb();
    const events = database.collection('user_events');
    
    const query: Record<string, unknown> = { username };
    
    if (options.eventTypes?.length) {
      query.eventType = { $in: options.eventTypes };
    }
    
    if (options.startTime || options.endTime) {
      query.timestamp = {};
      if (options.startTime) (query.timestamp as Record<string, number>).$gte = options.startTime;
      if (options.endTime) (query.timestamp as Record<string, number>).$lte = options.endTime;
    }
    
    return await events
      .find(query)
      .sort({ timestamp: -1 })
      .skip(options.skip || 0)
      .limit(options.limit || 100)
      .toArray() as unknown as AnalyticsEvent[];
  } catch (error) {
    // console.error('[Analytics] Get events error:', error);
    return [];
  }
}

/**
 * Get user sessions (for admin)
 */
export async function getUserSessions(
  username: string,
  limit = 50
): Promise<UserSession[]> {
  try {
    const database = await connectAnalyticsDb();
    const sessions = database.collection('user_sessions');
    
    return await sessions
      .find({ username })
      .sort({ startedAt: -1 })
      .limit(limit)
      .toArray() as unknown as UserSession[];
  } catch (error) {
    // console.error('[Analytics] Get sessions error:', error);
    return [];
  }
}

/**
 * Get user stats
 */
export async function getUserStats(username: string): Promise<UserStats | null> {
  try {
    const database = await connectAnalyticsDb();
    const stats = database.collection('user_stats');
    
    return await stats.findOne({ _id: username } as unknown as Filter<Document>) as unknown as UserStats | null;
  } catch (error) {
    // console.error('[Analytics] Get stats error:', error);
    return null;
  }
}

/**
 * Get all users with stats (for admin list)
 */
export async function getAllUsersWithStats(options: {
  limit?: number;
  skip?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
} = {}): Promise<{ users: UserStats[]; total: number }> {
  try {
    const database = await connectAnalyticsDb();
    const stats = database.collection('user_stats');
    
    const query: Record<string, unknown> = {};
    if (options.search) {
      query._id = { $regex: options.search, $options: 'i' };
    }
    
    const sortField = options.sortBy || 'lastSeenAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
    
    const [users, total] = await Promise.all([
      stats
        .find(query)
        .sort({ [sortField]: sortOrder })
        .skip(options.skip || 0)
        .limit(options.limit || 50)
        .toArray(),
      stats.countDocuments(query),
    ]);
    
    return { users: users as unknown as UserStats[], total };
  } catch (error) {
    // console.error('[Analytics] Get all users error:', error);
    return { users: [], total: 0 };
  }
}
