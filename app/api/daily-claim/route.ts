import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { getUserByUsername, updateUser, updateBalance } from '@/lib/dbManager';
import { SESSION_CONFIG } from '@/lib/hyperParams';

const DAILY_REWARD = 100; // 100 Fermented Mangos per day

// GET - Check if reward is available
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_CONFIG.COOKIE_NAME)?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySessionToken(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const user = await getUserByUsername(session.username);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if 24 hours have passed since last claim
    const lastClaim = user.lastDailyClaimAt || 0;
    const now = Date.now();
    const hoursSinceClaim = (now - lastClaim) / (1000 * 60 * 60);
    const canClaim = hoursSinceClaim >= 24;
    const hoursUntilClaim = canClaim ? 0 : Math.ceil(24 - hoursSinceClaim);

    return NextResponse.json({
      canClaim,
      hoursUntilClaim,
      rewardAmount: DAILY_REWARD,
      lastClaimAt: lastClaim || null,
      streak: user.dailyStreak || 0,
    });
  } catch (error) {
    console.error('[DailyClaim] GET error:', error);
    return NextResponse.json({ error: 'Failed to check claim status' }, { status: 500 });
  }
}

// POST - Claim the daily reward
export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_CONFIG.COOKIE_NAME)?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySessionToken(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const user = await getUserByUsername(session.username);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if 24 hours have passed
    const lastClaim = user.lastDailyClaimAt || 0;
    const now = Date.now();
    const hoursSinceClaim = (now - lastClaim) / (1000 * 60 * 60);
    
    if (hoursSinceClaim < 24) {
      return NextResponse.json({
        error: 'Already claimed today',
        hoursUntilClaim: Math.ceil(24 - hoursSinceClaim),
      }, { status: 400 });
    }

    // Calculate streak
    let newStreak = 1;
    if (lastClaim > 0) {
      // If claimed within 48 hours, continue streak
      if (hoursSinceClaim < 48) {
        newStreak = (user.dailyStreak || 0) + 1;
      }
    }

    // Streak bonus: +10% per day (max 7 days = 70% bonus)
    const streakBonus = Math.min(newStreak - 1, 6) * 10;
    const totalReward = DAILY_REWARD + Math.floor(DAILY_REWARD * streakBonus / 100);

    // Update user
    await updateBalance(
      session.username,
      'fermentedMangos',
      totalReward,
      'daily_claim',
      `Daily reward (${newStreak} day streak)`
    );

    await updateUser(session.username, {
      lastDailyClaimAt: now,
      dailyStreak: newStreak,
    });

    return NextResponse.json({
      success: true,
      reward: totalReward,
      streak: newStreak,
      bonusPercent: streakBonus,
      newBalance: (user.fermentedMangos || 0) + totalReward,
      message: newStreak > 1
        ? `🎁 Claimed ${totalReward} Fermented Mangos! (${newStreak} day streak!)`
        : `🎁 Claimed ${totalReward} Fermented Mangos!`,
    });
  } catch (error) {
    console.error('[DailyClaim] POST error:', error);
    return NextResponse.json({ error: 'Failed to claim reward' }, { status: 500 });
  }
}
