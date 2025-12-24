import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { getUserByUsername, updateBalance } from '@/lib/dbManager';
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
    const { type } = body;

    // Get user
    const user = await getUserByUsername(session.username);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (type === 'expired_to_juice') {
      // Convert Expired Juice → Mango Juice
      // Rate: 100,000 expired → 100 juice
      const requiredExpired = CURRENCY_CONFIG.EXPIRED_JUICE_TO_REAL_JUICE;
      const outputJuice = CURRENCY_CONFIG.EXPIRED_JUICE_OUTPUT;

      if (user.expiredJuice < requiredExpired) {
        return NextResponse.json({
          error: `Need ${requiredExpired.toLocaleString()} Expired Juice. You have ${user.expiredJuice.toLocaleString()}.`,
          required: requiredExpired,
          current: user.expiredJuice,
          progress: Math.floor((user.expiredJuice / requiredExpired) * 100),
        }, { status: 400 });
      }

      // Deduct expired juice
      const deductResult = await updateBalance(
        session.username,
        'expiredJuice',
        -requiredExpired,
        'convert',
        `Converted to ${outputJuice} Mango Juice`
      );

      if (!deductResult.success) {
        return NextResponse.json(
          { error: 'Failed to process conversion' },
          { status: 500 }
        );
      }

      // Add mango juice
      const addResult = await updateBalance(
        session.username,
        'mangoJuice',
        outputJuice,
        'convert',
        `Converted from ${requiredExpired} Expired Juice`
      );

      return NextResponse.json({
        success: true,
        conversion: {
          from: { currency: 'expiredJuice', amount: requiredExpired },
          to: { currency: 'mangoJuice', amount: outputJuice },
        },
        newBalance: {
          expiredJuice: deductResult.newBalance,
          mangoJuice: addResult.newBalance,
        },
        message: `🧃 Converted ${requiredExpired.toLocaleString()} Expired Juice to ${outputJuice} Mango Juice!`,
      });
    } 
    
    else if (type === 'juice_to_mango') {
      // Convert Mango Juice → Mangos (1:1)
      const { amount } = body;

      if (!amount || amount <= 0) {
        return NextResponse.json(
          { error: 'Amount must be positive' },
          { status: 400 }
        );
      }

      if (user.mangoJuice < amount) {
        return NextResponse.json({
          error: `Insufficient Mango Juice. You have ${user.mangoJuice.toLocaleString()}.`,
          available: user.mangoJuice,
        }, { status: 400 });
      }

      // Deduct juice
      const deductResult = await updateBalance(
        session.username,
        'mangoJuice',
        -amount,
        'convert',
        `Converted to ${amount} Mangos`
      );

      if (!deductResult.success) {
        return NextResponse.json(
          { error: 'Failed to process conversion' },
          { status: 500 }
        );
      }

      // Add mangos (1:1)
      const mangosToAdd = amount * CURRENCY_CONFIG.MANGO_JUICE_TO_MANGO;
      const addResult = await updateBalance(
        session.username,
        'mangos',
        mangosToAdd,
        'convert',
        `Converted from ${amount} Mango Juice`
      );

      return NextResponse.json({
        success: true,
        conversion: {
          from: { currency: 'mangoJuice', amount },
          to: { currency: 'mangos', amount: mangosToAdd },
        },
        newBalance: {
          mangoJuice: deductResult.newBalance,
          mangos: addResult.newBalance,
        },
        message: `🥭 Converted ${amount.toLocaleString()} Mango Juice to ${mangosToAdd.toLocaleString()} Mangos!`,
      });
    }
    
    else {
      return NextResponse.json(
        { error: 'Invalid conversion type. Use "expired_to_juice" or "juice_to_mango"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Convert error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
