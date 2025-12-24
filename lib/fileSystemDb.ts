import * as fs from 'fs';
import * as path from 'path';
import { UserDocument, TransactionDocument, OTPDocument } from './db';

// Base directory for file-based storage
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const USERS_DIR = path.join(DATA_DIR, 'users');
const TRANSACTIONS_DIR = path.join(DATA_DIR, 'transactions');
const OTP_DIR = path.join(DATA_DIR, 'otp');
const SYNC_QUEUE_FILE = path.join(DATA_DIR, 'sync_queue.json');

// ============================================
// Initialize directories
// ============================================

export function initializeFileSystem(): void {
  const dirs = [DATA_DIR, USERS_DIR, TRANSACTIONS_DIR, OTP_DIR];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Initialize sync queue if not exists
  if (!fs.existsSync(SYNC_QUEUE_FILE)) {
    fs.writeFileSync(SYNC_QUEUE_FILE, JSON.stringify({ pending: [] }));
  }
}

// ============================================
// Sync Queue Management
// ============================================

interface SyncQueueItem {
  id: string;
  operation: 'insert' | 'update' | 'delete';
  collection: string;
  data: Record<string, unknown>;
  timestamp: number;
}

interface SyncQueue {
  pending: SyncQueueItem[];
}

export function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): void {
  initializeFileSystem();
  const queue = getSyncQueue();
  queue.pending.push({
    ...item,
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  });
  fs.writeFileSync(SYNC_QUEUE_FILE, JSON.stringify(queue, null, 2));
}

export function getSyncQueue(): SyncQueue {
  initializeFileSystem();
  const content = fs.readFileSync(SYNC_QUEUE_FILE, 'utf-8');
  return JSON.parse(content);
}

export function clearSyncQueue(): void {
  fs.writeFileSync(SYNC_QUEUE_FILE, JSON.stringify({ pending: [] }));
}

export function removeSyncQueueItem(id: string): void {
  const queue = getSyncQueue();
  queue.pending = queue.pending.filter(item => item.id !== id);
  fs.writeFileSync(SYNC_QUEUE_FILE, JSON.stringify(queue, null, 2));
}

// ============================================
// User Operations
// ============================================

function getUserFilePath(username: string): string {
  // Sanitize username for file system
  const safeUsername = username.replace(/[^a-zA-Z0-9_@]/g, '_');
  return path.join(USERS_DIR, `${safeUsername}.json`);
}

export function saveUser(user: UserDocument): void {
  initializeFileSystem();
  const filePath = getUserFilePath(user.username);
  fs.writeFileSync(filePath, JSON.stringify(user, null, 2));
  
  // Add to sync queue for MongoDB
  addToSyncQueue({
    operation: 'insert',
    collection: 'users',
    data: user as unknown as Record<string, unknown>,
  });
}

export function getUser(username: string): UserDocument | null {
  const filePath = getUserFilePath(username);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

export function updateUser(username: string, updates: Partial<UserDocument>): boolean {
  const user = getUser(username);
  if (!user) return false;
  
  const updatedUser = { ...user, ...updates };
  const filePath = getUserFilePath(username);
  fs.writeFileSync(filePath, JSON.stringify(updatedUser, null, 2));
  
  // Add to sync queue
  addToSyncQueue({
    operation: 'update',
    collection: 'users',
    data: { username, updates } as unknown as Record<string, unknown>,
  });
  
  return true;
}

export function getUserByEmail(emailHash: string): UserDocument | null {
  initializeFileSystem();
  const files = fs.readdirSync(USERS_DIR);
  
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const filePath = path.join(USERS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const user: UserDocument = JSON.parse(content);
    // Note: This requires storing emailHash in user document for lookup
    if ((user as UserDocument & { emailHash?: string }).emailHash === emailHash) {
      return user;
    }
  }
  
  return null;
}

// ============================================
// OTP Operations
// ============================================

function getOTPFilePath(email: string, purpose: string): string {
  const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
  return path.join(OTP_DIR, `${safeEmail}_${purpose}.json`);
}

export function saveOTP(otpDoc: OTPDocument): void {
  initializeFileSystem();
  const filePath = getOTPFilePath(otpDoc.email, otpDoc.purpose);
  fs.writeFileSync(filePath, JSON.stringify(otpDoc, null, 2));
}

export function getOTP(email: string, purpose: string): OTPDocument | null {
  const filePath = getOTPFilePath(email, purpose);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const otp: OTPDocument = JSON.parse(content);
  
  // Check if expired
  if (otp.expiresAt < Date.now()) {
    fs.unlinkSync(filePath);
    return null;
  }
  
  return otp;
}

export function updateOTP(email: string, purpose: string, updates: Partial<OTPDocument>): boolean {
  const otp = getOTP(email, purpose);
  if (!otp) return false;
  
  const updatedOTP = { ...otp, ...updates };
  const filePath = getOTPFilePath(email, purpose);
  fs.writeFileSync(filePath, JSON.stringify(updatedOTP, null, 2));
  return true;
}

export function deleteOTP(email: string, purpose: string): void {
  const filePath = getOTPFilePath(email, purpose);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// ============================================
// Transaction Operations
// ============================================

export function logTransaction(tx: TransactionDocument): void {
  initializeFileSystem();
  
  // Create file per user per day
  const date = new Date(tx.timestamp).toISOString().split('T')[0];
  const safeUsername = tx.username.replace(/[^a-zA-Z0-9_@]/g, '_');
  const filePath = path.join(TRANSACTIONS_DIR, `${safeUsername}_${date}.json`);
  
  let transactions: TransactionDocument[] = [];
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    transactions = JSON.parse(content);
  }
  
  transactions.push(tx);
  fs.writeFileSync(filePath, JSON.stringify(transactions, null, 2));
  
  // Add to sync queue
  addToSyncQueue({
    operation: 'insert',
    collection: 'transactions',
    data: tx as unknown as Record<string, unknown>,
  });
}

export function getTransactions(username: string, limit: number = 50): TransactionDocument[] {
  initializeFileSystem();
  
  const safeUsername = username.replace(/[^a-zA-Z0-9_@]/g, '_');
  const files = fs.readdirSync(TRANSACTIONS_DIR)
    .filter(f => f.startsWith(safeUsername) && f.endsWith('.json'))
    .sort()
    .reverse(); // Most recent first
  
  const transactions: TransactionDocument[] = [];
  
  for (const file of files) {
    if (transactions.length >= limit) break;
    
    const filePath = path.join(TRANSACTIONS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileTx: TransactionDocument[] = JSON.parse(content);
    transactions.push(...fileTx);
  }
  
  return transactions
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

// ============================================
// Health Check
// ============================================

export function isFileSystemHealthy(): boolean {
  try {
    initializeFileSystem();
    const testFile = path.join(DATA_DIR, '.health_check');
    fs.writeFileSync(testFile, Date.now().toString());
    fs.unlinkSync(testFile);
    return true;
  } catch {
    return false;
  }
}
