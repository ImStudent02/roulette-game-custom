import { NextResponse } from 'next/server';
import { connectToDatabase, getCollections } from '@/lib/db';

export async function GET() {
  try {
    const db = await connectToDatabase();
    const { users, transactions, bets, rounds } = getCollections(db);

    // Get total users
    const totalUsers = await users.countDocuments();

    // Get today's transactions for profit calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const todayTransactions = await transactions.find({
      timestamp: { $gte: todayStart }
    }).toArray();

    // Calculate today's profit (losses - wins from house perspective)
    let todayProfit = 0;
    for (const tx of todayTransactions) {
      if (tx.type === 'loss') {
        todayProfit += Math.abs(tx.amount); // House gains
      } else if (tx.type === 'win') {
        todayProfit -= tx.amount; // House pays out
      }
    }

    // Get total bets count
    const totalBets = await bets.countDocuments();

    // Get rounds count for recent activity
    const roundsCount = await rounds.countDocuments();

    // Calculate house fund (sum of all user mangos/mangoJuice represents liability)
    // For now, use a base + today's profit
    const baseFund = 50000000; // 50M mangos = $50K
    const houseFund = baseFund + (todayProfit * 10); // Rough estimate

    return NextResponse.json({
      totalUsers,
      onlineUsers: 0, // WebSocket server tracks this
      houseFund,
      todayProfit: Math.floor(todayProfit / 1000), // Convert to USD approx
      totalBets,
      roundsCount,
    });
  } catch (error) {
    console.error('[Admin Stats] Error:', error);
    return NextResponse.json({
      totalUsers: 0,
      onlineUsers: 0,
      houseFund: 50000000,
      todayProfit: 0,
      totalBets: 0,
    });
  }
}
