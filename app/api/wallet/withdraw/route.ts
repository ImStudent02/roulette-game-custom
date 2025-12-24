import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { getUserByUsername, updateBalance, updateUser } from '@/lib/dbManager';
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
    const { amount } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
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

    // Check minimum withdrawal
    if (amount < CURRENCY_CONFIG.MIN_WITHDRAW_JUICE) {
      return NextResponse.json({
        error: `Minimum withdrawal is ${CURRENCY_CONFIG.MIN_WITHDRAW_JUICE} Mango Juice`,
        minimum: CURRENCY_CONFIG.MIN_WITHDRAW_JUICE,
      }, { status: 400 });
    }

    // Check balance
    if (user.mangoJuice < amount) {
      return NextResponse.json({
        error: `Insufficient balance. You have ${user.mangoJuice.toLocaleString()} Mango Juice.`,
        available: user.mangoJuice,
      }, { status: 400 });
    }

    // Calculate USD value (1000 juice = 1 USD)
    const usdValue = amount / CURRENCY_CONFIG.MANGO_JUICE_TO_USD;

    // Deduct mango juice
    const result = await updateBalance(
      session.username,
      'mangoJuice',
      -amount,
      'withdraw',
      `Withdrawn as $${usdValue.toFixed(2)} USD`
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to process withdrawal' },
        { status: 500 }
      );
    }

    // Update total withdrawn
    const newTotalWithdrawn = (user.totalWithdrawn || 0) + usdValue;
    await updateUser(session.username, { totalWithdrawn: newTotalWithdrawn });

    return NextResponse.json({
      success: true,
      withdrawal: {
        mangoJuice: amount,
        usdValue: usdValue,
        displayValue: `$${usdValue.toFixed(2)}`,
      },
      newBalance: result.newBalance,
      message: `💵 Successfully withdrew ${amount.toLocaleString()} Mango Juice ($${usdValue.toFixed(2)} USD)`,
      // Note: In production, this would trigger actual payment processing
      note: 'Withdrawal request submitted. Payment will be processed within 24-48 hours.',
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
