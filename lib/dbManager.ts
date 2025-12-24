import { Db } from 'mongodb';
import { 
  connectToDatabase, 
  getCollections, 
  UserDocument, 
  TransactionDocument, 
  OTPDocument 
} from './db';
import * as fileDb from './fileSystemDb';
import { hashEmailForLookup } from './auth';

type OTPPurpose = 'signup' | 'login' | 'reset';

// ============================================
// Database Manager
// Automatically switches between MongoDB and file fallback
// ============================================

let mongoDb: Db | null = null;
let mongoAvailable = false;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

// ============================================
// MongoDB Health Check
// ============================================

async function checkMongoHealth(): Promise<boolean> {
  const now = Date.now();
  
  // Use cached result if recent
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return mongoAvailable;
  }
  
  try {
    if (!mongoDb) {
      mongoDb = await connectToDatabase();
    }
    
    // Ping the database
    await mongoDb.command({ ping: 1 });
    mongoAvailable = true;
    lastHealthCheck = now;
    
    // Try to sync pending writes
    await syncPendingWrites();
    
    return true;
  } catch (error) {
    console.warn('MongoDB unavailable, using file fallback:', error);
    mongoAvailable = false;
    mongoDb = null;
    lastHealthCheck = now;
    return false;
  }
}

// ============================================
// Sync Pending Writes to MongoDB
// ============================================

async function syncPendingWrites(): Promise<void> {
  if (!mongoDb || !mongoAvailable) return;
  
  const queue = fileDb.getSyncQueue();
  if (queue.pending.length === 0) return;
  
  console.log(`Syncing ${queue.pending.length} pending writes to MongoDB...`);
  
  const collections = getCollections(mongoDb);
  
  for (const item of queue.pending) {
    try {
      switch (item.collection) {
        case 'users':
          if (item.operation === 'insert') {
            const userData = item.data as unknown as UserDocument;
            await collections.users.updateOne(
              { username: userData.username },
              { $set: item.data },
              { upsert: true }
            );
          } else if (item.operation === 'update') {
            const { username, updates } = item.data as { username: string; updates: Partial<UserDocument> };
            await collections.users.updateOne(
              { username },
              { $set: updates }
            );
          }
          break;
          
        case 'transactions':
          await collections.transactions.insertOne(item.data as unknown as TransactionDocument);
          break;
          
        case 'otp':
          // OTPs are ephemeral, skip syncing old ones
          break;
      }
      
      fileDb.removeSyncQueueItem(item.id);
    } catch (error) {
      console.error(`Failed to sync item ${item.id}:`, error);
      // Keep item in queue for retry
    }
  }
}

// ============================================
// User Operations
// ============================================

export async function createUser(user: UserDocument): Promise<{ success: boolean; error?: string }> {
  const isMongoUp = await checkMongoHealth();
  
  if (isMongoUp && mongoDb) {
    try {
      const { users } = getCollections(mongoDb);
      await users.insertOne(user);
      return { success: true };
    } catch (error: unknown) {
      const mongoError = error as { code?: number };
      if (mongoError.code === 11000) {
        return { success: false, error: 'Username or email already exists' };
      }
      // Fallback to file system
      console.warn('MongoDB insert failed, using file fallback');
    }
  }
  
  // File fallback
  const existingUser = fileDb.getUser(user.username);
  if (existingUser) {
    return { success: false, error: 'Username already exists' };
  }
  
  fileDb.saveUser(user);
  return { success: true };
}

export async function getUserByUsername(username: string): Promise<UserDocument | null> {
  const isMongoUp = await checkMongoHealth();
  
  if (isMongoUp && mongoDb) {
    try {
      const { users } = getCollections(mongoDb);
      const user = await users.findOne({ username });
      return user;
    } catch (error) {
      console.warn('MongoDB query failed, using file fallback');
    }
  }
  
  return fileDb.getUser(username);
}

export async function getUserByEmail(email: string): Promise<UserDocument | null> {
  const isMongoUp = await checkMongoHealth();
  const emailHash = hashEmailForLookup(email);
  
  if (isMongoUp && mongoDb) {
    try {
      const { users } = getCollections(mongoDb);
      // We need to search by encrypted email or email hash
      // For now, let's use a stored emailHash field
      const user = await users.findOne({ emailHash });
      return user;
    } catch (error) {
      console.warn('MongoDB query failed, using file fallback');
    }
  }
  
  return fileDb.getUserByEmail(emailHash);
}

