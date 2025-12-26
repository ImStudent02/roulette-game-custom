/**
 * House Fund Management
 * Persistent storage for house fund with transaction logging
 */

import { connectToDatabase, getCollections } from './db';
import { Db, Collection } from 'mongodb';

// Types
export interface HouseFundDocument {
  _id: string;
  balanceMangos: number;
  balanceUSD: number;
  lastUpdated: number;
  createdAt: number;
}

export interface HouseTransactionDocument {
  type: 'user_loss' | 'user_win' | 'user_withdraw' | 'admin_deposit' | 'admin_withdraw';
  amount: number;       // In mangos
  amountUSD: number;    // In USD
  balanceAfter: number;
  username?: string;    // null for admin actions
  adminNote?: string;
  roundNumber?: number;
  timestamp: number;
}

const HOUSE_FUND_ID = 'house_fund';
const MANGO_TO_USD = 1000; // 1000 mangos = $1

// Cache for server-side usage
let cachedBalance: number | null = null;

/**
 * Get the house_fund collection
 */
async function getHouseFundCollection(): Promise<Collection<HouseFundDocument>> {
  const db = await connectToDatabase();
  return db.collection<HouseFundDocument>('house_fund');
}

/**
 * Get the house_transactions collection
 */
async function getTransactionsCollection(): Promise<Collection<HouseTransactionDocument>> {
  const db = await connectToDatabase();
  return db.collection<HouseTransactionDocument>('house_transactions');
}

/**
 * Get current house fund balance
 * Returns 0 if not initialized (admin must deposit first)
 */
export async function getHouseFund(): Promise<HouseFundDocument | null> {
  try {
    const collection = await getHouseFundCollection();
    const doc = await collection.findOne({ _id: HOUSE_FUND_ID });
    
    if (doc) {
      cachedBalance = doc.balanceMangos;
    }
    
    return doc;
  } catch (error) {
    console.error('[HouseFund] Error getting fund:', error);
    return null;
  }
}

/**
 * Get cached balance (for server-side performance)
 */
export function getCachedBalance(): number {
  return cachedBalance ?? 0;
}

/**
 * Update house fund with atomic operation and log transaction
 */
export async function updateHouseFund(
  deltaAmount: number,
  type: HouseTransactionDocument['type'],
  metadata: {
    username?: string;
    adminNote?: string;
    roundNumber?: number;
  } = {}
): Promise<{ success: boolean; newBalance: number }> {
  try {
    const collection = await getHouseFundCollection();
    const txCollection = await getTransactionsCollection();
    const now = Date.now();
    
    // Get current fund or create if not exists
    let currentDoc = await collection.findOne({ _id: HOUSE_FUND_ID });
    
    if (!currentDoc) {
      // Initialize with 0 balance (admin must deposit)
      currentDoc = {
        _id: HOUSE_FUND_ID,
        balanceMangos: 0,
        balanceUSD: 0,
        lastUpdated: now,
        createdAt: now,
      };
      await collection.insertOne(currentDoc);
    }
    
    const newBalance = currentDoc.balanceMangos + deltaAmount;
    const newBalanceUSD = newBalance / MANGO_TO_USD;
    
    // Prevent negative balance for withdrawals
    if (newBalance < 0 && (type === 'user_withdraw' || type === 'admin_withdraw')) {
      return { success: false, newBalance: currentDoc.balanceMangos };
    }
    
    // Atomic update
    await collection.updateOne(
      { _id: HOUSE_FUND_ID },
      {
        $set: {
          balanceMangos: newBalance,
          balanceUSD: newBalanceUSD,
          lastUpdated: now,
        },
      }
    );
    
    // Log transaction
    const transaction: HouseTransactionDocument = {
      type,
      amount: deltaAmount,
      amountUSD: deltaAmount / MANGO_TO_USD,
      balanceAfter: newBalance,
      username: metadata.username,
      adminNote: metadata.adminNote,
      roundNumber: metadata.roundNumber,
      timestamp: now,
    };
    
    await txCollection.insertOne(transaction);
    
    // Update cache
    cachedBalance = newBalance;
    
    console.log(`[HouseFund] ${type}: ${deltaAmount > 0 ? '+' : ''}${deltaAmount} mangos → ${newBalance} total`);
    
    return { success: true, newBalance };
  } catch (error) {
    console.error('[HouseFund] Error updating fund:', error);
    return { success: false, newBalance: cachedBalance ?? 0 };
  }
}

/**
 * Get recent house transactions
 */
export async function getHouseTransactions(
  limit: number = 50,
  type?: HouseTransactionDocument['type']
): Promise<HouseTransactionDocument[]> {
  try {
    const collection = await getTransactionsCollection();
    const query = type ? { type } : {};
    
    return await collection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error('[HouseFund] Error getting transactions:', error);
    return [];
  }
}

/**
 * Load and cache house fund on server startup
 */
export async function loadHouseFundOnStartup(): Promise<number> {
  const fund = await getHouseFund();
  const balance = fund?.balanceMangos ?? 0;
  cachedBalance = balance;
  return balance;
}
