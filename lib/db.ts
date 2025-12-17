import { MongoClient, Db, Collection } from 'mongodb';

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'R_DB';

// Type definitions for collections
export interface UserDocument {
  _id?: string;
  email: string; // Encrypted
  passwordHash?: string; // Optional for Google login
  username: string; // Unique, starts with @, max 20 chars
  displayName: string; // Max 30 chars, emojis allowed
  balance: number;
  totalWins: number;
  totalLosses: number;
  signupTime: number; // Long timestamp
  lastLogin: number; // Long timestamp
}

export interface ChatDocument {
  _id?: string;
  username: string;
  message: string; // Max 50 words, overwritten on edit
  sentAt: number; // Long timestamp - primary ordering key
  editedAt?: number; // Short timestamp, just for display
  replyToTime?: number; // If replying, the original message's sentAt
}

export interface RoundDocument {
  _id?: string;
  roundNumber: number;
  winningNumber: number | string; // 1-50 or 'X'
  innerColor: 'black' | 'white';
  outerColor: 'green' | 'pink' | 'gold' | 'red' | 'none';
  gold: { number: number; multiplier: number }; // Gold position with multiplier
  resultTime: number; // Long timestamp
}

export interface BetItem {
  type: 'black' | 'white' | 'even' | 'odd' | 'green' | 'pink' | 'gold' | 'x' | 'number';
  amount: number;
  targetNumber?: number; // For number bets
}

export interface BetDocument {
  _id?: string;
  roundNumber: number;
  username: string;
  bets: BetItem[]; // Multiple bets as list
  payout?: number; // Calculated at result time
}

// Singleton connection
let client: MongoClient | null = null;
let db: Db | null = null;

// Connection function
export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    console.log(`Connected to MongoDB: ${DB_NAME}`);
    
    // Create indexes for performance
    await createIndexes(db);
    
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Create necessary indexes
async function createIndexes(database: Db): Promise<void> {
  // Users collection indexes
  const users = database.collection('users');
  await users.createIndex({ email: 1 }, { unique: true });
  await users.createIndex({ username: 1 }, { unique: true });
  
  // Chat collection indexes
  const chat = database.collection('chat');
  await chat.createIndex({ sentAt: 1 }); // For ordering
  await chat.createIndex({ username: 1 }); // For user lookups
  
  // Rounds collection indexes
  const rounds = database.collection('rounds');
  await rounds.createIndex({ roundNumber: 1 }, { unique: true });
  
  // Bets collection indexes
  const bets = database.collection('bets');
  await bets.createIndex({ roundNumber: 1, username: 1 });
  await bets.createIndex({ username: 1 });
}

// Get typed collections
export function getCollections(database: Db) {
  return {
    users: database.collection<UserDocument>('users'),
    chat: database.collection<ChatDocument>('chat'),
    rounds: database.collection<RoundDocument>('rounds'),
    bets: database.collection<BetDocument>('bets'),
  };
}

// Chat FIFO - maintain max 10k messages
export async function addChatMessage(
  database: Db,
  message: Omit<ChatDocument, '_id'>
): Promise<void> {
  const { chat } = getCollections(database);
  
  // Insert new message
  await chat.insertOne(message as ChatDocument);
  
  // Check count and delete oldest if > 10k
  const count = await chat.countDocuments();
  if (count > 10000) {
    // Find and delete the oldest message
    const oldest = await chat.findOne({}, { sort: { sentAt: 1 } });
    if (oldest?._id) {
      await chat.deleteOne({ _id: oldest._id });
    }
  }
}

// Edit chat message
export async function editChatMessage(
  database: Db,
  sentAt: number,
  username: string,
  newMessage: string
): Promise<boolean> {
  const { chat } = getCollections(database);
  
  const result = await chat.updateOne(
    { sentAt, username },
    { 
      $set: { 
        message: newMessage,
        editedAt: Date.now()
      }
    }
  );
  
  return result.modifiedCount > 0;
}

// Get recent chat messages
export async function getRecentChat(
  database: Db,
  limit: number = 100
): Promise<ChatDocument[]> {
  const { chat } = getCollections(database);
  
  return await chat
    .find({})
    .sort({ sentAt: -1 })
    .limit(limit)
    .toArray();
}

// Close connection (for cleanup)
export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
