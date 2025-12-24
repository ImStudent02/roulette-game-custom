import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, validateDisplayName } from '@/lib/auth';
import { getUserByUsername, updateUser, getTransactions } from '@/lib/dbManager';
import { SESSION_CONFIG, CURRENCY_CONFIG } from '@/lib/hyperParams';

// GET user profile
export async function GET() {
  try {
    // Verify session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_CONFIG.COOKIE_NAME)?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    const session = verifySessionToken(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      );
    }

    // Get user
    const user = await getUserByUsername(session.username);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get recent transactions
    const transactions = await getTransactions(session.username, 20);

    // Calculate expired juice progress
    const expiredJuiceProgress = {
      current: user.expiredJuice,
      required: CURRENCY_CONFIG.EXPIRED_JUICE_TO_REAL_JUICE,
      percentage: Math.min(100, Math.floor((user.expiredJuice / CURRENCY_CONFIG.EXPIRED_JUICE_TO_REAL_JUICE) * 100)),
      canConvert: user.expiredJuice >= CURRENCY_CONFIG.EXPIRED_JUICE_TO_REAL_JUICE,
    };

    return NextResponse.json({
      user: {
        username: user.username,
        displayName: user.displayName,
        // Currencies
        fermentedMangos: user.fermentedMangos,
        expiredJuice: user.expiredJuice,
        mangos: user.mangos,
        mangoJuice: user.mangoJuice,
        // Stats
        totalWins: user.totalWins,
        totalLosses: user.totalLosses,
        totalDeposited: user.totalDeposited,
        totalWithdrawn: user.totalWithdrawn,
        // Timestamps
        signupTime: user.signupTime,
        lastLogin: user.lastLogin,
      },
      expiredJuiceProgress,
      recentTransactions: transactions.map(tx => ({
        type: tx.type,
        currency: tx.currency,
        amount: tx.amount,
        timestamp: tx.timestamp,
        details: tx.details,
      })),
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH update profile
export async function PATCH(request: NextRequest) {
  try {
    // Verify session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_CONFIG.COOKIE_NAME)?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    const session = verifySessionToken(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      displayName,
      // Currency balance updates from game
      fermentedMangos,
      expiredJuice,
      mangos,
      mangoJuice,
      // Stats updates
      totalWins,
      totalLosses,
    } = body;

    const updates: Record<string, unknown> = {};

    // Validate display name if provided
    if (displayName !== undefined) {
      const validation = validateDisplayName(displayName);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
      updates.displayName = displayName;
    }

    // Handle currency balance updates (only allow non-negative values)
    if (typeof fermentedMangos === 'number' && fermentedMangos >= 0) {
      updates.fermentedMangos = fermentedMangos;
    }
    if (typeof expiredJuice === 'number' && expiredJuice >= 0) {
      updates.expiredJuice = expiredJuice;
    }
    if (typeof mangos === 'number' && mangos >= 0) {
      updates.mangos = mangos;
    }
    if (typeof mangoJuice === 'number' && mangoJuice >= 0) {
      updates.mangoJuice = mangoJuice;
    }

    // Handle stats updates (increment wins/losses)
    if (typeof totalWins === 'number' && totalWins > 0) {
      const currentUser = await getUserByUsername(session.username);
      if (currentUser) {
        updates.totalWins = (currentUser.totalWins || 0) + totalWins;
      }
    }
    if (typeof totalLosses === 'number' && totalLosses > 0) {
      const currentUser = await getUserByUsername(session.username);
      if (currentUser) {
        updates.totalLosses = (currentUser.totalLosses || 0) + totalLosses;
      }
    }

    // Only update if there are changes
    if (Object.keys(updates).length > 0) {
      await updateUser(session.username, updates);
    }

    // Get updated user
    const user = await getUserByUsername(session.username);

    return NextResponse.json({
      success: true,
      user: {
        username: user?.username,
        displayName: user?.displayName,
        fermentedMangos: user?.fermentedMangos,
        expiredJuice: user?.expiredJuice,
        mangos: user?.mangos,
        mangoJuice: user?.mangoJuice,
        totalWins: user?.totalWins,
        totalLosses: user?.totalLosses,
      },
    });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
