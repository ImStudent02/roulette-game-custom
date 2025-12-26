/**
 * House Fund Management - CommonJS wrapper for server.js
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'R_DB';
const HOUSE_FUND_ID = 'house_fund';
const MANGO_TO_USD = 1000;

let client = null;
let db = null;
let cachedBalance = 0;

async function connectToDatabase() {
  if (db) return db;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    return db;
  } catch (error) {
    console.error('[HouseFund] DB connection error:', error.message);
    return null;
  }
}

/**
 * Load house fund from database on startup
 */
async function loadHouseFundOnStartup() {
  try {
    const database = await connectToDatabase();
    if (!database) return 0;
    
    const collection = database.collection('house_fund');
    const doc = await collection.findOne({ _id: HOUSE_FUND_ID });
    
    cachedBalance = doc?.balanceMangos ?? 0;
    return cachedBalance;
  } catch (error) {
    console.error('[HouseFund] Error loading fund:', error.message);
    return 0;
  }
}

/**
 * Get cached balance (fast, no DB call)
 */
function getCachedBalance() {
  return cachedBalance;
}

/**
 * Update house fund balance
 */
async function updateHouseFund(deltaAmount, type, metadata = {}) {
  try {
    const database = await connectToDatabase();
    if (!database) return { success: false, newBalance: cachedBalance };
    
    const fundCollection = database.collection('house_fund');
    const txCollection = database.collection('house_transactions');
    const now = Date.now();
    
    // Get or create fund document
    let currentDoc = await fundCollection.findOne({ _id: HOUSE_FUND_ID });
    
    if (!currentDoc) {
      currentDoc = {
        _id: HOUSE_FUND_ID,
        balanceMangos: 0,
        balanceUSD: 0,
        lastUpdated: now,
        createdAt: now,
      };
      await fundCollection.insertOne(currentDoc);
    }
    
    const newBalance = currentDoc.balanceMangos + deltaAmount;
    const newBalanceUSD = newBalance / MANGO_TO_USD;
    
    // Prevent negative balance for withdrawals
    if (newBalance < 0 && (type === 'user_withdraw' || type === 'admin_withdraw')) {
      console.warn(`[HouseFund] Insufficient balance for ${type}: need ${Math.abs(deltaAmount)}, have ${currentDoc.balanceMangos}`);
      return { success: false, newBalance: currentDoc.balanceMangos };
    }
    
    // Update fund
    await fundCollection.updateOne(
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
    await txCollection.insertOne({
      type,
      amount: deltaAmount,
      amountUSD: deltaAmount / MANGO_TO_USD,
      balanceAfter: newBalance,
      username: metadata.username || null,
      adminNote: metadata.adminNote || null,
      roundNumber: metadata.roundNumber || null,
      timestamp: now,
    });
    
    cachedBalance = newBalance;
    
    return { success: true, newBalance };
  } catch (error) {
    console.error('[HouseFund] Update error:', error.message);
    return { success: false, newBalance: cachedBalance };
  }
}

/**
 * Get recent transactions
 */
async function getHouseTransactions(limit = 50) {
  try {
    const database = await connectToDatabase();
    if (!database) return [];
    
    const collection = database.collection('house_transactions');
    return await collection
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error('[HouseFund] Get transactions error:', error.message);
    return [];
  }
}

module.exports = {
  loadHouseFundOnStartup,
  getCachedBalance,
  updateHouseFund,
  getHouseTransactions,
  MANGO_TO_USD,
};
