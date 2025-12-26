import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Import house fund functions
import { 
  getHouseFund, 
  updateHouseFund, 
  getHouseTransactions,
} from '@/lib/houseFund';

const MANGO_TO_USD = 1000; // 1000 mangos = $1

// Verify admin session
async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('adminSession')?.value;
  return adminSession === 'authenticated';
}

// GET - Get house fund balance and recent transactions
export async function GET() {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fund = await getHouseFund();
    const transactions = await getHouseTransactions(50);

    return NextResponse.json({
      fund: fund || { balanceMangos: 0, balanceUSD: 0 },
      transactions,
      message: fund ? 'House fund loaded' : 'No fund initialized - admin must deposit',
    });
  } catch (error) {
    console.error('[AdminHouseFund] GET error:', error);
    return NextResponse.json({ error: 'Failed to get house fund' }, { status: 500 });
  }
}

// POST - Admin deposit funds (amount in USD)
export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, note } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    // Convert USD to mangos for internal storage
    const mangoAmount = amount * MANGO_TO_USD;

    const result = await updateHouseFund(mangoAmount, 'admin_deposit', {
      adminNote: note || 'Admin deposit',
    });

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to deposit' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      newBalanceUSD: result.newBalance / MANGO_TO_USD,
      depositedUSD: amount,
      message: `Deposited $${amount.toLocaleString()}`,
    });
  } catch (error) {
    console.error('[AdminHouseFund] POST error:', error);
    return NextResponse.json({ error: 'Failed to deposit' }, { status: 500 });
  }
}

// DELETE - Admin withdraw funds (amount in USD)
export async function DELETE(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, note } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    // Convert USD to mangos for internal storage
    const mangoAmount = amount * MANGO_TO_USD;

    const result = await updateHouseFund(-mangoAmount, 'admin_withdraw', {
      adminNote: note || 'Admin withdrawal',
    });

    if (!result.success) {
      return NextResponse.json({ 
        error: 'Insufficient balance or failed to withdraw',
        currentBalanceUSD: result.newBalance / MANGO_TO_USD,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      newBalanceUSD: result.newBalance / MANGO_TO_USD,
      withdrawnUSD: amount,
      message: `Withdrew $${amount.toLocaleString()}`,
    });
  } catch (error) {
    console.error('[AdminHouseFund] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to withdraw' }, { status: 500 });
  }
}

