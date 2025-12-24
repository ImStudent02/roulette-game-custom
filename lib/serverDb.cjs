/**
 * Database Integration for Server.js
 * CommonJS module that wraps the TypeScript dbManager for use in server.js
 * 
 * This module provides async functions to sync in-memory balances with the database
 */

const { MongoClient } = require('mongodb');

// Get MongoDB URI from environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roulette';

let db = null;
let client = null;

// Connect to MongoDB
async function connectToDatabase() {
  if (db) return db;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('[DB] Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('[DB] Failed to connect to MongoDB:', error.message);
    return null;
  }
}

// Get user balance from database
async function getUserBalance(username) {
  try {
    const database = await connectToDatabase();
    if (!database) return null;
    
    const user = await database.collection('users').findOne({ username });
    if (!user) return null;
    
    return {
      fermentedMangos: user.fermentedMangos || 0,
      expiredJuice: user.expiredJuice || 0,
      mangos: user.mangos || 0,
      mangoJuice: user.mangoJuice || 0,
      totalWins: user.totalWins || 0,
      totalLosses: user.totalLosses || 0,
    };
  } catch (error) {
    console.error('[DB] getUserBalance error:', error.message);
    return null;
  }
}

// Batch update user balances (called after round ends)
async function batchUpdateBalances(updates) {
  try {
    const database = await connectToDatabase();
    if (!database) {
      console.warn('[DB] Database unavailable, queuing updates for later sync');
      return false;
    }
    
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { username: update.username },
        update: {
          $inc: {
            // For trial currency
            fermentedMangos: update.currencyType === 'trial' ? -update.totalLosses : 0,
            expiredJuice: update.currencyType === 'trial' ? update.totalWinnings : 0,
            // For real currency
            mangos: update.currencyType === 'real' ? -update.totalLosses : 0,
            mangoJuice: update.currencyType === 'real' ? update.totalWinnings : 0,
            // Stats
            totalWins: update.totalWinnings > 0 ? 1 : 0,
            totalLosses: update.totalLosses > 0 ? 1 : 0,
          }
        }
      }
    }));
    
    if (bulkOps.length > 0) {
      const result = await database.collection('users').bulkWrite(bulkOps);
      console.log(`[DB] Batch updated ${result.modifiedCount} users`);
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('[DB] batchUpdateBalances error:', error.message);
    return false;
  }
}

// Log transactions for a round
async function logRoundTransactions(roundNumber, results) {
  try {
    const database = await connectToDatabase();
    if (!database) return false;
    
    const transactions = [];
    const timestamp = Date.now();
    
    for (const [username, result] of results) {
      // Log each bet result
      for (const bet of result.bets) {
        transactions.push({
          username,
          type: bet.won ? 'win' : 'loss',
          currency: result.currencyType === 'trial' ? 
            (bet.won ? 'expiredJuice' : 'fermentedMango') :
            (bet.won ? 'mangoJuice' : 'mango'),
          amount: bet.won ? bet.winnings : -bet.amount,
          balanceAfter: 0, // Would need to track properly
          timestamp,
          roundNumber,
          details: `${bet.type} bet ${bet.won ? 'won' : 'lost'}: ${bet.amount} @ ${bet.multiplier || 0}x`,
        });
      }
    }
    
    if (transactions.length > 0) {
      await database.collection('transactions').insertMany(transactions);
      console.log(`[DB] Logged ${transactions.length} transactions for round ${roundNumber}`);
    }
    
    return true;
  } catch (error) {
    console.error('[DB] logRoundTransactions error:', error.message);
    return false;
  }
}

module.exports = {
  connectToDatabase,
  getUserBalance,
  batchUpdateBalances,
  logRoundTransactions,
};