export async function updateUser(
  username: string, 
  updates: Partial<UserDocument>
): Promise<boolean> {
  const isMongoUp = await checkMongoHealth();
  
  if (isMongoUp && mongoDb) {
    try {
      const { users } = getCollections(mongoDb);
      const result = await users.updateOne(
        { username },
        { $set: updates }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.warn('MongoDB update failed, using file fallback');
    }
  }
  
  return fileDb.updateUser(username, updates);
}

// ============================================
// OTP Operations
// ============================================

export async function createOTP(otpDoc: OTPDocument): Promise<void> {
  const isMongoUp = await checkMongoHealth();
  
  if (isMongoUp && mongoDb) {
    try {
      const { otp } = getCollections(mongoDb);
      // Upsert to replace existing OTP for same email/purpose
      await otp.updateOne(
        { email: otpDoc.email, purpose: otpDoc.purpose },
        { $set: otpDoc },
        { upsert: true }
      );
      return;
    } catch (error) {
      console.warn('MongoDB OTP insert failed, using file fallback');
    }
  }
  
  fileDb.saveOTP(otpDoc);
}

export async function getOTP(email: string, purpose: OTPPurpose): Promise<OTPDocument | null> {
  const isMongoUp = await checkMongoHealth();
  
  if (isMongoUp && mongoDb) {
    try {
      const { otp } = getCollections(mongoDb);
      // Don't filter by 'used' so we can check verification status
      const otpDoc = await otp.findOne({ 
        email, 
        purpose,
        expiresAt: { $gt: Date.now() },
      });
      return otpDoc;
    } catch (error) {
      console.warn('MongoDB OTP query failed, using file fallback');
    }
  }
  
  return fileDb.getOTP(email, purpose);
}

export async function markOTPUsed(email: string, purpose: OTPPurpose): Promise<void> {
  const isMongoUp = await checkMongoHealth();
  
  if (isMongoUp && mongoDb) {
    try {
      const { otp } = getCollections(mongoDb);
      await otp.updateOne(
        { email, purpose },
        { $set: { used: true } }
      );
      return;
    } catch (error) {
      console.warn('MongoDB OTP update failed, using file fallback');
    }
  }
  
  fileDb.updateOTP(email, purpose, { used: true });
}

export async function incrementOTPAttempts(email: string, purpose: OTPPurpose): Promise<number> {
  const isMongoUp = await checkMongoHealth();
  
  if (isMongoUp && mongoDb) {
    try {
      const { otp } = getCollections(mongoDb);
      const result = await otp.findOneAndUpdate(
        { email, purpose },
        { $inc: { attempts: 1 } },
        { returnDocument: 'after' }
      );
      return result?.attempts || 0;
    } catch (error) {
      console.warn('MongoDB OTP update failed, using file fallback');
    }
  }
  
  const otpDoc = fileDb.getOTP(email, purpose);
  if (otpDoc) {
    const newAttempts = (otpDoc.attempts || 0) + 1;
    fileDb.updateOTP(email, purpose, { attempts: newAttempts });
    return newAttempts;
  }
  return 0;
}

// ============================================
// Transaction Operations
// ============================================

export async function logTransaction(tx: TransactionDocument): Promise<void> {
  const isMongoUp = await checkMongoHealth();
  
  if (isMongoUp && mongoDb) {
    try {
      const { transactions } = getCollections(mongoDb);
      await transactions.insertOne(tx);
      return;
    } catch (error) {
      console.warn('MongoDB transaction insert failed, using file fallback');
    }
  }
  
  fileDb.logTransaction(tx);
}

export async function getTransactions(
  username: string, 
  limit: number = 50
): Promise<TransactionDocument[]> {
  const isMongoUp = await checkMongoHealth();
  
  if (isMongoUp && mongoDb) {
    try {
      const { transactions } = getCollections(mongoDb);
      return await transactions
        .find({ username })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    } catch (error) {
      console.warn('MongoDB transaction query failed, using file fallback');
    }
  }
  
  return fileDb.getTransactions(username, limit);
}

// ============================================
// Balance Operations (with transaction logging)
// ============================================

export async function updateBalance(
  username: string,
  currency: 'fermentedMangos' | 'expiredJuice' | 'mangos' | 'mangoJuice',
  amount: number,
  type: TransactionDocument['type'],
  details?: string,
  roundNumber?: number
): Promise<{ success: boolean; newBalance: number }> {
  const user = await getUserByUsername(username);
  if (!user) {
    return { success: false, newBalance: 0 };
  }
  
  const currentBalance = user[currency];
  const newBalance = currentBalance + amount;
  
  // Prevent negative balance
  if (newBalance < 0) {
    return { success: false, newBalance: currentBalance };
  }
  
  // Update user balance
  const updated = await updateUser(username, { [currency]: newBalance });
  if (!updated) {
    return { success: false, newBalance: currentBalance };
  }
  
  // Log transaction
  const currencyMap: Record<typeof currency, TransactionDocument['currency']> = {
    fermentedMangos: 'fermentedMango',
    expiredJuice: 'expiredJuice',
    mangos: 'mango',
    mangoJuice: 'mangoJuice',
  };
  
  await logTransaction({
    username,
    type,
    currency: currencyMap[currency],
    amount,
    balanceAfter: newBalance,
    timestamp: Date.now(),
    roundNumber,
    details,
  });
  
  return { success: true, newBalance };
}

// ============================================
// Force database check
// ============================================

export async function forceMongoCheck(): Promise<boolean> {
  lastHealthCheck = 0;
  return checkMongoHealth();
}

export function isUsingMongo(): boolean {
  return mongoAvailable;
}
