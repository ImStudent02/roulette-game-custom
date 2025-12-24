import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { getUserByUsername, updateBalance, logTransaction } from '@/lib/dbManager';
import { CURRENCY_CONFIG, SESSION_CONFIG } from '@/lib/hyperParams';

export async function POST(request: NextRequest) {
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
    const { packageId } = body;

    // Find package
    const pkg = CURRENCY_CONFIG.TOPUP_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return NextResponse.json(
        { error: 'Invalid package selected' },
        { status: 400 }
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

    // Calculate mangos with bonus
    const bonusAmount = Math.floor(pkg.baseMangos * (pkg.bonusPercent / 100));
    const totalMangos = pkg.baseMangos + bonusAmount;

    // Update user balance
    const result = await updateBalance(
      session.username,
      'mangos',
      totalMangos,
      'topup',
      `Package: ${pkg.id}, USD: ${pkg.usd}, Bonus: ${pkg.bonusPercent}%`
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to process top-up' },
        { status: 500 }
      );
    }

    // Update total deposited
    const newTotalDeposited = (user.totalDeposited || 0) + pkg.usd;
    await getUserByUsername(session.username).then(async (u) => {
      if (u) {
        await logTransaction({
          username: session.username,
          type: 'topup',
          currency: 'usd',
          amount: pkg.usd,
          balanceAfter: newTotalDeposited,
          timestamp: Date.now(),
          details: `USD deposit for ${totalMangos} mangos`,
        });
      }
    });

    return NextResponse.json({
      success: true,
      package: {
        id: pkg.id,
        usd: pkg.usd,
        baseMangos: pkg.baseMangos,
        bonusPercent: pkg.bonusPercent,
        bonusAmount,
        totalMangos,
      },
      newBalance: result.newBalance,
      message: bonusAmount > 0 
        ? `🎉 You received ${totalMangos.toLocaleString()} mangos (including ${bonusAmount.toLocaleString()} bonus)!`
        : `✅ You received ${totalMangos.toLocaleString()} mangos!`,
    });
  } catch (error) {
    console.error('Top-up error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET available packages
export async function GET() {
  const packages = CURRENCY_CONFIG.TOPUP_PACKAGES.map(pkg => ({
    id: pkg.id,
    usd: pkg.usd,
    baseMangos: pkg.baseMangos,
    bonusPercent: pkg.bonusPercent,
    totalMangos: pkg.baseMangos + Math.floor(pkg.baseMangos * (pkg.bonusPercent / 100)),
    displayPrice: `$${pkg.usd}`,
    hasBonus: pkg.bonusPercent > 0,
  }));

  return NextResponse.json({ packages });
}
